interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-border bg-input p-5 text-[13px] leading-6">
      <div className="font-bold text-textPrimary">{title}</div>
      {description && <p className="mt-1 text-textSecondary">{description}</p>}
    </div>
  );
}
