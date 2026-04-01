import { useConnection } from "../../app/ConnectionContext";
import { revealRuntimeLogDirectory } from "../../lib/runtime";
import { useTranslation } from "react-i18next";

export function RuntimeServiceBanner() {
  const { t } = useTranslation(["runtime", "common"]);
  const { runtimeMode, serviceState, serviceMessage, logDirectoryPath } = useConnection();

  if (runtimeMode !== "desktop-release" || serviceState === "ready") {
    return null;
  }

  return (
    <div className={`runtime-service-banner runtime-service-banner--${serviceState}`}>
      <div className="runtime-service-banner__body">
        <div className="runtime-service-banner__title">{t(`runtime:banner.title.${serviceState}`)}</div>
        <div className="runtime-service-banner__message">
          {serviceMessage ?? t("runtime:banner.defaultMessage")}
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
          {t("common:viewLogs")}
        </button>
      ) : null}
    </div>
  );
}
