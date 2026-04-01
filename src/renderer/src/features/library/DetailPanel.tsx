import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { X, Send, FolderOpen, Trash2, Download, Layers, UserCheck, Image as ImageIcon } from "lucide-react";
import { spring } from "../../shared/springs";
import { resolveSaveToLibraryStatusText } from "../../shared/domain/publish-stages";
import { useApi } from "../../app/ApiContext";
import { useNavigation } from "../../app/NavigationContext";
import { useQuery } from "../../shared/hooks/useQuery";
import { useMutation } from "../../shared/hooks/useMutation";
import { useEventStream } from "../../shared/hooks/useEventStream";
import { useLocalImage } from "../../shared/hooks/useLocalImage";
import { Spinner } from "../../shared/components/Spinner";
import { Badge } from "../../shared/components/Badge";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { ErrorBanner } from "../../shared/components/ErrorBanner";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { revealPath, pickSingleFile } from "../../lib/desktop";
import { formatBytes } from "../../shared/format/bytes";
import { formatDateTime } from "../../shared/format/date-time";
import type { SaveToLibraryTask } from "../../contracts/save-to-library";

interface DetailPanelProps {
  type: "local" | "cloud";
  id: string;
  accountId?: string;
  /** 从网格卡片已知的图片 URL，API 加载完成前先展示 */
  previewImageUrl?: string | null;
  onClose: () => void;
  onDeleted: () => void;
  onImported?: () => void;
  onUpdated?: () => void;
}

