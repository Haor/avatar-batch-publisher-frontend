import { useConnection } from "../../app/ConnectionContext";
import { revealRuntimeLogDirectory } from "../../lib/runtime";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["runtime", "common"]);
  const { runtimeMode, serviceState, serviceMessage, logDirectoryPath } = useConnection();

  if (runtimeMode !== "desktop-release" || serviceState === "ready") {
    return null;
  }

  const isStarting = serviceState === "starting";

  return (
    <div className="runtime-bootstrap-screen">
      <div className="runtime-bootstrap-screen__panel">
        <div className="runtime-bootstrap-screen__eyebrow">{t("common:appName")}</div>
        <h1 className="runtime-bootstrap-screen__title">{t(`runtime:bootstrap.title.${serviceState}`)}</h1>
        <p className="runtime-bootstrap-screen__description">
          {messageOverride ?? serviceMessage ?? t(`runtime:bootstrap.description.${serviceState}`)}
        </p>

        <div className="runtime-bootstrap-screen__progress">
          <div className={`runtime-bootstrap-screen__pulse ${isStarting ? "" : "runtime-bootstrap-screen__pulse--warn"}`} />
          <div className="runtime-bootstrap-screen__progress-copy">
            {progressCopyOverride ?? t(isStarting ? "runtime:bootstrap.progressStarting" : "runtime:bootstrap.progressRecovering")}
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
            {t("common:viewLogs")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
