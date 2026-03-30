import type { ReactNode } from "react";

interface BadgeProps {
  tone?: "ok" | "warn" | "err" | "brand" | "neutral";
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
