import type { Routine } from "../../api/routines";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface RoutineCardProps {
  routine: Routine;
  onToggle?: (routine: Routine) => void;
  onDelete?: (routine: Routine) => void;
}

export function RoutineCard({ routine, onToggle, onDelete }: RoutineCardProps) {
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
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={routine.is_active ? "secondary" : "primary"} onClick={() => onToggle?.(routine)}>
          {routine.is_active ? "pause" : "activate"}
        </Button>
        <Button variant="ghost" onClick={() => onDelete?.(routine)}>
          delete
        </Button>
      </div>
    </article>
  );
}
