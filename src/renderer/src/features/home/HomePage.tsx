import { useCallback, startTransition, useState, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Send, Plus, ArrowUpRight, Cloud, HardDrive, Users, Check } from "lucide-react";
import { spring, makeStagger, fadeIn } from "../../shared/springs";
import { getPhaseLabels, resolveStatusText, statusTone, mergeExecutionProgress } from "../../shared/domain/publish-stages";
import { useApi } from "../../app/ApiContext";
import { useActivePublish } from "../../app/ActivePublishContext";
import { useConnection } from "../../app/ConnectionContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useEventStream } from "../../shared/hooks/useEventStream";
import { usePageActivationRefresh } from "../../shared/hooks/usePageActivationRefresh";
import { AnimatedNumber } from "../../shared/components/AnimatedNumber";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { formatBytes } from "../../shared/format/bytes";
import { formatDateTime } from "../../shared/format/date-time";
import { resolveLocalizedText } from "../../i18n/localized-text";
import type { HomeFocusExecution } from "../../contracts/home";
import type { PublishQueueEventPayload } from "../../contracts/publish-queue";

const homeStagger = makeStagger(0.06);
const modKey = typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent) ? "⌘" : "Ctrl";

const avatarColors = [
  "linear-gradient(135deg, #5A8FA3, #3D7A90)",
  "linear-gradient(135deg, #6A9E8A, #4D8B73)",
  "linear-gradient(135deg, #8A88A3, #6E6B90)",
  "linear-gradient(135deg, #A38A5A, #907A3D)",
  "linear-gradient(135deg, #8A5A8A, #6E3D6E)",
];

