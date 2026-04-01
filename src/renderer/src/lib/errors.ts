import type { LocalizedText } from "../contracts/localized-text";
import type { ApiErrorEnvelope } from "../contracts/shared";
import i18n from "../i18n";
import { resolveLocalizedText } from "../i18n/localized-text";

export class ApiError extends Error {
  readonly code: string | null;
  readonly traceId: string | null;
  readonly details: Record<string, string>;
  readonly status: number;
  readonly messageText: LocalizedText | null;

  constructor(
    status: number,
    message: string,
    code: string | null,
    traceId: string | null,
    details: Record<string, string>,
    messageText: LocalizedText | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
    this.details = details;
    this.messageText = messageText;
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = `${response.status} ${response.statusText}`.trim();

  try {
    const payload = (await response.json()) as ApiErrorEnvelope;

    return new ApiError(
      response.status,
      payload.error?.message || fallbackMessage,
      payload.error?.code || null,
      payload.error?.traceId || null,
      payload.error?.details || {},
      payload.error?.messageText || null
    );
  } catch {
    return new ApiError(response.status, fallbackMessage, null, null, {}, null);
  }
}

const friendlyMessageKeys: Record<string, string> = {
  "accounts.session_invalid": "errors:codes.accounts.session_invalid",
  "accounts.not_found": "errors:codes.accounts.not_found",
  "accounts.login_failed": "errors:codes.accounts.login_failed",
  "accounts.invalid_credentials": "errors:codes.accounts.invalid_credentials",
  "accounts.location_verification_required": "errors:codes.accounts.location_verification_required",
  "accounts.login_rejected": "errors:codes.accounts.login_rejected",
  "accounts.login_rate_limited": "errors:codes.accounts.login_rate_limited",
  "accounts.already_exists": "errors:codes.accounts.already_exists",
  "artifacts.not_found": "errors:codes.artifacts.not_found",
  "artifacts.import_failed": "errors:codes.artifacts.import_failed",
  "my_avatars.not_found": "errors:codes.my_avatars.not_found",
  "publishes.not_found": "errors:codes.publishes.not_found",
  "publish_queue.not_found": "errors:codes.publish_queue.not_found",
  "runs.not_found": "errors:codes.runs.not_found",
  "settings.network.invalid": "errors:codes.settings.network.invalid",
  "settings.language.invalid": "errors:codes.settings.language.invalid",
  "common.file_not_found": "errors:codes.common.file_not_found",
  "common.invalid_argument": "errors:codes.common.invalid_argument",
  "common.invalid_operation": "errors:codes.common.invalid_operation",
  "common.unexpected_error": "errors:codes.common.unexpected_error",
  "desktop.unavailable": "errors:codes.desktop.unavailable",
};

const httpFallbackKeys: Record<number, string> = {
  400: "errors:http.400",
  401: "errors:http.401",
  403: "errors:http.403",
  404: "errors:http.404",
  409: "errors:http.409",
  500: "errors:http.500",
  502: "errors:http.502",
  503: "errors:http.503",
};

function resolveKnownApiErrorCode(code: string): string | null {
  for (const locale of i18n.languages) {
    const bundle = i18n.getResourceBundle(locale, "errors") as { codes?: Record<string, string> } | undefined;
    const resolved = bundle?.codes?.[code];
    if (resolved) {
      return resolved;
    }
  }

  const fallbackBundle = i18n.getResourceBundle("en", "errors") as { codes?: Record<string, string> } | undefined;
  return fallbackBundle?.codes?.[code] ?? null;
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const resolvedMessage = resolveLocalizedText(error.messageText, error.message);
    if (resolvedMessage && error.messageText) {
      return resolvedMessage;
    }
    if (error.code && friendlyMessageKeys[error.code]) {
      return resolveKnownApiErrorCode(error.code) ?? error.message;
    }
    if (httpFallbackKeys[error.status]) {
      return i18n.t(httpFallbackKeys[error.status]);
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return i18n.t("errors:failedToFetch");
    }
    return error.message;
  }

  return i18n.t("errors:unknown");
}
