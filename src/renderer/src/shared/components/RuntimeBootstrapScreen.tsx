import { useConnection } from "../../app/ConnectionContext";
import { revealRuntimeLogDirectory } from "../../lib/runtime";

function getTitle(state: "starting" | "ready" | "degraded" | "stopped"): string {
  switch (state) {
    case "starting":
      return "正在启动内置服务";
    case "degraded":
      return "服务启动较慢";
    case "stopped":
      return "内置服务未能启动";
    default:
      return "正在准备";
  }
}

function getDescription(state: "starting" | "ready" | "degraded" | "stopped", message: string | null): string {
  if (message) {
    return message;
  }

  switch (state) {
    case "starting":
      return "正在拉起本地后端并进行健康检查，请稍候。";
    case "degraded":
      return "服务仍在恢复中，应用会继续自动重试连接。";
    case "stopped":
      return "请查看日志确认内置服务为什么停止。";
    default:
      return "正在准备应用环境。";
  }
}

export function RuntimeBootstrapScreen() {
  return <RuntimeBootstrapScreenInner />;
}

export function RuntimeBootstrapScreenInner({
  messageOverride,
  progressCopyOverride,
}: {
  messageOverride?: string | null;
  progressCopyOverride?: string | null;
}) {
  const { runtimeMode, serviceState, serviceMessage, logDirectoryPath } = useConnection();

  if (runtimeMode !== "desktop-release" || serviceState === "ready") {
    return null;
  }

  const isStarting = serviceState === "starting";

  return (
    <div className="runtime-bootstrap-screen">
      <div className="runtime-bootstrap-screen__panel">
        <div className="runtime-bootstrap-screen__eyebrow">AvatarPublisher</div>
        <h1 className="runtime-bootstrap-screen__title">{getTitle(serviceState)}</h1>
        <p className="runtime-bootstrap-screen__description">
          {messageOverride ?? getDescription(serviceState, serviceMessage)}
        </p>

        <div className="runtime-bootstrap-screen__progress">
          <div className={`runtime-bootstrap-screen__pulse ${isStarting ? "" : "runtime-bootstrap-screen__pulse--warn"}`} />
          <div className="runtime-bootstrap-screen__progress-copy">
            {progressCopyOverride ?? (isStarting ? "正在连接本地服务..." : "正在等待服务恢复...")}
          </div>
        </div>

        {logDirectoryPath ? (
          <button
            type="button"
            className="runtime-bootstrap-screen__action"
            onClick={() => {
              void revealRuntimeLogDirectory();
            }}
          >
            查看日志
          </button>
        ) : null}
      </div>
    </div>
  );
}
