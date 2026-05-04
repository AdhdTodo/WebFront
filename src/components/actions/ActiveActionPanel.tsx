import { mockActiveAction } from "../../mockData";
import type { Action } from "../../types/api";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ActionControls } from "./ActionControls";

interface ActiveActionPanelProps {
  action?: Action | null;
  onComplete?: () => void;
  onAbort?: () => void;
  onMakeSmaller?: () => void;
}

export function ActiveActionPanel({
  action = mockActiveAction,
  onComplete,
  onAbort,
  onMakeSmaller,
}: ActiveActionPanelProps) {
  if (!action) {
    return (
      <Card title="Active Action" meta="선택된 suggestion이 하나의 실행 단위로 수렴합니다.">
        <div className="rounded-card border border-dashed border-border bg-input p-5 text-[13px] leading-6 text-textSecondary">
          아직 선택된 Action이 없습니다. 왼쪽 suggestion 중 하나를 선택하면 여기에 집중 실행
          단위가 표시됩니다.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Active Action" meta="선택된 suggestion이 하나의 실행 단위로 수렴했습니다.">
      <Badge tone={action.status === "active" ? "active" : "green"}>{action.status}</Badge>
      <h2 className="mt-4 text-[20px] font-bold text-textPrimary">{action.title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-textSecondary">{action.micro_step}</p>
      <div className="mt-4 rounded-card border border-border bg-input p-3 text-[12px] leading-5 text-textSecondary">
        중단해도 실패가 아닙니다. abort reason은 다음 제안 크기를 줄이는 내부 신호로만
        저장됩니다.
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
