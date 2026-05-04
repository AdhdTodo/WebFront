import { useState } from "react";

import { abortAction, completeAction } from "../api/actions";
import { createBrainDump } from "../api/brainDumps";
import { createFeedback } from "../api/feedback";
import { makeSmaller } from "../api/suggestions";
import { ActiveActionPanel } from "../components/actions/ActiveActionPanel";
import { BrainDumpComposer } from "../components/brainDump/BrainDumpComposer";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionBoard } from "../components/suggestions/SuggestionBoard";
import { mockHistoryRows, mockSuggestions } from "../mockData";
import type { Action, Suggestion } from "../types/api";

export function TodayBoardPage() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("mock data loaded");
  const [loading, setLoading] = useState(false);

  const metrics = [
    ["Today suggestions", String(suggestions.length)],
    ["Active actions", activeAction?.status === "active" ? "1" : "0"],
    ["Feedback signals", String(feedbackCount)],
    ["Mode", "No pressure"],
  ];

  async function handleCreateBrainDump(rawText: string) {
    setLoading(true);
    setStatusMessage("백엔드에 Brain Dump를 보내는 중");
    try {
      const response = await createBrainDump(rawText, sessionId ?? undefined);
      setSessionId(response.session.id);
      setSuggestions(response.suggestions);
      setActiveAction(null);
      setStatusMessage(`session #${response.session.id}에서 후보 ${response.suggestions.length}개 생성`);
    } catch {
      setStatusMessage("API 호출에 실패했습니다. 로그인 상태와 백엔드 주소를 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDo(suggestion: Suggestion) {
    try {
      const response = await createFeedback(suggestion.session_id, suggestion.id, "do");
      setFeedbackCount((count) => count + 1);
      setActiveAction({
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
      });
      setStatusMessage("Feedback do 저장. Action이 생성되었습니다.");
    } catch {
      setStatusMessage("선택 처리에 실패했습니다. 이미 Action이 있거나 인증이 필요할 수 있습니다.");
    }
  }

  async function handleMakeSmaller(suggestion: Suggestion) {
    try {
      const smaller = await makeSmaller(suggestion.id);
      setSuggestions((current) => [...smaller, ...current]);
      setStatusMessage(`더 작은 후보 ${smaller.length}개가 추가되었습니다.`);
    } catch {
      setStatusMessage("make_smaller 호출에 실패했습니다.");
    }
  }

  async function handlePass(suggestion: Suggestion) {
    try {
      await createFeedback(suggestion.session_id, suggestion.id, "pass");
      setFeedbackCount((count) => count + 1);
      setStatusMessage("pass 신호를 저장했습니다.");
    } catch {
      setStatusMessage("pass 저장에 실패했습니다.");
    }
  }

  async function handleComplete() {
    if (!activeAction) return;
    try {
      const updated = await completeAction(activeAction.id, "completed from web");
      setActiveAction(updated);
      setStatusMessage("Action을 completed로 저장했습니다.");
    } catch {
      setStatusMessage("완료 저장에 실패했습니다.");
    }
  }

  async function handleAbort() {
    if (!activeAction) return;
    try {
      const updated = await abortAction(activeAction.id, "too large right now");
      setActiveAction(updated);
      setStatusMessage("Action을 aborted로 저장했습니다. 실패 기록이 아니라 조절 신호입니다.");
    } catch {
      setStatusMessage("중단 저장에 실패했습니다.");
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
