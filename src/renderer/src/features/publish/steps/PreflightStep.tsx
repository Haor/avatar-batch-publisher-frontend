import { useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import { makeStagger, fadeIn } from "../../../shared/springs";
import { useApi } from "../../../app/ApiContext";
import { useQuery } from "../../../shared/hooks/useQuery";
import { Spinner } from "../../../shared/components/Spinner";
import { ErrorBanner } from "../../../shared/components/ErrorBanner";
import type { PublishItemConfig } from "./ConfigureInfoStep";

interface PreflightStepProps {
  artifactId: string;
  accountIds: string[];
  config: PublishItemConfig;
  onCanStartChange: (canStart: boolean) => void;
}

const listStagger = makeStagger();

export function PreflightStep({ artifactId, accountIds, config, onCanStartChange }: PreflightStepProps) {
  const api = useApi();

  const { data, loading, error } = useQuery(
    (signal) =>
      api.publishQueue.preflight(
        {
          artifactId,
          accountIds,
          name: config.name,
          description: config.description || null,
          tags: config.tags,
          releaseStatus: config.releaseStatus,
          retryOfRunId: null,
        },
        signal,
      ),
    [artifactId, accountIds, config.name, config.description, config.tags, config.releaseStatus],
  );

  useEffect(() => {
    if (data) onCanStartChange(data.canStart);
  }, [data, onCanStartChange]);

  if (loading) {
    return (
      <div className="preflight-loading">
        <Spinner />
        <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>检查发布条件...</span>
      </div>
    );
  }

  if (error) return <ErrorBanner error={error} />;
  if (!data) return null;

  return (
    <div className="preflight-step">
      <p className="preflight-summary">{data.summary}</p>

      <motion.div className="preflight-checks" variants={listStagger} initial="hidden" animate="show">
        {data.checks.map((check) => (
          <motion.div
            key={check.key}
            className={`preflight-check ${check.isPassing ? "preflight-check--passing" : "preflight-check--failing"}`}
            variants={fadeIn}
          >
            {check.isPassing ? (
              <CheckCircle size={16} strokeWidth={1.75} />
            ) : (
              <XCircle size={16} strokeWidth={1.75} />
            )}
            <div className="preflight-check-text">
              <span className="preflight-check-title">{check.title}</span>
              <span className="preflight-check-detail">{check.detail}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
