import { mockRoutines } from "../../mockData";
import { RoutineCard } from "./RoutineCard";

export function RoutineList() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {mockRoutines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}
    </div>
  );
}
