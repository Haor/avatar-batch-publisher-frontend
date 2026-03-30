import { useConnection } from "../../app/ConnectionContext";
import { StatusDot } from "./StatusDot";

export function ConnectionStatus() {
  const { connected, serviceState } = useConnection();
  const label = connected
    ? "已连接"
    : serviceState === "starting"
      ? "服务启动中"
      : serviceState === "stopped"
        ? "服务已停止"
        : "未连接";
  const tone = connected ? "ok" : serviceState === "starting" ? "warn" : "err";

  return (
    <div className="connection-status">
      <StatusDot tone={tone} />
      <span>{label}</span>
    </div>
  );
}
