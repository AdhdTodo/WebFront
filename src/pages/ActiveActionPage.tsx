import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { abortAction, completeAction, getAction } from "../api/actions";
import { getApiErrorMessage } from "../api/errors";
import { ActiveActionPanel } from "../components/actions/ActiveActionPanel";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { Input } from "../components/common/Input";
import { LoadingState } from "../components/common/LoadingState";
import { env } from "../config/env";
import { mockSmallerSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";

export function ActiveActionPage() {
  const params = useParams();
  const routeActionId = params.actionId ? Number(params.actionId) : null;
  const activeAction = useAppStore((state) => state.activeAction);
  const smallerSuggestions = useAppStore((state) => state.smallerSuggestions);
  const setActiveAction = useAppStore((state) => state.setActiveAction);
  const [abortReason, setAbortReason] = useState("");
  const [statusMessage, setStatusMessage] = useState("선택된 Action 흐름을 확인합니다.");
  const [loading, setLoading] = useState(false);
  const relatedSmaller =
    smallerSuggestions.length > 0
      ? smallerSuggestions
      : env.useMocks
        ? mockSmallerSuggestions
        : [];

  useEffect(() => {
    if (!routeActionId || activeAction?.id === routeActionId) return;

    setLoading(true);
    getAction(routeActionId)
      .then((action) => {
        setActiveAction(action);
        setStatusMessage(`action #${routeActionId}를 불러왔습니다.`);
      })
      .catch((error) => setStatusMessage(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [activeAction?.id, routeActionId, setActiveAction]);

  async function handleComplete() {
    if (!activeAction || activeAction.status !== "active") return;

    try {
      const updated = await completeAction(activeAction.id, "completed from focus view");
      setActiveAction(updated);
      setStatusMessage("완료 신호를 저장했습니다. History에서 최근 흐름으로 확인할 수 있습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleAbort(reason = abortReason) {
    if (!activeAction || activeAction.status !== "active") return;

    try {
      const updated = await abortAction(activeAction.id, reason || undefined);
      setActiveAction(updated);
      setStatusMessage("중단 기록을 저장했습니다. 다음 제안을 더 작게 만들기 위한 신호입니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card className="p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-textSecondary">action status</span>
            <span className="text-textMuted">{statusMessage}</span>
          </div>
        </Card>
        {loading && <LoadingState message="Action을 복원하는 중입니다." />}
        <ActiveActionPanel
          action={activeAction}
          onComplete={handleComplete}
          onAbort={() => handleAbort()}
        />
        <Card title="중단 기록" meta="선택 사항입니다. 다음 제안 크기를 줄이는 내부 신호로만 저장됩니다.">
          <Input
            placeholder="지금은 너무 크게 느껴짐"
            value={abortReason}
            onChange={(event) => setAbortReason(event.target.value)}
          />
          <Button
            className="mt-3"
            variant="secondary"
            disabled={!activeAction || activeAction.status !== "active"}
            onClick={() => handleAbort()}
          >
            중단 기록 저장
          </Button>
        </Card>
        <Card title="Related smaller actions" meta="원한다면 더 작은 단위에서 다시 시작할 수 있습니다.">
          {relatedSmaller.length === 0 && (
            <EmptyState
              title="연결된 더 작은 후보가 없습니다."
              description="Suggestion에서 작게 요청하면 관련 후보가 여기에 표시됩니다."
            />
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {relatedSmaller.map((suggestion) => (
              <div key={suggestion.id} className="border border-border bg-input p-3">
                <div className="text-[13px] font-bold">{suggestion.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-textSecondary">
                  {suggestion.micro_step}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Action detail" meta="Action은 선택 이후 하나로 수렴합니다.">
        <div className="space-y-3 text-[13px] text-textSecondary">
          <Row label="status" value={activeAction?.status ?? "no active action"} />
          <Row label="session id" value={activeAction ? `#${activeAction.session_id}` : "-"} />
          <Row
            label="suggestion id"
            value={activeAction?.suggestion_id ? `#${activeAction.suggestion_id}` : "-"}
          />
          <Row label="estimated time" value="2-5 min" />
        </div>
        <div className="mt-5 space-y-2 border-l-2 border-primary pl-3 text-[12px] text-textSecondary">
          {["Brain Dump", "Suggestion selected", "Feedback do", "Action active", "Complete or Abort"].map(
            (step) => (
              <div key={step}>{step}</div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span>{label}</span>
      <strong className="text-textPrimary">{value}</strong>
    </div>
  );
}
