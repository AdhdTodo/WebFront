interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "불러오는 중입니다." }: LoadingStateProps) {
  return (
    <div className="rounded-card border border-border bg-input p-4 text-[13px] text-textSecondary">
      {message}
    </div>
  );
}
