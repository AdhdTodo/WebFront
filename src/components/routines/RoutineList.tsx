import { env } from "../../config/env";
import { mockRoutines } from "../../mockData";
import { EmptyState } from "../common/EmptyState";
import { RoutineCard } from "./RoutineCard";

export function RoutineList() {
  if (!env.useMocks) {
    return (
      <EmptyState
        title="아직 등록된 안전망 루틴이 없습니다."
        description="운영 모드에서는 실제 API 데이터만 표시합니다. 루틴 API가 연결되면 이 영역에 후보 풀이 표시됩니다."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {mockRoutines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}
    </div>
  );
}
