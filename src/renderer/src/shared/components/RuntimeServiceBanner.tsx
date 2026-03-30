import { useConnection } from "../../app/ConnectionContext";
import { revealRuntimeLogDirectory } from "../../lib/runtime";

function getBannerTitle(state: "starting" | "ready" | "degraded" | "stopped"): string {
  switch (state) {
    case "starting":
      return "内置服务启动中";
    case "degraded":
      return "内置服务连接异常";
    case "stopped":
      return "内置服务已停止";
    default:
      return "内置服务状态正常";
  }
}

export function RuntimeServiceBanner() {
  const { runtimeMode, serviceState, serviceMessage, logDirectoryPath } = useConnection();

  if (runtimeMode !== "desktop-release" || serviceState === "ready") {
    return null;
  }

  return (
    <div className={`runtime-service-banner runtime-service-banner--${serviceState}`}>
      <div className="runtime-service-banner__body">
        <div className="runtime-service-banner__title">{getBannerTitle(serviceState)}</div>
        <div className="runtime-service-banner__message">
          {serviceMessage ?? "正在协调内置服务状态。"}
        </div>
      </div>
      {logDirectoryPath ? (
        <button
          type="button"
          className="runtime-service-banner__action"
          onClick={() => {
            void revealRuntimeLogDirectory();
          }}
        >
          查看日志
        </button>
      ) : null}
    </div>
  );
}
