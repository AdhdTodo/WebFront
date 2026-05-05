import type { Routine } from "../../api/routines";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface RoutineCardProps {
  routine: Routine;
  onStart?: (routine: Routine) => void;
  onToggle?: (routine: Routine) => void;
  onDelete?: (routine: Routine) => void;
}

export function RoutineCard({ routine, onStart, onToggle, onDelete }: RoutineCardProps) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-subtle">
      <div className="flex items-center justify-between">
        <Badge tone={routine.effort_level === "neutral" ? "neutral" : "quiet"}>
          {routine.effort_level}
        </Badge>
        <span className="text-[11px] text-textMuted">
          {routine.is_active ? "enabled" : "paused"}
        </span>
      </div>
      <h3 className="mt-3 text-[15px] font-bold text-textPrimary">{routine.title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-textSecondary">{routine.micro_step}</p>
      <p className="mt-3 border-l-2 border-primarySoft pl-3 text-[12px] leading-5 text-textMuted">
        루틴은 실패 대비가 아니라 돌아올 수 있는 후보입니다.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant="primary"
          disabled={!routine.is_active}
          onClick={() => onStart?.(routine)}
        >
          이 루틴으로 시작
        </Button>
        <Button
          variant={routine.is_active ? "secondary" : "quiet"}
          onClick={() => onToggle?.(routine)}
        >
          {routine.is_active ? "잠시 숨김" : "다시 사용"}
        </Button>
        <Button variant="ghost" onClick={() => onDelete?.(routine)}>
          삭제
        </Button>
      </div>
    </article>
  );
}
