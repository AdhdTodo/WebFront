import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { abortAction, completeAction } from "../api/actions";
import { createBrainDump } from "../api/brainDumps";
import {
  createCalendarEvent,
  downloadCalendarIcs,
  listCalendarEvents,
} from "../api/calendar";
import { getApiErrorMessage } from "../api/errors";
import { createFeedback } from "../api/feedback";
import { getHistory } from "../api/history";
import { ActiveActionPanel } from "../components/actions/ActiveActionPanel";
import { BrainDumpComposer } from "../components/brainDump/BrainDumpComposer";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { env } from "../config/env";
import { FeedbackPanel } from "../components/suggestions/FeedbackPanel";
import { SuggestionBoard } from "../components/suggestions/SuggestionBoard";
import { mockSuggestions } from "../mockData";
import { useAppStore } from "../store/appStore";
import type { Action, CalendarEvent, HistoryResponse, Suggestion } from "../types/api";

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
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const suggestions =
    currentSuggestions.length > 0 ? currentSuggestions : env.useMocks ? mockSuggestions : [];
  const visibleSuggestions = suggestions.filter(
    (suggestion) => suggestion.generation_type !== "smaller",
  );
  const recentActions = history?.actions.slice(0, 4) ?? [];
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const calendarBlocks = useMemo(
    () => calendarEvents.map((event) => toCalendarBlock(event, weekStart)),
    [calendarEvents, weekStart],
  );

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setHistory(null));
  }, []);

  useEffect(() => {
    refreshCalendarEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = [
    ["행동 후보", String(visibleSuggestions.length)],
    ["실행 중", activeAction?.status === "active" ? "1" : "0"],
    ["캘린더 블록", String(calendarEvents.length)],
    ["보기", "주간"],
  ];

  async function refreshCalendarEvents() {
    setCalendarLoading(true);
    try {
      const events = await listCalendarEvents(weekStart.toISOString(), weekEnd.toISOString());
      setCalendarEvents(events);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setCalendarLoading(false);
    }
  }

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

  async function handleScheduleActiveAction() {
    if (!activeAction) {
      setStatusMessage("캘린더에 배치할 실행 중 Action이 없습니다.");
      return;
    }
    setCalendarLoading(true);
    try {
      const startAt = nextHalfHourSlot();
      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
      await createCalendarEvent({
        action_id: activeAction.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        timezone: "Asia/Seoul",
      });
      await refreshCalendarEvents();
      setStatusMessage("실행 중 Action을 캘린더 블록으로 배치했습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleDownloadIcs() {
    try {
      const icsText = await downloadCalendarIcs();
      const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "adhd-todo-calendar.ics";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusMessage("표준 .ics 파일을 만들었습니다. Google/Apple/Outlook에서 가져올 수 있습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
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
                  캘린더 블록은 서버에 저장되고 표준 .ics 파일로 내보낼 수 있습니다.
                  Google Calendar, Apple Calendar, Outlook으로 가져가기 쉬운 구조입니다.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-[12px]">
                <div className="flex gap-2">
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
                <Button
                  variant="secondary"
                  disabled={!activeAction || calendarLoading}
                  onClick={handleScheduleActiveAction}
                  className="h-8"
                >
                  Action 배치
                </Button>
                <Button
                  variant="quiet"
                  disabled={calendarLoading}
                  onClick={handleDownloadIcs}
                  className="h-8"
                >
                  .ics 내보내기
                </Button>
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

            {calendarBlocks.length === 0 && !calendarLoading && (
              <div className="mt-4">
                <EmptyState
                  title="이번 주 캘린더 블록이 없습니다."
                  description="Action을 선택한 뒤 캘린더에 배치하거나 .ics 파일로 다른 앱에 가져갈 수 있습니다."
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
  id: number;
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
        const cellBlocks = blocks.filter(
          (item) => item.dayIndex === dayIndex && item.slotIndex === slotIndex,
        );
        return (
          <div
            key={`${day}-${slot}`}
            className="min-h-[86px] space-y-2 border-r border-t border-border bg-panel/60 p-2 last:border-r-0"
          >
            {cellBlocks.map((block) => (
              <div
                key={block.id}
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
            ))}
          </div>
        );
      })}
    </>
  );
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayOffset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function nextHalfHourSlot() {
  const date = new Date();
  const minutes = date.getMinutes();
  const nextMinutes = minutes < 30 ? 30 : 60;
  date.setMinutes(nextMinutes, 0, 0);
  if (nextMinutes === 60) {
    date.setHours(date.getHours() + 1, 0, 0, 0);
  }
  return date;
}

function toCalendarBlock(event: CalendarEvent, weekStart: Date): CalendarBlock {
  const start = new Date(event.start_at);
  const dayIndex = Math.max(
    0,
    Math.min(6, Math.floor((start.getTime() - weekStart.getTime()) / 86_400_000)),
  );
  const slotIndex = closestSlotIndex(start);
  return {
    id: event.id,
    dayIndex,
    slotIndex,
    title: event.title,
    meta: `${formatTime(start)} · ${event.source === "action" ? "Action" : "일정"}`,
    tone: event.action_id ? "active" : "neutral",
  };
}

function closestSlotIndex(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const slotMinutes = timeSlots.map((slot) => {
    const [hour, minute] = slot.split(":").map(Number);
    return hour * 60 + minute;
  });
  return slotMinutes.reduce((bestIndex, current, index) => {
    const bestDistance = Math.abs(slotMinutes[bestIndex] - minutes);
    const currentDistance = Math.abs(current - minutes);
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
