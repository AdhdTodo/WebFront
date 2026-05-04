import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getApiErrorMessage } from "../api/errors";
import { createFeedback } from "../api/feedback";
import { listSuggestions } from "../api/suggestions";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { mockBrainDump, mockSmallerSuggestions, mockSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";
import type { Action, Suggestion } from "../types/api";

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
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("후보를 비교하고 반응을 남길 수 있습니다.");

  const sessionId = routeSessionId ?? currentSession?.id ?? null;
  const suggestions = useMemo(
    () => (currentSuggestions.length > 0 ? currentSuggestions : mockSuggestions),
    [currentSuggestions],
  );
  const smaller = smallerSuggestions.length > 0 ? smallerSuggestions : mockSmallerSuggestions;

  useEffect(() => {
    if (!routeSessionId) return;

    setLoading(true);
    listSuggestions(routeSessionId)
      .then((items) => {
        setCurrentSuggestions(items);
        setStatusMessage(`session #${routeSessionId} 후보 ${items.length}개를 불러왔습니다.`);
      })
      .catch((error) => setStatusMessage(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [routeSessionId, setCurrentSuggestions]);

  async function handleDo(suggestion: Suggestion) {
    try {
      const response = await createFeedback(suggestion.session_id, suggestion.id, "do");
      if (!response.action_id) {
        setStatusMessage("Action ID가 응답에 없습니다.");
        return;
      }
      const nextAction: Action = {
        id: response.action_id,
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
      navigate("/actions/active");
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
      addSmallerSuggestions(response.smaller_suggestions);
      setStatusMessage(`더 작은 후보 ${response.smaller_suggestions.length}개를 추가했습니다.`);
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
          <p className="text-[14px] leading-7 text-textSecondary">{mockBrainDump}</p>
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
        {currentSuggestions.length === 0 && (
          <Card className="p-3">
            <p className="text-[13px] text-textSecondary">
              아직 세션 기준 suggestion이 없습니다. Today에서 Brain Dump를 입력하면 이 보드가 실제
              후보로 채워집니다.
            </p>
          </Card>
        )}
        <div className="grid grid-cols-3 gap-4">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDo={handleDo}
              onMakeSmaller={handleMakeSmaller}
              onPass={handlePass}
            />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <FeedbackPanel />
        <Card title="make_smaller result" meta="부담이 느껴지는 후보를 더 작은 시작 행동으로 봅니다.">
          <div className="space-y-3">
            {smaller.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} compact />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
