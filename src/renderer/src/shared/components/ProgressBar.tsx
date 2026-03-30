import { useRef } from "react";
import { motion } from "motion/react";
import { spring } from "../springs";

interface ProgressBarProps {
  value: number | null;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const lastStableValueRef = useRef<number | null>(null);

  if (value !== null) {
    lastStableValueRef.current = Math.min(1, Math.max(0, value));
  }

  const stableValue = value ?? lastStableValueRef.current;

  return (
    <div className="progress-track">
      {stableValue !== null ? (
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${stableValue * 100}%` }}
          transition={spring.gentle}
        />
      ) : (
        <div className="progress-fill progress-fill--indeterminate" />
      )}
    </div>
  );
}
