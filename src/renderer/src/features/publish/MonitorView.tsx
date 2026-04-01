import { useReducer, useCallback, useEffect, useMemo, useRef, startTransition } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { spring } from "../../shared/springs";
import { mergeExecutionProgress, statusTone } from "../../shared/domain/publish-stages";
import { useApi } from "../../app/ApiContext";
import { useAccounts } from "../../app/AccountsContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useEventStream } from "../../shared/hooks/useEventStream";
import { useMutation } from "../../shared/hooks/useMutation";
import { Badge } from "../../shared/components/Badge";
import { Spinner } from "../../shared/components/Spinner";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { ExecutionCard } from "./ExecutionCard";
import type { PublishQueueDetails, PublishQueueExecutionDetails, PublishQueueEventPayload } from "../../contracts/publish-queue";

/** Events that warrant a full queue refetch (structural changes, not progress) */
const REFETCH_EVENTS = new Set([
  "queue.created",
  "queue.started",
  "queue.execution.started",
  "queue.completed",
  "queue.execution.completed",
  "queue.execution.failed",
]);

interface MonitorViewProps {
  queueId: string;
  onNewPublish: () => void;
  onTerminalChange?: (isTerminal: boolean) => void;
}

type State = {
  queue: PublishQueueDetails | null;
  executions: Map<string, Partial<PublishQueueExecutionDetails>>;
};

type Action =
  | { type: "init"; queue: PublishQueueDetails }
  | { type: "sse"; event: string; payload: PublishQueueEventPayload };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init": {
      const nextExecutions = new Map<string, Partial<PublishQueueExecutionDetails>>();

      for (const item of action.queue.items) {
        for (const execution of item.executions ?? []) {
          const prev = state.executions.get(execution.executionId) ?? {};
          nextExecutions.set(
            execution.executionId,
            mergeExecutionProgress(prev, {
              status: execution.status,
              stage: execution.stage,
              progressText: execution.progressText,
              progressValue: execution.progressValue,
              bytesSent: execution.bytesSent,
              bytesTotal: execution.bytesTotal,
              lastError: execution.lastError,
            }),
          );
        }
      }

      return { queue: action.queue, executions: nextExecutions };
    }
    case "sse": {
      const { payload } = action;
      const exId = payload.executionId;
      if (!exId) return state;
      const prev = state.executions.get(exId) ?? {};
      const next = new Map(state.executions);
      next.set(exId, mergeExecutionProgress(prev, payload));
      return { ...state, executions: next };
    }
  }
}

export function MonitorView({ queueId, onNewPublish, onTerminalChange }: MonitorViewProps) {
  const { t } = useTranslation(["publish", "history"]);
  const api = useApi();
  const { accounts } = useAccounts();
  const { navigate } = useNavigation();

  const [state, dispatch] = useReducer(reducer, { queue: null, executions: new Map() });

  const { loading, error, refetch } = useQuery(
    (signal) =>
      api.publishQueue.get(queueId, signal).then((q) => {
        dispatch({ type: "init", queue: q });
        return q;
      }),
    [queueId],
  );

  // Debounce SSE-triggered refetches to coalesce rapid event bursts
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedRefetch = useCallback(() => {
    clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => refetch(), 300);
  }, [refetch]);
  useEffect(() => () => clearTimeout(refetchTimerRef.current), []);

  const handleSseEvent = useCallback(
    (event: string, payload: PublishQueueEventPayload) => {
      startTransition(() => {
        dispatch({ type: "sse", event, payload });
      });

      if (REFETCH_EVENTS.has(event)) {
        debouncedRefetch();
      }
    },
    [debouncedRefetch],
  );

  const { connected: sseConnected } = useEventStream(
    () => {
      if (!queueId) return null;
      return api.publishQueue.stream(queueId, { onEvent: handleSseEvent });
    },
    [queueId, handleSseEvent],
  );

  const retryMut = useMutation(() => api.publishQueue.retryFailed(queueId));

  const queue = state.queue;

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.accountId, a.displayName);
    return map;
  }, [accounts]);

  const allExecutions = useMemo(
    () => {
      if (!queue) return [];
      return queue.items.flatMap((item) =>
        (item.executions ?? []).map((ex) => {
          const live = state.executions.get(ex.executionId);
          return {
            ...ex,
            ...live,
            artifactName: item.name,
            accountName: accountNameMap.get(ex.accountId) ?? ex.accountId.slice(0, 8),
          } as PublishQueueExecutionDetails & { artifactName: string; accountName: string };
        }),
      );
    },
    [queue, state.executions, accountNameMap],
  );

  const queueStatus = queue?.status ?? "queued";
  const isCompleted =
    queueStatus === "completed"
    || queueStatus === "succeeded"
    || queueStatus === "failed"
    || queueStatus === "partially_failed"
    || queueStatus === "completed_with_failures"
    || queueStatus === "cancelled";

  useEffect(() => {
    onTerminalChange?.(isCompleted);
  }, [isCompleted, onTerminalChange]);

  // Polling fallback — reduced frequency when SSE is active, faster when disconnected
  useEffect(() => {
    if (!queue || isCompleted) return;

    const interval = sseConnected ? 10000 : 2500;
    const timer = window.setInterval(() => {
      refetch();
    }, interval);

    return () => window.clearInterval(timer);
  }, [queue, isCompleted, sseConnected, refetch]);

  if (loading && !queue) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>;
  }
  if (error && !queue) return <ErrorBanner error={error} onRetry={refetch} />;
  if (!queue) return null;

  const hasFailed =
    queue.executionFailedCount > 0
    || queue.failedCount > 0
    || queue.status === "completed_with_failures";

  return (
    <div className="monitor-view">
      <div className="monitor-header">
        <div>
          <h2 style={{ margin: 0, font: "600 18px var(--font)" }}>{queue.name}</h2>
          <Badge tone={statusTone(queue.status)}>{queue.status}</Badge>
        </div>
        <span className="monitor-progress">
          {queue.executionSuccessCount} / {queue.executionCount}
        </span>
      </div>

      <div className="execution-list">
        {allExecutions.map((ex) => (
          <ExecutionCard
            key={ex.executionId}
            execution={ex}
            accountName={ex.accountName}
            artifactName={ex.artifactName}
          />
        ))}
      </div>

      {isCompleted && (
        <motion.div
          className="monitor-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
        >
          {hasFailed && (
            <motion.button
              className="btn btn-primary"
              onClick={async () => {
                try { await retryMut.execute(); }
                catch { /* handled */ }
              }}
              disabled={retryMut.loading}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
            >
              {retryMut.loading ? <Spinner size={14} /> : t("history:retryFailed")}
            </motion.button>
          )}
          <motion.button
            className="btn btn-secondary"
            onClick={() => navigate("home")}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {t("history:backHome")}
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={onNewPublish}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {t("history:publishAgain")}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
