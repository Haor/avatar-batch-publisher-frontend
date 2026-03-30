/** 发布流水线 4 个阶段标签 */
export const phaseLabels = ["准备", "处理", "上传", "完成"] as const;

/** stage/status -> 中文 fallback 文案 */
export const stageFallback: Record<string, string> = {
  pending: "等待开始",
  preflight: "检查上传条件",
  reserve_avatar: "创建远端记录",
  reserved: "远端已预留",
  rewriting: "处理模型包",
  uploading: "上传模型文件",
  polling: "等待处理",
  completed: "上传完成",
  succeeded: "上传完成",
  completed_with_failures: "部分失败",
  cancelled: "已取消",
  failed: "上传失败",
};

/** 三级 fallback: progressText > stage 文案 > status 文案 */
export function resolveStatusText(
  progressText: string | null | undefined,
  stage: string | null | undefined,
  status: string | undefined,
): string {
  return progressText
    ?? (stage ? stageFallback[stage] : undefined)
    ?? (status ? stageFallback[status] : undefined)
    ?? "进行中";
}

/** 从 stage/status 推算 phaseIndex (0-3) */
export function getPhaseIndex(stage: string | null, status: string): number {
  if (!stage) {
    if (status === "succeeded" || status === "completed") return 3;
    return 0;
  }
  if (["pending", "preflight", "reserve_avatar", "reserved"].includes(stage)) return 0;
  if (stage === "rewriting") return 1;
  if (stage === "uploading") return 2;
  return 3;
}

/** status -> 颜色 tone */
export function statusTone(
  status: string,
  runningTone: "brand" | "warn" = "brand",
): "ok" | "warn" | "err" | "brand" {
  if (status === "succeeded" || status === "completed") return "ok";
  if (status === "failed") return "err";
  if (status === "partially_failed") return "err";
  if (status === "completed_with_failures") return "err";
  if (status === "cancelled") return "warn";
  return runningTone;
}

/** 合并 SSE payload 到现有 execution 状态 */
export function mergeExecutionProgress<T extends Record<string, unknown>>(
  prev: T,
  payload: {
    status?: string | null;
    stage?: string | null;
    progressText?: string | null;
    progressValue?: number | null;
    bytesSent?: number | null;
    bytesTotal?: number | null;
    lastError?: string | null;
  },
): T {
  return {
    ...prev,
    status: payload.status ?? prev.status,
    stage: payload.stage ?? prev.stage,
    progressText: payload.progressText ?? prev.progressText,
    progressValue: payload.progressValue ?? prev.progressValue,
    bytesSent: payload.bytesSent ?? prev.bytesSent,
    bytesTotal: payload.bytesTotal ?? prev.bytesTotal,
    lastError: payload.lastError ?? prev.lastError,
  };
}

/** save-to-library stage -> 中文 fallback 文案 */
export const saveToLibraryStageFallback: Record<string, string> = {
  resolving_avatar: "读取远端模型信息",
  preparing_library: "准备本地库",
  downloading: "下载模型文件",
  importing_artifact: "导入本地模型库",
  linking_library: "写入本地关联",
  completed: "已下载到本地库",
  queued: "排队中",
  failed: "下载失败",
};
