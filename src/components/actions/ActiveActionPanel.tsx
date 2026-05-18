import type { Action } from "../../types/api";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ActionControls } from "./ActionControls";

interface ActiveActionPanelProps {
  action?: Action | null;
  onComplete?: () => void;
  onAbort?: () => void;
  onMakeSmaller?: () => void;
}

export function ActiveActionPanel({
  action = null,
  onComplete,
  onAbort,
  onMakeSmaller,
}: ActiveActionPanelProps) {
  if (!action) {
    return (
      <Card title="실행 중인 행동" meta="선택된 후보가 하나의 실행 단위로 수렴합니다.">
        <EmptyState
          title="현재 실행 중인 행동이 없습니다."
          description="행동 후보 중 하나를 선택하면 여기에 집중 실행 단위가 표시됩니다."
        />
      </Card>
    );
  }

  return (
    <Card title="실행 중인 행동" meta="선택된 후보가 하나의 실행 단위로 수렴했습니다.">
      <Badge tone={action.status === "active" ? "active" : "success"}>
        {translateActionStatus(action.status)}
      </Badge>
      <h2 className="mt-4 border-l-4 border-primary pl-3 text-[20px] font-bold text-textPrimary">
        {action.title}
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-textSecondary">{action.micro_step}</p>
      <div className="mt-4 rounded-card border border-accent/35 bg-accentSoft p-3 text-[12px] leading-5 text-textSecondary">
        중단은 실패가 아니라 다음 제안을 더 작게 만들기 위한 신호입니다.
      </div>
      <div className="mt-4">
        <ActionControls
          onComplete={onComplete}
          onAbort={onAbort}
          onMakeSmaller={onMakeSmaller}
          disabled={action.status !== "active"}
        />
      </div>
    </Card>
  );
}

function translateActionStatus(status: Action["status"]) {
  if (status === "completed") return "완료됨";
  if (status === "aborted") return "중단 기록됨";
  return "실행 중";
}
