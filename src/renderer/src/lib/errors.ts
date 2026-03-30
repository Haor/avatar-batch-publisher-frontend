import type { ApiErrorEnvelope } from "../contracts/shared";

export class ApiError extends Error {
  readonly code: string | null;
  readonly traceId: string | null;
  readonly details: Record<string, string>;
  readonly status: number;

  constructor(status: number, message: string, code: string | null, traceId: string | null, details: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
    this.details = details;
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
      payload.error?.details || {}
    );
  } catch {
    return new ApiError(response.status, fallbackMessage, null, null, {});
  }
}

/** 已知 API 错误码 -> 用户友好的中文描述 */
const friendlyMessages: Record<string, string> = {
  "accounts.session_invalid": "账号会话已失效，请重新登录",
  "accounts.not_found": "账号不存在",
  "accounts.login_failed": "登录失败，请检查用户名和密码",
  "accounts.already_exists": "该账号已存在",
  "artifacts.not_found": "本地模型不存在",
  "artifacts.import_failed": "模型导入失败",
  "my_avatars.not_found": "云端模型不存在",
  "publishes.not_found": "发布记录不存在",
  "publish_queue.not_found": "发布队列不存在",
  "runs.not_found": "运行记录不存在",
  "settings.network.invalid": "代理地址格式无效",
  "common.file_not_found": "文件未找到",
  "common.invalid_argument": "参数无效",
  "common.invalid_operation": "操作无效",
  "common.unexpected_error": "服务器发生意外错误",
  "desktop.unavailable": "此功能仅在桌面应用中可用",
};

/** HTTP 状态码 -> 通用中文描述 */
const httpFallbacks: Record<number, string> = {
  400: "请求参数有误",
  401: "未授权，请重新登录",
  403: "没有权限执行此操作",
  404: "请求的资源不存在",
  409: "操作冲突，请稍后重试",
  500: "服务器内部错误",
  502: "后端服务不可用",
  503: "服务暂时不可用",
};

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && friendlyMessages[error.code]) {
      return friendlyMessages[error.code];
    }
    if (httpFallbacks[error.status]) {
      return httpFallbacks[error.status];
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "无法连接到后端服务";
    }
    return error.message;
  }

  return "发生未知错误";
}
