import { env } from "../../config/env";
import { mockRoutines } from "../../mockData";
import { EmptyState } from "../common/EmptyState";
import { RoutineCard } from "./RoutineCard";
import type { Routine } from "../../api/routines";

interface RoutineListProps {
  routines: Routine[];
  onStart: (routine: Routine) => void;
  onToggle: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}

export function RoutineList({ routines, onStart, onToggle, onDelete }: RoutineListProps) {
  const visibleRoutines = routines.length > 0 ? routines : env.useMocks ? mockRoutines : [];
  if (visibleRoutines.length === 0) {
    return (
      <EmptyState
        title="아직 등록된 안전망 루틴이 없습니다."
        description="작은 안전망 행동을 하나 추가하면 이곳에 표시됩니다."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleRoutines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          onStart={onStart}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