export function HomePage() {
  const { t } = useTranslation(["home"]);
  const api = useApi();
  const { activeQueueId, setActiveQueueId, clearActiveQueueId } = useActivePublish();
  const { navigate, activePage } = useNavigation();

  const { refreshKey } = useConnection();

  const { data: overview, error, refetch } = useQuery(
    (signal) => api.home.getOverview(8, signal),
    [refreshKey],
  );
  const {
    data: recentActivities,
    error: recentActivitiesError,
    refetch: refetchRecentActivities,
  } = useQuery(
    (signal) => api.home.getRecentActivities(8, signal),
    [refreshKey],
  );
  const refreshHome = useCallback(() => {
    refetch();
    refetchRecentActivities();
  }, [refetch, refetchRecentActivities]);
  usePageActivationRefresh("home", refreshHome);

  const [liveFocus, setLiveFocus] = useState<Partial<HomeFocusExecution> | null>(null);
  const [dismissedQueueId, setDismissedQueueId] = useState<string | null>(null);

  const queueId = overview?.activeQueue?.queueId ?? activeQueueId ?? null;

  // Debounce SSE-triggered refetches to coalesce rapid event bursts
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedRefreshHome = useCallback(() => {
    clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => refreshHome(), 300);
  }, [refreshHome]);
  useEffect(() => () => clearTimeout(refetchTimerRef.current), []);

  const handleSseEvent = useCallback(
    (eventName: string, payload: PublishQueueEventPayload) => {
      startTransition(() => {
        setLiveFocus((prev) => mergeExecutionProgress(prev ?? {}, payload));
      });

      if (eventName === "queue.completed") {
        setDismissedQueueId(payload.queueId ?? queueId ?? null);
        setLiveFocus(null);
        clearActiveQueueId();
      }

      if (
        eventName === "queue.started"
        || eventName === "queue.execution.started"
        || eventName === "queue.execution.completed"
        || eventName === "queue.execution.failed"
        || eventName === "queue.completed"
      ) {
        debouncedRefreshHome();
      }
    },
    [debouncedRefreshHome, clearActiveQueueId, queueId],
  );

  const { connected: sseConnected } = useEventStream(
    () => {
      if (!queueId) return null;
      return api.publishQueue.stream(queueId, { onEvent: handleSseEvent });
    },
    [queueId, handleSseEvent],
  );

  useEffect(() => {
    setLiveFocus(null);
    setDismissedQueueId(null);
  }, [queueId]);

  useEffect(() => {
    const overviewQueueId = overview?.activeQueue?.queueId ?? null;
    if (overviewQueueId) {
      setActiveQueueId(overviewQueueId);
    }
  }, [overview?.activeQueue?.queueId, setActiveQueueId]);

  // Polling fallback — reduced frequency when SSE is active, faster when disconnected
  useEffect(() => {
    if (activePage !== "home" || !queueId) return;

    const interval = sseConnected ? 10000 : 2500;
    const timer = window.setInterval(() => {
      refreshHome();
    }, interval);

    return () => window.clearInterval(timer);
  }, [activePage, queueId, sseConnected, refreshHome]);

  const stats = overview?.stats;
  const activeQueue =
    overview?.activeQueue && overview.activeQueue.queueId !== dismissedQueueId
      ? overview.activeQueue
      : null;
  const focus = useMemo(() => {
    const base = activeQueue?.focusExecution;
    if (!base) return liveFocus as HomeFocusExecution | null;
    return { ...base, ...liveFocus } as HomeFocusExecution;
  }, [activeQueue?.focusExecution, liveFocus]);

  const activities = recentActivities ?? [];
  const phaseLabels = getPhaseLabels();

  return (
    <motion.div
      className="home"
      variants={homeStagger}
      initial="hidden"
      animate="show"
    >
      <div className="bento">
        <div className="bento-orb bento-orb--1" />
        <div className="bento-orb bento-orb--2" />

        {/* 统计条 */}
        <motion.div className="card stat-bar bento-col-12" variants={fadeIn}>
          {error && !stats ? (
            <ErrorBanner error={error} onRetry={refetch} />
          ) : (
            <>
              <div className="stat-bar-items">
                <div className="stat-bar-item">
                  <Cloud size={14} strokeWidth={1.5} className="stat-bar-icon" />
                  <AnimatedNumber value={stats?.cloudAvatarCount ?? 0} className="stat-bar-number" />
                  <span className="stat-bar-label">{t("home:stats.cloudModels")}</span>
                </div>
                <div className="stat-bar-divider" />
                <div className="stat-bar-item">
                  <HardDrive size={14} strokeWidth={1.5} className="stat-bar-icon" />
                  <AnimatedNumber value={stats?.localArtifactCount ?? 0} className="stat-bar-number" />
                  <span className="stat-bar-label">{t("home:stats.localModels")}</span>
                </div>
                <div className="stat-bar-divider" />
                <div className="stat-bar-item">
                  <Users size={14} strokeWidth={1.5} className="stat-bar-icon" />
                  <AnimatedNumber value={stats?.connectedAccountCount ?? 0} className="stat-bar-number" />
                  <span className="stat-bar-label">{t("home:stats.connectedAccounts")}</span>
                </div>
              </div>
              <div className="stat-bar-actions">
                <motion.button
                  className="btn btn-primary"
                  onClick={() => navigate("publish")}
                  whileTap={{ scale: 0.97 }}
                  transition={spring.snappy}
                >
                  <Send size={13} strokeWidth={1.75} /> {t("home:actions.publish")}
                </motion.button>
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => navigate("library")}
                  whileTap={{ scale: 0.97 }}
                  transition={spring.snappy}
                >
                  <Plus size={13} strokeWidth={1.75} /> {t("home:actions.import")}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>

        {/* 进行中任务 — 仅当 activeQueue 存在时渲染 */}
        {activeQueue && focus && (
          <motion.div className="card card-active task-card bento-col-12" variants={fadeIn}>
            <div className="task-header">
              <div className="task-header-left">
                <span className="task-name">{activeQueue.name}</span>
                <span className="task-detail">
                  {t("home:activeQueue.publishToAccounts", { count: activeQueue.executionCount })}
                </span>
              </div>
              <span className="task-fraction">
                {activeQueue.executionSuccessCount}
                <span className="task-fraction-sep">/</span>
                {activeQueue.executionCount}
              </span>
            </div>

            <div className="pipeline">
              {phaseLabels.map((label, i) => {
                const done = i < (focus.phaseIndex ?? 0);
                const active = i === (focus.phaseIndex ?? 0);
                return (
                  <div
                    key={label}
                    className={`pipeline-stage ${done ? "pipeline-stage--done" : ""} ${active ? "pipeline-stage--active" : ""}`}
                  >
                    <div className="pipeline-dot">
                      {done ? <Check size={10} strokeWidth={2.5} /> : null}
                    </div>
                    <span className="pipeline-label">{label}</span>
                    {i < phaseLabels.length - 1 && (
                      <div className={`pipeline-line ${done ? "pipeline-line--done" : ""}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <ProgressBar value={focus.progressValue ?? null} />

            <div className="task-footer">
              <div className="task-avatars">
                {activeQueue.accounts.slice(0, 5).map((acc, i) => (
                  <div
                    key={acc.accountId}
                    className="task-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {(acc.accountDisplayName?.[0] ?? "?").toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="task-status">
                <motion.span
                  className="task-status-dot"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {resolveStatusText(null, focus.progressText, focus.stage, focus.status ?? "pending")}
                {focus.bytesSent != null && focus.bytesTotal != null && (
                  <> · {formatBytes(focus.bytesSent)} / {formatBytes(focus.bytesTotal)}</>
                )}
              </span>
            </div>
          </motion.div>
        )}

        {/* 最近活动 */}
        <motion.div className="card activity-card bento-col-12" variants={fadeIn}>
            <div className="activity-header">
            <span className="section-label">{t("home:recent.section")}</span>
            <button className="btn btn-ghost" onClick={() => navigate("history")}>
              {t("home:recent.all")} <ArrowUpRight size={11} strokeWidth={2} />
            </button>
          </div>
          <div className="timeline">
            {activities.length === 0 ? (
              recentActivitiesError ? (
                <ErrorBanner error={recentActivitiesError} onRetry={refetchRecentActivities} />
              ) : (
                <div style={{ padding: "16px 0", color: "var(--fg-faint)", fontSize: 13 }}>
                  {t("home:recent.empty")}
                </div>
              )
            ) : (
              activities.map((item) => (
                <div
                  key={item.activityId}
                  className="timeline-item"
                  onClick={() => navigate("history", item.runId ? { historyRunId: item.runId } : undefined)}
                >
                  <div className="timeline-dot-wrap">
                    <span className={`timeline-dot timeline-dot--${statusTone(item.status)}`} />
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-title">{resolveLocalizedText(item.titleText, item.title) ?? item.title}</span>
                    <span className="timeline-detail">{resolveLocalizedText(item.subtitleText, item.subtitle) ?? item.subtitle}</span>
                  </div>
                  <span className="timeline-time">{formatDateTime(item.occurredAt)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="home-shortcuts" variants={fadeIn}>
        <span className="shortcut-hint"><kbd>{modKey}</kbd><kbd>N</kbd> {t("home:shortcuts.newPublish")}</span>
        <span className="shortcut-hint"><kbd>{modKey}</kbd><kbd>I</kbd> {t("home:shortcuts.importModel")}</span>
        <span className="shortcut-hint"><kbd>{modKey}</kbd><kbd>K</kbd> {t("home:shortcuts.quickSearch")}</span>
      </motion.div>
    </motion.div>
  );
}
