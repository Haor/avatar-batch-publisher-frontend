import { useConnection } from "../../app/ConnectionContext";
import { StatusDot } from "./StatusDot";

export function ConnectionStatus() {
  const { connected } = useConnection();

  return (
    <div className="connection-status">
      <StatusDot tone={connected ? "ok" : "err"} />
      <span>{connected ? "已连接" : "未连接"}</span>
    </div>
  );
}
