import i18n from "../../i18n";
import type { LocalizedText } from "../../contracts/localized-text";
import { resolveLocalizedText } from "../../i18n/localized-text";

const phaseLabelKeys = [
  "publish:domain.phaseLabels.prepare",
  "publish:domain.phaseLabels.process",
  "publish:domain.phaseLabels.upload",
  "publish:domain.phaseLabels.done",
] as const;

const stageFallbackKeys: Record<string, string> = {
  pending: "publish:domain.stages.pending",
  preflight: "publish:domain.stages.preflight",
  reserve_avatar: "publish:domain.stages.reserve_avatar",
  reserved: "publish:domain.stages.reserved",
  rewriting: "publish:domain.stages.rewriting",
  uploading: "publish:domain.stages.uploading",
  polling: "publish:domain.stages.polling",
  completed: "publish:domain.stages.completed",
  succeeded: "publish:domain.stages.succeeded",
  completed_with_failures: "publish:domain.stages.completed_with_failures",
  cancelled: "publish:domain.stages.cancelled",
  failed: "publish:domain.stages.failed",
};

const saveToLibraryStageKeys: Record<string, string> = {
  resolving_avatar: "publish:saveToLibraryStages.resolving_avatar",
  preparing_library: "publish:saveToLibraryStages.preparing_library",
  downloading: "publish:saveToLibraryStages.downloading",
  importing_artifact: "publish:saveToLibraryStages.importing_artifact",
  linking_library: "publish:saveToLibraryStages.linking_library",
  completed: "publish:saveToLibraryStages.completed",
  queued: "publish:saveToLibraryStages.queued",
  failed: "publish:saveToLibraryStages.failed",
};

export function getPhaseLabels(): string[] {
  return phaseLabelKeys.map((key) => i18n.t(key));
}

export function resolveStatusText(
  progressTextResource: LocalizedText | null | undefined,
  progressText: string | null | undefined,
  stage: string | null | undefined,
  status: string | undefined,
): string {
  return (
    resolveLocalizedText(progressTextResource) ??
    progressText ??
    (stage ? translateKey(stageFallbackKeys[stage]) : undefined) ??
    (status ? translateKey(stageFallbackKeys[status]) : undefined) ??
    i18n.t("publish:domain.inProgress")
  );
}

export function resolveSaveToLibraryStatusText(
  progressTextResource: LocalizedText | null | undefined,
  progressText: string | null | undefined,
  stage: string | null | undefined,
  status: string | null | undefined,
): string | null {
  return (
    resolveLocalizedText(progressTextResource) ??
    progressText ??
    (stage ? translateKey(saveToLibraryStageKeys[stage]) : undefined) ??
    (status ? translateKey(saveToLibraryStageKeys[status]) : undefined) ??
    null
  );
}

function translateKey(key: string | undefined): string | undefined {
  return key ? i18n.t(key) : undefined;
}

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

export function mergeExecutionProgress<T extends Record<string, unknown>>(
  prev: T,
  payload: {
    status?: string | null;
    stage?: string | null;
    progressText?: string | null;
    progressTextResource?: LocalizedText | null;
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
    progressTextResource: payload.progressTextResource ?? prev.progressTextResource,
    progressValue: payload.progressValue ?? prev.progressValue,
    bytesSent: payload.bytesSent ?? prev.bytesSent,
    bytesTotal: payload.bytesTotal ?? prev.bytesTotal,
    lastError: payload.lastError ?? prev.lastError,
  };
}
