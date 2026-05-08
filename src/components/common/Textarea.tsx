import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-none rounded-sm border border-border bg-input px-3 py-3 text-[14px] leading-6 text-textPrimary outline-none transition placeholder:text-textMuted focus:border-accent focus:shadow-[0_0_0_4px_rgba(220,155,155,0.22)] ${className}`}
      {...props}
    />
  );
}
