import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { abortAction, completeAction } from "../api/actions";
import { createBrainDump } from "../api/brainDumps";
import { getApiErrorMessage } from "../api/errors";
import { createFeedback } from "../api/feedback";
import { ActiveActionPanel } from "../components/actions/ActiveActionPanel";
import { BrainDumpComposer } from "../components/brainDump/BrainDumpComposer";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionBoard } from "../components/suggestions/SuggestionBoard";
import { mockHistoryRows, mockSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";
import type { Action, Suggestion } from "../types/api";

export function TodayBoardPage() {
  const navigate = useNavigate();
  const currentSession = useAppStore((state) => state.currentSession);
  const currentSuggestions = useAppStore((state) => state.currentSuggestions);
  const activeAction = useAppStore((state) => state.activeAction);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);
  const setCurrentSuggestions = useAppStore((state) => state.setCurrentSuggestions);
  const addSmallerSuggestions = useAppStore((state) => state.addSmallerSuggestions);
  const setActiveAction = useAppStore((state) => state.setActiveAction);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    currentSuggestions.length > 0
      ? `session #${currentSession?.id} 후보를 복원했습니다.`
      : "로그인 후 Brain Dump를 입력하면 실제 API로 후보를 생성합니다.",
  );
  const [loading, setLoading] = useState(false);
  const suggestions = currentSuggestions.length > 0 ? currentSuggestions : mockSuggestions;

  const metrics = [
    ["Today suggestions", String(currentSuggestions.length)],
    ["Active actions", activeAction?.status === "active" ? "1" : "0"],
    ["Feedback signals", String(feedbackCount)],
    ["Mode", "No pressure"],
  ];

  async function handleCreateBrainDump(rawText: string) {
    setLoading(true);
    setStatusMessage("백엔드에 Brain Dump를 보내는 중");
    try {
      const response = await createBrainDump(rawText, currentSession?.id);
      setCurrentSession(response.session);
      setCurrentSuggestions(response.suggestions);
      setActiveAction(null);
      setStatusMessage(
        `session #${response.session.id}에서 후보 ${response.suggestions.length}개 생성`,
      );
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDo(suggestion: Suggestion) {
    try {
      const response = await createFeedback(suggestion.session_id, suggestion.id, "do");
      if (!response.action_id) {
        setStatusMessage("Action ID가 응답에 없습니다. feedback do 흐름을 확인하세요.");
        return;
      }
      setFeedbackCount((count) => count + 1);
      const nextAction: Action = {
        id: response.action_id ?? Date.now(),
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
      setStatusMessage("Feedback do 저장. Action이 생성되었습니다.");
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
      const smaller = response.smaller_suggestions;
      addSmallerSuggestions(smaller);
      setFeedbackCount((count) => count + 1);
      setStatusMessage(`더 작은 후보 ${smaller.length}개가 추가되었습니다.`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handlePass(suggestion: Suggestion) {
    try {
      await createFeedback(suggestion.session_id, suggestion.id, "pass");
      setFeedbackCount((count) => count + 1);
      setStatusMessage("pass 신호를 저장했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleComplete() {
    if (!activeAction) return;
    try {
      const updated = await completeAction(activeAction.id, "completed from web");
      setActiveAction(updated);
      setStatusMessage("Action을 completed로 저장했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleAbort() {
    if (!activeAction) return;
    try {
      const updated = await abortAction(activeAction.id, "too large right now");
      setActiveAction(updated);
      setStatusMessage("Action을 aborted로 저장했습니다. 실패 기록이 아니라 조절 신호입니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(([label, value]) => (
          <Card key={label} className="p-4">
            <div className="text-[12px] font-semibold text-textMuted">{label}</div>
            <div className="mt-2 text-[24px] font-bold text-textPrimary">{value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-textSecondary">API status</span>
          <span className="text-textMuted">{statusMessage}</span>
        </div>
      </Card>
      <BrainDumpComposer compact loading={loading} onSubmit={handleCreateBrainDump} />
      {currentSuggestions.length === 0 && (
        <Card className="p-3">
          <p className="text-[13px] text-textSecondary">
            아직 실제 API로 생성된 suggestion이 없습니다. 아래 카드는 화면 구조 확인용 예시입니다.
          </p>
        </Card>
      )}
      <div className="grid grid-cols-3 gap-5">
        <SuggestionBoard
          suggestions={suggestions}
          onDo={handleDo}
          onMakeSmaller={handleMakeSmaller}
          onPass={handlePass}
        />
        <ActiveActionPanel
          action={activeAction}
          onComplete={handleComplete}
          onAbort={handleAbort}
        />
        <div className="space-y-5">
          <FeedbackPanel />
          <Card title="Review / Signals" meta="최근 흐름과 예정 모듈을 함께 봅니다.">
            <div className="mb-4 flex flex-wrap gap-2">
              {["do", "pass", "snooze", "smaller"].map((signal) => (
                <Badge key={signal} tone={signal === "do" ? "green" : "muted"}>
                  {signal}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              {mockHistoryRows.slice(0, 3).map((row) => (
                <div key={row.join("-")} className="flex justify-between text-[12px]">
                  <span className="text-textSecondary">{row[0]}</span>
                  <span className="text-textMuted">{row[2]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-[12px] text-textSecondary">
              <div className="bg-input p-2">AI fallback / ready</div>
              <div className="bg-input p-2">Routines / enabled</div>
              <div className="bg-input p-2">Calendar import / planned</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
