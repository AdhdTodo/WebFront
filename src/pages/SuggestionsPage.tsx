import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getApiErrorMessage } from "../api/errors";
import { createFeedback } from "../api/feedback";
import { listSessionBrainDumps } from "../api/sessions";
import { listSuggestions } from "../api/suggestions";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { env } from "../config/env";
import { mockBrainDump, mockSmallerSuggestions, mockSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";
import type { Action, BrainDump, Suggestion } from "../types/api";

export function SuggestionsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const routeSessionId = params.sessionId ? Number(params.sessionId) : null;
  const currentSession = useAppStore((state) => state.currentSession);
  const currentSuggestions = useAppStore((state) => state.currentSuggestions);
  const smallerSuggestions = useAppStore((state) => state.smallerSuggestions);
  const setCurrentSuggestions = useAppStore((state) => state.setCurrentSuggestions);
  const addSmallerSuggestions = useAppStore((state) => state.addSmallerSuggestions);
  const setActiveAction = useAppStore((state) => state.setActiveAction);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("후보를 비교하고 반응을 남길 수 있습니다.");

  const sessionId = routeSessionId ?? currentSession?.id ?? null;
  const suggestions = useMemo(
    () => (currentSuggestions.length > 0 ? currentSuggestions : env.useMocks ? mockSuggestions : []),
    [currentSuggestions],
  );
  const smaller =
    smallerSuggestions.length > 0 ? smallerSuggestions : env.useMocks ? mockSmallerSuggestions : [];
  const originalBrainDump =
    brainDumps[0]?.raw_text ?? (env.useMocks ? mockBrainDump : "");
  const smallerByParent = smaller.reduce<Record<number, Suggestion[]>>((groups, suggestion) => {
    const parentId = suggestion.parent_suggestion_id;
    if (!parentId) return groups;

    groups[parentId] = [...(groups[parentId] ?? []), suggestion];
    return groups;
  }, {});

  useEffect(() => {
    if (!routeSessionId) return;

    setLoading(true);
    Promise.all([listSuggestions(routeSessionId), listSessionBrainDumps(routeSessionId)])
      .then(([items, dumps]) => {
        setCurrentSuggestions(items);
        setBrainDumps([...dumps].sort((a, b) => b.id - a.id));
        setStatusMessage(`session #${routeSessionId} 후보 ${items.length}개를 불러왔습니다.`);
      })
      .catch((error) => setStatusMessage(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [routeSessionId, setCurrentSuggestions]);

  async function handleDo(suggestion: Suggestion) {
    try {
      const response = await createFeedback(suggestion.session_id, suggestion.id, "do");
      const actionId = response.action?.id ?? response.action_id;
      if (!actionId) {
        setStatusMessage("Action ID가 응답에 없습니다.");
        return;
      }
      const nextAction: Action = response.action ?? {
        // TODO: replace this display shell when the backend exposes GET /actions/{action_id}
        // or includes the full action object in FeedbackResponse.
        id: actionId,
        session_id: suggestion.session_id,
        suggestion_id: suggestion.id,
        title: suggestion.title,
        micro_step: suggestion.micro_step,
        status: "active",
        completion_note: null,
        abort_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveAction(nextAction);
      setStatusMessage("선택 신호를 저장하고 Action으로 전환했습니다.");
      navigate(`/actions/${actionId}`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleMakeSmaller(suggestion: Suggestion) {
    try {
      const response = await createFeedback(
        suggestion.session_id,
        suggestion.id,
        "make_smaller",
      );
      const smallerItems = response.smaller_suggestions ?? [];
      addSmallerSuggestions(smallerItems);
      setStatusMessage(`더 작은 후보 ${smallerItems.length}개를 추가했습니다.`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handlePass(suggestion: Suggestion) {
    try {
      await createFeedback(suggestion.session_id, suggestion.id, "pass");
      setStatusMessage("pass 신호를 저장했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="grid grid-cols-[1fr_340px] gap-5">
      <div className="space-y-5">
        <Card title="Original Brain Dump" meta="원본 입력 요약">
          {originalBrainDump ? (
            <p className="text-[14px] leading-7 text-textSecondary">{originalBrainDump}</p>
          ) : (
            <EmptyState
              title="원본 Brain Dump가 없습니다."
              description="session URL로 진입하면 원본 입력을 API에서 다시 불러옵니다."
            />
          )}
        </Card>
        <div className="flex items-center gap-2 rounded-card border border-border bg-surface p-3">
          {[
            "all",
            "quiet",
            "gentle",
            "neutral",
            `${suggestions.length} candidates`,
            sessionId ? `session #${sessionId}` : "no session",
          ].map((item) => (
            <Badge key={item} tone={item === "quiet" ? "quiet" : "muted"}>
              {item}
            </Badge>
          ))}
        </div>
        <Card className="p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-textSecondary">
              {loading ? "loading" : "suggestion flow"}
            </span>
            <span className="text-textMuted">{statusMessage}</span>
          </div>
        </Card>
        {loading && <LoadingState message="session 기준 suggestion을 불러오는 중입니다." />}
        {!loading && !sessionId && (
          <EmptyState
            title="선택된 session이 없습니다."
            description="Today에서 Brain Dump를 입력하면 session URL로 이동합니다."
          />
        )}
        {!loading && sessionId && suggestions.length === 0 && (
          <EmptyState
            title="아직 생성된 후보가 없습니다."
            description="Brain Dump를 입력하면 여러 suggestion이 이 보드에 표시됩니다."
          />
        )}
        <div className="grid grid-cols-3 gap-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="space-y-2">
              <SuggestionCard
                suggestion={suggestion}
                onDo={handleDo}
                onMakeSmaller={handleMakeSmaller}
                onPass={handlePass}
              />
              {(smallerByParent[suggestion.id] ?? []).length > 0 && (
                <div className="border border-border bg-input p-3">
                  <div className="mb-2 text-[11px] font-bold text-textMuted">
                    Smaller suggestions
                  </div>
                  <div className="space-y-2">
                    {smallerByParent[suggestion.id].map((smallerSuggestion) => (
                      <SuggestionCard
                        key={smallerSuggestion.id}
                        suggestion={smallerSuggestion}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <FeedbackPanel />
        <Card title="make_smaller result" meta="부담이 느껴지는 후보를 더 작은 시작 행동으로 봅니다.">
          <div className="space-y-3">
            {smaller.length === 0 && (
              <EmptyState
                title="아직 더 작은 후보가 없습니다."
                description="부담스러운 suggestion에서 작게 버튼을 누르면 여기에 표시됩니다."
              />
            )}
            {smaller.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} compact />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
