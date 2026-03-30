import { motion } from "motion/react";
import { Check } from "lucide-react";
import { spring } from "../../shared/springs";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="step-indicator-item">
            {/* 连接线 — 放在圆圈前面，与圆圈同一行 */}
            {i > 0 && (
              <div className={`step-indicator-line ${done ? "step-indicator-line--done" : ""}`} />
            )}
            <div className="step-indicator-node">
              <motion.div
                className={`step-indicator-circle ${done ? "step-indicator-circle--done" : ""} ${active ? "step-indicator-circle--active" : ""}`}
                animate={done ? { scale: [1, 1.1, 1] } : {}}
                transition={spring.bouncy}
              >
                {done ? <Check size={12} strokeWidth={2.5} /> : i + 1}
              </motion.div>
              <span className={`step-indicator-label ${done ? "step-indicator-label--done" : ""} ${active ? "step-indicator-label--active" : ""}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
