import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

const springConfig = { stiffness: 170, damping: 22, mass: 1 };

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, springConfig);
  const display = useTransform(springValue, (v) => Math.round(v).toString());

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
