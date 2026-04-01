import { describeError } from "../../lib/errors";
import { useTranslation } from "react-i18next";

interface ErrorBannerProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const { t } = useTranslation("common");

  return (
    <div className="error-banner">
      <span className="error-banner-text">{describeError(error)}</span>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}
