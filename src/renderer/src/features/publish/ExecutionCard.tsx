import { memo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { spring } from "../../shared/springs";
import { getPhaseLabels, getPhaseIndex, resolveStatusText, statusTone } from "../../shared/domain/publish-stages";
import { StatusDot } from "../../shared/components/StatusDot";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { formatBytes } from "../../shared/format/bytes";
import type { PublishQueueExecutionDetails } from "../../contracts/publish-queue";

interface ExecutionCardProps {
  execution: PublishQueueExecutionDetails;
  accountName: string;
  artifactName: string;
}

export const ExecutionCard = memo(function ExecutionCard({ execution, accountName, artifactName }: ExecutionCardProps) {
  useTranslation(["publish"]);
  const phaseLabels = getPhaseLabels();
  const phaseIndex = getPhaseIndex(execution.stage, execution.status);
  const isRunning = execution.status === "running" || execution.status === "started";
  const isFailed = execution.status === "failed";
  const isDone = execution.status === "succeeded" || execution.status === "completed";

  const statusText = resolveStatusText(null, execution.progressText, execution.stage, execution.status);

  return (
    <motion.div
      className={`card execution-card ${isDone ? "execution-card--succeeded" : ""} ${isFailed ? "execution-card--failed" : ""} ${isRunning ? "execution-card--running" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <div className="execution-card-header">
        <div className="execution-card-names">
          <span className="execution-card-account">{accountName}</span>
          <span className="execution-card-artifact">{artifactName}</span>
        </div>
        <StatusDot tone={statusTone(execution.status, "warn") as "ok" | "warn" | "err"} animate />
      </div>

      <div className="pipeline pipeline--sm">
        {phaseLabels.map((label, i) => {
          const done = i < phaseIndex;
          const active = i === phaseIndex && isRunning;
          return (
            <div
              key={label}
              className={`pipeline-stage ${done ? "pipeline-stage--done" : ""} ${active ? "pipeline-stage--active" : ""}`}
            >
              <div className="pipeline-dot">
                {done ? <Check size={8} strokeWidth={2.5} /> : null}
              </div>
              <span className="pipeline-label">{label}</span>
              {i < phaseLabels.length - 1 && (
                <div className={`pipeline-line ${done ? "pipeline-line--done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {isRunning && (
        <ProgressBar value={execution.progressValue} />
      )}

      <div className="execution-card-footer">
        <span className="execution-card-status">{statusText}</span>
        {execution.bytesSent != null && execution.bytesTotal != null && (
          <span className="execution-card-bytes">
            {formatBytes(execution.bytesSent)} / {formatBytes(execution.bytesTotal)}
          </span>
        )}
      </div>

      {execution.lastError && (
        <div className="execution-card-error">{execution.lastError}</div>
      )}
    </motion.div>
  );
});
