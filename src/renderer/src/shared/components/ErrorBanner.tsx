import { describeError } from "../../lib/errors";

interface ErrorBannerProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <span className="error-banner-text">{describeError(error)}</span>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  );
}
