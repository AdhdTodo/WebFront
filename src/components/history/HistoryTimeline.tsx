import type { Feedback } from "../../types/api";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";

interface HistoryTimelineProps {
  feedback?: Feedback[];
}

export function HistoryTimeline({ feedback = [] }: HistoryTimelineProps) {
  return (
    <Card title="Signals" meta="반응 신호는 다음 제안 크기를 조절하는 기록입니다.">
      {feedback.length === 0 && (
        <EmptyState
          title="아직 반응 신호가 없습니다."
          description="do, pass, make_smaller 같은 반응이 저장되면 여기에 표시됩니다."
        />
      )}
      <div className="space-y-3">
        {feedback.map((feedback) => (
          <div key={feedback.id} className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <Badge tone={feedback.reaction === "do" ? "green" : "muted"}>
                {translateReaction(feedback.reaction)}
              </Badge>
              <p className="mt-2 text-[13px] text-textSecondary">
                {feedback.note ?? "반응만 저장됨"}
              </p>
            </div>
            <span className="text-[11px] text-textMuted">{feedback.created_at}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function translateReaction(reaction: string) {
  if (reaction === "do") return "선택";
  if (reaction === "make_smaller") return "더 작게";
  if (reaction === "pass") return "이번엔 넘기기";
  if (reaction === "snooze") return "나중에 보기";
  if (reaction === "capture_only") return "기록만";
  return reaction;
}
