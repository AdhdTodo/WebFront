import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { abortAction, completeAction } from "../api/actions";
import { createBrainDump } from "../api/brainDumps";
import { getApiErrorMessage } from "../api/errors";
import { createFeedback } from "../api/feedback";
import { getHistory } from "../api/history";
import { ActiveActionPanel } from "../components/actions/ActiveActionPanel";
import { BrainDumpComposer } from "../components/brainDump/BrainDumpComposer";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { env } from "../config/env";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionBoard } from "../components/suggestions/SuggestionBoard";
import { mockSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";
import type { Action, HistoryResponse, Suggestion } from "../types/api";

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const timeSlots = ["09:00", "10:30", "13:00", "14:30", "16:00"];

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
      : "로그인 후 생각을 입력하면 실제 API로 행동 후보를 생성합니다.",
  );
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const suggestions =
    currentSuggestions.length > 0 ? currentSuggestions : env.useMocks ? mockSuggestions : [];
  const visibleSuggestions = suggestions.filter(
    (suggestion) => suggestion.generation_type !== "smaller",
  );
  const recentActions = history?.actions.slice(0, 4) ?? [];
  const calendarBlocks = useMemo(
    () => [
      ...(activeAction
        ? [
            {
              dayIndex: 0,
              slotIndex: 1,
              title: activeAction.title,
              meta: "실행 중",
              tone: "active" as const,
            },
          ]
        : []),
      ...recentActions.slice(0, 4).map((action, index) => ({
        dayIndex: (index + 1) % weekDays.length,
        slotIndex: (index + 2) % timeSlots.length,
        title: action.title,
        meta:
          action.status === "completed"
            ? "완료됨"
            : action.status === "aborted"
              ? "중단 기록"
              : "기록됨",
        tone: action.status === "aborted" ? ("soft" as const) : ("neutral" as const),
      })),
    ],
    [activeAction, recentActions],
  );

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setHistory(null));
  }, []);

  const metrics = [
    ["행동 후보", String(visibleSuggestions.length)],
    ["실행 중", activeAction?.status === "active" ? "1" : "0"],
    ["반응 신호", String(feedbackCount)],
    ["보기", "주간"],
  ];

  async function handleCreateBrainDump(rawText: string) {
    setLoading(true);
    setStatusMessage("백엔드에 생각을 보내는 중");
    try {
      const response = await createBrainDump(rawText, currentSession?.id);
      setCurrentSession(response.session);
      setCurrentSuggestions(response.suggestions);
      setActiveAction(null);
      setStatusMessage(
        `session #${response.session.id}에서 후보 ${response.suggestions.length}개 생성`,
      );
      navigate(`/sessions/${response.session.id}/suggestions`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDo(suggestion: Suggestion) {
    try {
      const response = await createFeedback(suggestion.session_id, suggestion.id, "do");
      if (!response.action) {
        setStatusMessage("Action 응답이 없습니다. feedback do 흐름을 확인하세요.");
        return;
      }
      setFeedbackCount((count) => count + 1);
      const nextAction: Action = response.action;
      setActiveAction(nextAction);
      setStatusMessage("선택 신호를 저장했습니다. Action이 생성되었습니다.");
      navigate(`/actions/${nextAction.id}`);
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
      const smaller = response.smaller_suggestions ?? [];
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
      setStatusMessage("이번엔 넘기기 신호를 저장했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleComplete() {
    if (!activeAction) return;
    try {
      const updated = await completeAction(activeAction.id, "completed from web");
      setActiveAction(updated);
      setStatusMessage("Action을 완료됨으로 저장했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  async function handleAbort() {
    if (!activeAction) return;
    try {
      const updated = await abortAction(activeAction.id, "too large right now");
      setActiveAction(updated);
      setStatusMessage("Action을 중단 기록으로 저장했습니다. 다음 제안 조절 신호입니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-5">
          <BrainDumpComposer compact loading={loading} onSubmit={handleCreateBrainDump} />
          <SuggestionBoard
            suggestions={visibleSuggestions}
            onDo={handleDo}
            onMakeSmaller={handleMakeSmaller}
            onPass={handlePass}
          />
        </div>

        <div className="space-y-5">
          <Card className="bg-panel">
            <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[12px] font-semibold text-textMuted">이번 주 캘린더</div>
                <h2 className="mt-1 text-[22px] font-bold text-textPrimary">
                  후보를 고르면 실행할 행동이 시간 흐름 안에 놓입니다.
                </h2>
                <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-textSecondary">
                  아직 실제 드래그 앤 드롭 일정 저장은 다음 단계입니다. 지금은 생성된 행동
                  후보와 실행 중인 행동을 한 화면에서 보며 흐름을 잡습니다.
                </p>
              </div>
              <div className="flex gap-2 text-[12px]">
                {["월", "주", "일"].map((view) => (
                  <button
                    key={view}
                    className={`h-8 rounded-sm border px-3 font-semibold ${
                      view === "주"
                        ? "border-primary bg-primary text-textPrimary"
                        : "border-border bg-input text-textSecondary hover:border-accent"
                    }`}
                    type="button"
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[64px_repeat(7,minmax(92px,1fr))] overflow-x-auto border border-border bg-input text-[12px]">
              <div className="border-b border-r border-border bg-surface px-2 py-3 font-semibold text-textMuted">
                시간
              </div>
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-border bg-surface px-3 py-3 font-bold text-textPrimary last:border-r-0"
                >
                  {day}
                </div>
              ))}
              {timeSlots.map((slot, slotIndex) => (
                <CalendarRow
                  key={slot}
                  slot={slot}
                  slotIndex={slotIndex}
                  blocks={calendarBlocks}
                />
              ))}
            </div>

            {calendarBlocks.length === 0 && (
              <div className="mt-4">
                <EmptyState
                  title="오늘은 아직 비어 있습니다."
                  description="생각을 입력하고 행동 후보를 선택하면 실행할 행동이 이 흐름 안에 표시됩니다."
                />
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ActiveActionPanel
              action={activeAction}
              onComplete={handleComplete}
              onAbort={handleAbort}
            />
            <div className="space-y-5">
              <Card className="bg-panel p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-textSecondary">연결 상태</span>
                  <span className="text-textMuted">{statusMessage}</span>
                </div>
              </Card>
              <Card title="요약" meta="오늘 화면에 표시된 실제 흐름입니다.">
                <div className="grid grid-cols-2 gap-2">
                  {metrics.map(([label, value]) => (
                    <div key={label} className="rounded-sm border border-border bg-input p-3">
                      <div className="text-[11px] font-semibold text-textMuted">{label}</div>
                      <div className="mt-1 text-[20px] font-bold text-textPrimary">{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <FeedbackPanel />
              <Card title="최근 흐름" meta="성공률이 아니라 반응 신호를 확인합니다.">
                <div className="mb-4 flex flex-wrap gap-2">
                  {["선택", "이번엔 넘기기", "나중에 보기", "더 작게"].map((signal) => (
                    <Badge key={signal} tone={signal === "선택" ? "success" : "muted"}>
                      {signal}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  {!history && (
                    <EmptyState
                      title="아직 최근 흐름이 없습니다."
                      description="Action이나 reaction이 저장되면 이곳에 표시됩니다."
                    />
                  )}
                  {history?.actions.slice(0, 3).map((action) => (
                    <div key={action.id} className="flex justify-between text-[12px]">
                      <span className="text-textSecondary">{action.title}</span>
                      <span className="text-textMuted">{action.status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface CalendarBlock {
  dayIndex: number;
  slotIndex: number;
  title: string;
  meta: string;
  tone: "active" | "neutral" | "soft";
}

function CalendarRow({
  slot,
  slotIndex,
  blocks,
}: {
  slot: string;
  slotIndex: number;
  blocks: CalendarBlock[];
}) {
  return (
    <>
      <div className="min-h-[86px] border-r border-t border-border px-2 py-3 font-medium text-textMuted">
        {slot}
      </div>
      {weekDays.map((day, dayIndex) => {
        const block = blocks.find(
          (item) => item.dayIndex === dayIndex && item.slotIndex === slotIndex,
        );
        return (
          <div
            key={`${day}-${slot}`}
            className="min-h-[86px] border-r border-t border-border bg-panel/60 p-2 last:border-r-0"
          >
            {block && (
              <div
                className={`rounded-sm border px-2 py-2 ${
                  block.tone === "active"
                    ? "border-primary bg-primary"
                    : block.tone === "soft"
                      ? "border-accent/35 bg-accentSoft"
                      : "border-border bg-surface"
                }`}
              >
                <div className="line-clamp-2 text-[12px] font-bold text-textPrimary">
                  {block.title}
                </div>
                <div className="mt-1 text-[11px] text-textSecondary">{block.meta}</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
