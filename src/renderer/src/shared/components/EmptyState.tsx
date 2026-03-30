import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-message">{message}</p>
      {action && (
        <button className="btn btn-secondary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
