import { useConnection } from "../../app/ConnectionContext";
import { useTranslation } from "react-i18next";
import { StatusDot } from "./StatusDot";

export function ConnectionStatus() {
  const { t } = useTranslation(["common", "runtime"]);
  const { connected, serviceState } = useConnection();
  const label = connected
    ? t("common:connected")
    : serviceState === "starting"
      ? t("runtime:connection.starting")
      : serviceState === "stopped"
        ? t("runtime:connection.stopped")
        : t("runtime:connection.disconnected");
  const tone = connected ? "ok" : serviceState === "starting" ? "warn" : "err";

  return (
    <div className="connection-status">
      <StatusDot tone={tone} />
      <span>{label}</span>
    </div>
  );
}
