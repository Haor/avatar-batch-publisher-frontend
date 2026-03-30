import { motion } from "motion/react";
import { spring } from "../springs";

interface StatusDotProps {
  tone: "ok" | "warn" | "err";
  animate?: boolean;
}

export function StatusDot({ tone, animate }: StatusDotProps) {
  if (animate) {
    return (
      <motion.span
        key={tone}
        className={`status-dot status-dot--${tone}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.bouncy}
      />
    );
  }
  return <span className={`status-dot status-dot--${tone}`} />;
}
