import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { History, RotateCcw, X, ArrowUpRight, ChevronRight, ChevronLeft } from "lucide-react";
import { spring, makeStagger, fadeIn } from "../../shared/springs";
import { useApi } from "../../app/ApiContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { usePageActivationRefresh } from "../../shared/hooks/usePageActivationRefresh";
import { Badge } from "../../shared/components/Badge";
import { EmptyState } from "../../shared/components/EmptyState";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { Spinner } from "../../shared/components/Spinner";
import { statusTone } from "../../shared/domain/publish-stages";
import { formatDateTime } from "../../shared/format/date-time";

const listStagger = makeStagger(0.03);
const PAGE_SIZE = 15;

type ActivityItem = {
  id: string;
  type: "run" | "activity";
  title: string;
  subtitle: string;
  time: string;
  status: string;
  runId: string | null;
};

function outcomeTone(outcome: string) {
  if (outcome === "succeeded" || outcome === "completed") return "ok" as const;
  if (outcome === "failed") return "err" as const;
  return "warn" as const;
}

export function HistoryPage() {
  const api = useApi();
  const { activePage, navigationTick, consumePayload, navigate } = useNavigation();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const { data: runsData, error: runsError, loading: runsLoading, refetch: refetchRuns } =
    useQuery((signal) => api.runs.list(signal), []);

  const { data: overview, refetch: refetchOverview } =
    useQuery((signal) => api.home.getOverview(100, signal), []);

  usePageActivationRefresh("history", () => { refetchRuns(); refetchOverview(); });

  // 合并 + 去重 + 按时间排序
  const allItems = useMemo<ActivityItem[]>(() => {
    const runItems: ActivityItem[] = (runsData?.items ?? []).map((r) => ({
      id: `run-${r.runId}`,
      type: "run" as const,
      title: r.name,
      subtitle: `成功 ${r.successCount} · 失败 ${r.failedCount}`,
      time: r.createdAt,
      status: r.status,
      runId: r.runId,
    }));

    const activityItems: ActivityItem[] = (overview?.recentActivities ?? [])
      .filter((a) => a.type !== "publish_queue")
      .map((a) => ({
        id: `act-${a.activityId}`,
        type: "activity" as const,
        title: a.title,
        subtitle: a.subtitle,
        time: a.occurredAt,
        status: a.status,
        runId: null,
      }));

    return [...runItems, ...activityItems].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [runsData, overview]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const pageItems = allItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // 从首页跳转：用 historyRunId 直接打开，或用 title 模糊匹配 run
  useEffect(() => {
    if (activePage !== "history") return;
    const payload = consumePayload();
    if (!payload) return;

    if (payload.historyRunId) {
      setSelectedRunId(payload.historyRunId);
      return;
    }
  }, [activePage, navigationTick, consumePayload]);

  const loading = runsLoading && allItems.length === 0;

  return (
    <div className="history-page">
      <motion.div
        className="history-page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h1>历史</h1>
        <motion.button
          className="btn btn-secondary"
          onClick={() => { refetchRuns(); refetchOverview(); }}
          whileTap={{ scale: 0.97 }}
          transition={spring.snappy}
        >
          刷新
        </motion.button>
      </motion.div>

      {loading ? (
        <div className="history-loading"><Spinner /></div>
      ) : runsError && allItems.length === 0 ? (
        <ErrorBanner error={runsError} onRetry={refetchRuns} />
      ) : allItems.length === 0 ? (
        <EmptyState
          icon={<History size={32} strokeWidth={1.5} />}
          message="还没有任何活动"
          action={{ label: "去发布", onClick: () => navigate("publish") }}
        />
      ) : (
        <>
          <motion.div
            className="history-list"
            variants={listStagger}
            initial="hidden"
            animate="show"
            key={page}
          >
            {pageItems.map((item) => {
              const tone = statusTone(item.status);
              const clickable = item.type === "run";
              return (
                <motion.div
                  key={item.id}
                  className={`card history-item ${clickable ? "history-item--clickable" : ""}`}
                  variants={fadeIn}
                  onClick={clickable ? () => setSelectedRunId(item.runId!) : undefined}
                >
                  <div className="history-item-left">
                    <span className={`history-item-dot history-item-dot--${tone}`} />
                    <div className="history-item-info">
                      <span className="history-item-name">{item.title}</span>
                      <span className="history-item-sub">{item.subtitle}</span>
                    </div>
                  </div>
                  <div className="history-item-right">
                    <span className="history-item-time">{formatDateTime(item.time)}</span>
                    {clickable && <ChevronRight size={14} strokeWidth={1.75} className="history-item-chevron" />}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="history-pagination">
              <motion.button
                className="btn btn-ghost btn-icon"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                whileTap={{ scale: 0.97 }}
                transition={spring.snappy}
              >
                <ChevronLeft size={16} strokeWidth={1.75} />
              </motion.button>
              <span className="history-pagination-info">
                {page + 1} / {totalPages}
              </span>
              <motion.button
                className="btn btn-ghost btn-icon"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                whileTap={{ scale: 0.97 }}
                transition={spring.snappy}
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </motion.button>
            </div>
          )}
        </>
      )}

      {selectedRunId && (
        <RunDetailModal
          runId={selectedRunId}
          onClose={() => setSelectedRunId(null)}
          onRetried={(newRunId) => { setSelectedRunId(newRunId); refetchRuns(); }}
        />
      )}
    </div>
  );
}

function RunDetailModal({ runId, onClose, onRetried }: { runId: string; onClose: () => void; onRetried: (id: string) => void }) {
  const api = useApi();
  const { navigate } = useNavigation();
  const { data, loading, error } = useQuery((s) => api.runs.get(runId, s), [runId]);
  const retryMut = useMutation(() => api.runs.retryFailed(runId));

  useEffect(() => {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (sw > 0) document.body.style.paddingRight = `${sw}px`;
    return () => { document.body.style.overflow = ""; document.body.style.paddingRight = ""; };
  }, []);

  const hasFailedAccounts = (data?.accounts ?? []).some((a) => a.outcome === "failed");

  return createPortal(
    <motion.div className="detail-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose}>
      <motion.div className="run-detail-modal" initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }} transition={spring.smooth} onClick={(e) => e.stopPropagation()}>
        <button className="detail-modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} strokeWidth={1.75} /></button>
        {loading && !data ? <div className="run-detail-loading"><Spinner /></div>
        : error && !data ? <div className="run-detail-loading"><ErrorBanner error={error} /></div>
        : data ? (
          <div className="run-detail-content">
            <div className="run-detail-header">
              <div>
                <h2 className="run-detail-title">{data.name}</h2>
                <span className="run-detail-meta">{formatDateTime(data.createdAt)}{data.retryOfRunId && <> · 重试自 {data.retryOfRunId.slice(0, 8)}</>}</span>
              </div>
              <Badge tone={statusTone(data.status)}>{data.status}</Badge>
            </div>
            {data.description && <p className="run-detail-desc">{data.description}</p>}
            {data.tags.length > 0 && <div className="run-detail-tags">{data.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</div>}
            <div className="run-detail-accounts">
              <div className="section-label" style={{ marginBottom: 8 }}>账号执行结果</div>
              {data.accounts.map((a) => (
                <div key={a.accountId} className="run-detail-account">
                  <div className="run-detail-account-main">
                    <span className="run-detail-account-name">{a.displayName ?? a.accountId.slice(0, 12)}</span>
                    <span className="run-detail-account-stage">{a.stage}</span>
                  </div>
                  <Badge tone={outcomeTone(a.outcome)}>{a.outcome}</Badge>
                  {a.errorMessage && <div className="run-detail-account-error">{a.errorMessage}</div>}
                </div>
              ))}
            </div>
            <div className="run-detail-actions">
              {hasFailedAccounts && (
                <motion.button className="btn btn-primary" onClick={async () => { try { const r = await retryMut.execute(); onRetried(r.runId); } catch {} }} disabled={retryMut.loading} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
                  {retryMut.loading ? <Spinner size={14} /> : <><RotateCcw size={14} strokeWidth={1.75} /> 重试失败项</>}
                </motion.button>
              )}
              <motion.button className="btn btn-secondary" onClick={() => { navigate("publish"); onClose(); }} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
                <ArrowUpRight size={14} strokeWidth={1.75} /> 去发布页
              </motion.button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
