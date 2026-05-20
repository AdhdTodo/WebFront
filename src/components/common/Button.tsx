import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-textPrimary hover:border-accent hover:bg-primary/85",
  secondary: "border-border bg-panel text-textPrimary hover:border-accent hover:bg-surfaceSubtle",
  ghost: "border-transparent bg-transparent text-textSecondary hover:bg-accentSoft hover:text-textPrimary",
  quiet: "border-accent/35 bg-accentSoft text-textPrimary hover:border-accent hover:bg-accentSoft/80",
};

export function Button({
  className = "",
  variant = "secondary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-sm border px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:border-border disabled:bg-surfaceSubtle disabled:text-textMuted ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