export function DetailPanel({ type, id, accountId, previewImageUrl, onClose, onDeleted, onImported, onUpdated }: DetailPanelProps) {
  return createPortal(
    <motion.div
      className="detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        className="detail-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={spring.smooth}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-modal-close btn btn-ghost btn-icon" onClick={onClose}>
          <X size={16} strokeWidth={1.75} />
        </button>
        {type === "local" ? (
          <LocalDetail artifactId={id} previewImageUrl={previewImageUrl} onClose={onClose} onDeleted={onDeleted} onUpdated={onUpdated} />
        ) : accountId ? (
          <CloudDetail avatarId={id} accountId={accountId} previewImageUrl={previewImageUrl} onClose={onClose} onDeleted={onDeleted} onImported={onImported} />
        ) : null}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function CoverImage({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="detail-cover">
      {src ? (
        <img key={src} src={src} alt={alt} />
      ) : (
        <div className="detail-cover-placeholder">
          <Layers size={36} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

function LocalDetail({ artifactId, previewImageUrl, onClose, onDeleted, onUpdated }: { artifactId: string; previewImageUrl?: string | null; onClose: () => void; onDeleted: () => void; onUpdated?: () => void }) {
  const { t } = useTranslation(["library", "common", "accounts"]);
  const api = useApi();
  const { navigate } = useNavigation();
  const { data, loading, error, refetch } = useQuery((s) => api.artifacts.get(artifactId, s), [artifactId]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeMut = useMutation(() => api.artifacts.remove(artifactId));
  const updateMut = useMutation((input: { name?: string; thumbnailPath?: string }) =>
    api.artifacts.update(artifactId, input),
  );
  const thumbnailUrl = useLocalImage(data?.thumbnailPath);
  const coverSrc = thumbnailUrl ?? previewImageUrl ?? null;

  // 编辑状态
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  if (loading) return <div className="detail-layout"><CoverImage src={previewImageUrl ?? null} alt="" /><div className="detail-info"><div className="detail-modal-loading"><Spinner /></div></div></div>;
  if (error) return <div className="detail-modal-loading"><ErrorBanner error={error} /></div>;
  if (!data) return null;

  async function handleRename() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === data!.name) { setEditingName(false); return; }
    try {
      await updateMut.execute({ name: trimmed });
      setEditingName(false);
      refetch();
      onUpdated?.();
    } catch { /* error shown */ }
  }

  async function handleChangeCover() {
    try {
      const path = await pickSingleFile({
        title: t("library:detail.changeCover"),
        filters: [{ name: t("library:detail.changeCover"), extensions: ["png", "jpg", "jpeg", "webp"] }],
      });
      if (!path) return;
      await updateMut.execute({ thumbnailPath: path });
      refetch();
      onUpdated?.();
    } catch { /* error */ }
  }

  return (
    <div className="detail-layout">
      <div className="detail-cover detail-cover--editable" onClick={handleChangeCover}>
        {coverSrc ? (
          <img key={coverSrc} src={coverSrc} alt={data.name} />
        ) : (
          <div className="detail-cover-placeholder">
            <Layers size={36} strokeWidth={1.25} />
          </div>
        )}
        <div className="detail-cover-edit-hint">
          <ImageIcon size={16} strokeWidth={1.75} />
          <span>{t("library:detail.changeCover")}</span>
        </div>
      </div>
      <div className="detail-info">
        {editingName ? (
          <div className="detail-title-edit">
            <input
              className="input-field detail-title-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingName(false); }}
              autoFocus
            />
            <motion.button className="btn btn-primary" onClick={handleRename} disabled={updateMut.loading} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              {updateMut.loading ? <Spinner size={12} /> : t("common:save")}
            </motion.button>
            <motion.button className="btn btn-ghost" onClick={() => setEditingName(false)} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              {t("common:cancel")}
            </motion.button>
          </div>
        ) : (
          <h2
            className="detail-title detail-title--editable"
            onClick={() => { setEditName(data.name); setEditingName(true); }}
            title={t("library:detail.renameHint")}
          >
            {data.name}
          </h2>
        )}
        {updateMut.error && <ErrorBanner error={updateMut.error} />}
        <div className="detail-meta">
          <MetaRow label={t("library:detail.labels.platform")}><Badge tone="neutral">{data.platform}</Badge></MetaRow>
          <MetaRow label={t("library:detail.labels.unity")}>{data.unityVersion}</MetaRow>
          <MetaRow label={t("library:detail.labels.file")}><span className="detail-mono">{data.bundleFileName}</span></MetaRow>
          <MetaRow label={t("library:detail.labels.hash")}><span className="detail-mono">{data.bundleHash.slice(0, 16)}…</span></MetaRow>
          <MetaRow label={t("library:detail.labels.created")}>{formatDateTime(data.createdAt)}</MetaRow>
        </div>
        <div className="detail-actions">
          <motion.button
            className="btn btn-primary btn-full"
            onClick={() => {
              navigate("publish", {
                publishArtifactIds: [artifactId],
                publishStep: 1,
                publishPrefill: {
                  name: data.name,
                  imagePath: data.thumbnailPath,
                },
              });
              onClose();
            }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            <Send size={13} strokeWidth={1.75} /> {t("library:detail.publishToAccounts")}
          </motion.button>
          <div className="detail-actions-row">
            <motion.button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => revealPath(data.bundlePath).catch(() => {})} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              <FolderOpen size={13} strokeWidth={1.75} /> {t("library:detail.openLocation")}
            </motion.button>
            <motion.button className="btn btn-ghost detail-danger-btn" onClick={() => setConfirmDelete(true)} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              <Trash2 size={13} strokeWidth={1.75} />
            </motion.button>
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirmDelete} title={t("library:detail.deleteLocalTitle")} message={t("library:detail.deleteLocalMessage", { name: data.name })} tone="err" confirmLabel={t("accounts:dialog.removeConfirm")}
        onConfirm={async () => { try { await removeMut.execute(); setConfirmDelete(false); onDeleted(); } catch {} }}
        onCancel={() => setConfirmDelete(false)} loading={removeMut.loading} />
    </div>
  );
}

function CloudDetail({ avatarId, accountId, previewImageUrl, onDeleted, onImported }: { avatarId: string; accountId: string; previewImageUrl?: string | null; onClose: () => void; onDeleted: () => void; onImported?: () => void }) {
  const { t } = useTranslation(["library", "accounts"]);
  const api = useApi();
  const { data, loading, error, refetch } = useQuery((s) => api.myAvatars.get(accountId, avatarId, s), [accountId, avatarId]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeMut = useMutation(() => api.myAvatars.remove(avatarId, { accountId }));
  const selectMut = useMutation(() => api.myAvatars.select(avatarId, { accountId }));
  const [selectSuccess, setSelectSuccess] = useState(false);

  // save-to-library 异步任务状态
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<Partial<SaveToLibraryTask> | null>(null);
  const saveMut = useMutation((_input: void, signal: AbortSignal) =>
    api.myAvatars.saveToLibrary(avatarId, {
      accountId,
      platform: null,
      nameOverride: null,
      linkToExistingEntryId: null,
    }, signal),
  );

  const sseReceivedRef = useRef(false);

  const handleSseEvent = useCallback(
    (_name: string, payload: SaveToLibraryTask) => {
      sseReceivedRef.current = true;
      startTransition(() => {
        setTaskState(payload);
        if (payload.status === "completed") {
          onImported?.();
        }
      });
    },
    [onImported],
  );

  useEventStream(
    () => {
      if (!taskId) return null;
      return api.myAvatars.streamSaveToLibrary(taskId, { onEvent: handleSseEvent });
    },
    [taskId, handleSseEvent],
  );

  // Fallback: 如果 SSE 3 秒内没有事件，用 GET snapshot 轮询
  useEffect(() => {
    if (!taskId) return;
    let active = true;

    const poll = async () => {
      if (sseReceivedRef.current || !active) return;
      try {
        const snapshot = await api.myAvatars.getSaveToLibraryTask(taskId);
        if (active && !sseReceivedRef.current) {
          setTaskState(snapshot);
          if (snapshot.status === "completed") onImported?.();
          if (snapshot.status !== "completed" && snapshot.status !== "failed") {
            setTimeout(poll, 2000);
          }
        }
      } catch { /* ignore polling errors */ }
    };

    const timer = setTimeout(poll, 3000);
    return () => { active = false; clearTimeout(timer); };
  }, [taskId, api, onImported]);

  async function handleSaveToLibrary() {
    sseReceivedRef.current = false;
    try {
      const accepted = await saveMut.execute();
      setTaskId(accepted.taskId);
      setTaskState({
        status: "queued",
        progressText: null,
        progressTextResource: {
          code: "publish:saveToLibraryStages.queued",
          fallback: t("library:detail.queued"),
        },
        progressValue: null,
      });
    } catch { /* error via saveMut.error */ }
  }

  const isRunning = taskState?.status === "queued" || taskState?.status === "running";
  const isCompleted = taskState?.status === "completed";
  const isFailed = taskState?.status === "failed";
  const progressText = resolveSaveToLibraryStatusText(taskState?.progressTextResource, taskState?.progressText, taskState?.stage ?? null, taskState?.status ?? null)
    ?? (isRunning ? t("library:detail.downloading") : null);
  const progressValue = taskState?.progressValue ?? null;

  if (loading) return <div className="detail-layout"><CoverImage src={previewImageUrl ?? null} alt="" /><div className="detail-info"><div className="detail-modal-loading"><Spinner /></div></div></div>;
  if (error) return <div className="detail-modal-loading"><ErrorBanner error={error} /></div>;
  if (!data) return null;

  const { remoteAvatar: avatar, availableActions: actions } = data;

  return (
    <div className="detail-layout">
      <CoverImage src={avatar.imageUrl} alt={avatar.name} />
      <div className="detail-info">
        <h2 className="detail-title">{avatar.name}</h2>
        {avatar.description && <p className="detail-desc">{avatar.description}</p>}
        <div className="detail-meta">
          <MetaRow label={t("library:detail.labels.visibility")}>
            <Badge tone={avatar.releaseStatus === "public" ? "brand" : "neutral"}>
              {avatar.releaseStatus === "public" ? t("library:detail.visibility.public") : t("library:detail.visibility.private")}
            </Badge>
          </MetaRow>
          <MetaRow label={t("library:detail.labels.version")}>v{avatar.version}</MetaRow>
          {avatar.authorName && <MetaRow label={t("library:detail.labels.author")}>{avatar.authorName}</MetaRow>}
          {avatar.updatedAt && <MetaRow label={t("library:detail.labels.updated")}>{formatDateTime(avatar.updatedAt)}</MetaRow>}
          {avatar.platforms.length > 0 && (
            <MetaRow label={t("library:detail.labels.platform")}>
              <div className="detail-badges">
                {[...new Set(avatar.platforms.map((p) => p.platform))].map((name) => (
                  <Badge key={name} tone="neutral">{name}</Badge>
                ))}
              </div>
            </MetaRow>
          )}
        </div>
        <div className="detail-actions">
          {(actions.canImport || actions.canDownload) && (
            <>
              <motion.button
                className={`btn btn-full ${isCompleted ? "btn-success" : "btn-primary"}`}
                onClick={handleSaveToLibrary}
                disabled={isRunning || isCompleted || saveMut.loading}
                whileTap={{ scale: 0.97 }}
                transition={spring.snappy}
              >
                {saveMut.loading ? (
                  <><Spinner size={13} /> {t("library:detail.submitting")}</>
                ) : isCompleted ? (
                  t("library:detail.savedToLibrary")
                ) : isRunning ? (
                  <><Spinner size={13} /> {progressText}</>
                ) : (
                  <><Download size={13} strokeWidth={1.75} /> {t("library:detail.downloadToLibrary")}</>
                )}
              </motion.button>
              {/* 进度条 — 下载中显示 */}
              {isRunning && (
                <div className="detail-progress">
                  <ProgressBar value={progressValue} />
                  {taskState?.bytesReceived != null && taskState?.bytesTotal != null && (
                    <span className="detail-progress-bytes">
                      {formatBytes(taskState.bytesReceived)} / {formatBytes(taskState.bytesTotal)}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
          {saveMut.error && <ErrorBanner error={saveMut.error} />}
          {isFailed && taskState?.lastError && <ErrorBanner error={new Error(taskState.lastError)} />}
          <motion.button
            className={`btn btn-full ${selectSuccess ? "btn-success" : "btn-secondary"}`}
            onClick={async () => {
              try {
                await selectMut.execute();
                setSelectSuccess(true);
                refetch();
              } catch { /* error shown below */ }
            }}
            disabled={selectMut.loading || selectSuccess}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
          >
            {selectMut.loading ? (
              <><Spinner size={13} /> {t("library:detail.switching")}</>
            ) : selectSuccess ? (
              t("library:detail.switchedToCurrent")
            ) : (
              <><UserCheck size={13} strokeWidth={1.75} /> {t("library:detail.useThisModel")}</>
            )}
          </motion.button>
          {selectMut.error && <ErrorBanner error={selectMut.error} />}
          {actions.canDelete && (
            <motion.button className="btn btn-ghost detail-danger-btn" onClick={() => setConfirmDelete(true)} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              <Trash2 size={13} strokeWidth={1.75} /> {t("accounts:actions.remove")}
            </motion.button>
          )}
        </div>
      </div>
      <ConfirmDialog open={confirmDelete} title={t("library:detail.deleteCloudTitle")} message={t("library:detail.deleteCloudMessage", { name: avatar.name })} tone="err" confirmLabel={t("library:detail.deletePermanent")}
        onConfirm={async () => { try { await removeMut.execute(); setConfirmDelete(false); onDeleted(); } catch {} }}
        onCancel={() => setConfirmDelete(false)} loading={removeMut.loading} />
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-meta-row">
      <span className="detail-meta-label">{label}</span>
      <span className="detail-meta-value">{children}</span>
    </div>
  );
}
