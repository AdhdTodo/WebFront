interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-card border border-border bg-surfaceSubtle p-4 text-[13px] leading-6 text-textSecondary">
      {message}
    </div>
  );
}
