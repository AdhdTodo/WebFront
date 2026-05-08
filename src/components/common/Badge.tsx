import type { ReactNode } from "react";

type BadgeTone = "quiet" | "gentle" | "neutral" | "active" | "muted" | "accent" | "success";

const tones: Record<BadgeTone, string> = {
  quiet: "border-primary bg-primary/60 text-textPrimary",
  gentle: "border-border bg-surface text-textSecondary",
  neutral: "border-accent/35 bg-accentSoft text-textPrimary",
  active: "border-primary bg-primary text-textPrimary",
  muted: "border-border bg-surfaceSubtle text-textSecondary",
  accent: "border-accent/35 bg-accentSoft text-textPrimary",
  success: "border-primary bg-primary/70 text-textPrimary",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = "muted" }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-sm border px-2 text-[11px] font-semibold tracking-[0.01em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
