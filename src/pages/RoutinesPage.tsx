import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createRoutine,
  deleteRoutine,
  listRoutines,
  startRoutineAction,
  updateRoutine,
  type Routine,
} from "../api/routines";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { Input } from "../components/common/Input";
import { LoadingState } from "../components/common/LoadingState";
import { RoutineList } from "../components/routines/RoutineList";
import { useAppStore } from "../store/appStore";

export function RoutinesPage() {
  const navigate = useNavigate();
  const setActiveAction = useAppStore((state) => state.setActiveAction);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [title, setTitle] = useState("");
  const [microStep, setMicroStep] = useState("");
  const [effortLevel, setEffortLevel] = useState<"quiet" | "gentle" | "neutral">("quiet");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRoutines()
      .then(setRoutines)
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!title.trim() || !microStep.trim()) {
      setError("루틴 제목과 작은 행동 문장을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createRoutine({
        title: title.trim(),
        micro_step: microStep.trim(),
        effort_level: effortLevel,
        is_active: true,
      });
      setRoutines((items) => [created, ...items]);
      setTitle("");
      setMicroStep("");
      setEffortLevel("quiet");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(routine: Routine) {
    try {
      setError(null);
      const updated = await updateRoutine(routine.id, { is_active: !routine.is_active });
      setRoutines((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function handleDelete(routine: Routine) {
    try {
      setError(null);
      await deleteRoutine(routine.id);
      setRoutines((items) => items.filter((item) => item.id !== routine.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function handleStart(routine: Routine) {
    if (!routine.is_active) {
      setError("숨겨둔 루틴은 다시 사용으로 바꾼 뒤 시작할 수 있습니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const action = await startRoutineAction(routine.id);
      setActiveAction(action);
      navigate(`/actions/${action.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card title="Safety net routines" meta="제안이 막힐 때 사용할 부담 낮은 행동 풀입니다.">
        <p className="text-[13px] leading-6 text-textSecondary">
          Routine은 체크리스트가 아니라 제안이 끊겼을 때 돌아올 수 있는 안전망 후보입니다.
        </p>
      </Card>
      <Card title="New routine" meta="언제든 다시 돌아올 수 있는 작은 시작 행동을 저장합니다.">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr_150px_auto]">
          <Input
            placeholder="제목 예: 물 한 컵"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            placeholder="작은 행동 예: 컵에 물을 따라 한 모금 마시기"
            value={microStep}
            onChange={(event) => setMicroStep(event.target.value)}
          />
          <select
            className="h-10 rounded-sm border border-border bg-input px-3 text-[13px] text-textPrimary outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(220,155,155,0.22)]"
            value={effortLevel}
            onChange={(event) =>
              setEffortLevel(event.target.value as "quiet" | "gentle" | "neutral")
            }
          >
            <option value="quiet">quiet</option>
            <option value="gentle">gentle</option>
            <option value="neutral">neutral</option>
          </select>
          <Button variant="primary" disabled={saving} onClick={handleCreate}>
            추가
          </Button>
        </div>
        {error && <p className="mt-3 text-[12px] font-semibold text-textPrimary">{error}</p>}
      </Card>
      {loading && <LoadingState message="루틴을 불러오는 중입니다." />}
      {!loading && error && routines.length === 0 && (
        <EmptyState title="루틴을 불러오지 못했습니다." description={error} />
      )}
      {!loading && (
        <RoutineList
          routines={routines}
          onStart={handleStart}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}
      <Card title="Routine pool settings" meta="fallback 후보 풀의 상태입니다.">
        <table className="w-full text-left text-[13px]">
          <tbody>
            {[
              ["quiet fallback", "enabled"],
              ["gentle fallback", "enabled"],
              ["calendar candidates", "planned"],
            ].map(([label, status]) => (
              <tr key={label} className="border-b border-border">
                <td className="py-3 text-textSecondary">{label}</td>
                <td className="py-3 font-bold text-textPrimary">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
