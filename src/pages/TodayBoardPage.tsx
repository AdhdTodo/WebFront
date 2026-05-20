import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { abortAction, completeAction } from "../api/actions";
import { createBrainDump } from "../api/brainDumps";
import {
  createCalendarEvent,
  downloadCalendarIcs,
  listCalendarEvents,
} from "../api/calendar";
import { scheduleSuggestionAsCalendarCandidate } from "../api/calendarCandidates";
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
type CalendarView = "month" | "week" | "day";

const timeSlots = ["08:00", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "20:00"];

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
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [selectedSlot, setSelectedSlot] = useState<Date>(nextHalfHourSlot());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    slot: Date;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const suggestions =
    currentSuggestions.length > 0 ? currentSuggestions : env.useMocks ? mockSuggestions : [];
  const visibleSuggestions = suggestions.filter(
    (suggestion) => suggestion.generation_type !== "smaller",
  );
  const recentActions = history?.actions.slice(0, 4) ?? [];
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const monthStart = useMemo(() => startOfMonthGrid(today), [today]);
  const monthEnd = useMemo(() => addDays(monthStart, 42), [monthStart]);
  const dayStart = useMemo(() => startOfDay(today), [today]);
  const dayEnd = useMemo(() => addDays(dayStart, 1), [dayStart]);
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (calendarView === "month") return [monthStart, monthEnd];
    if (calendarView === "day") return [dayStart, dayEnd];
    return [weekStart, weekEnd];
  }, [calendarView, dayEnd, dayStart, monthEnd, monthStart, weekEnd, weekStart]);
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
  }, [calendarView]);

  const metrics = [
    ["행동 후보", String(visibleSuggestions.length)],
    ["실행 중", activeAction?.status === "active" ? "1" : "0"],
    ["캘린더 블록", String(calendarEvents.length)],
    ["보기", viewLabel(calendarView)],
  ];

  async function refreshCalendarEvents() {
    setCalendarLoading(true);
    try {
      const events = await listCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString());
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

  async function handleScheduleSuggestion(suggestion: Suggestion) {
    setCalendarLoading(true);
    try {
      const startAt = selectedSlot;
      const endAt = new Date(startAt.getTime() + defaultSuggestionMinutes(suggestion) * 60_000);
      const response = await scheduleSuggestionAsCalendarCandidate(
        suggestion.session_id,
        suggestion.id,
        {
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          timezone: "Asia/Seoul",
          placement_source: "calendar_cell",
        },
      );
      await refreshCalendarEvents();
      setStatusMessage(
        `"${response.event.title}"을 ${formatKoreanDateTime(startAt)} 캘린더에 놓았습니다.`,
      );
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setCalendarLoading(false);
    }
  }

  function handleSelectSlot(slot: Date) {
    setSelectedSlot(slot);
    setContextMenu(null);
    setStatusMessage(`${formatKoreanDateTime(slot)} 칸을 선택했습니다. 왼쪽 후보에서 캘린더에 놓기를 누르세요.`);
  }

  function handleOpenContextMenu(event: MouseEvent, slot: Date) {
    event.preventDefault();
    setSelectedSlot(slot);
    setContextMenu({ x: event.clientX, y: event.clientY, slot });
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
            onSchedule={handleScheduleSuggestion}
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
                        view === viewLabel(calendarView)
                          ? "border-primary bg-primary text-textPrimary"
                          : "border-border bg-input text-textSecondary hover:border-accent"
                      }`}
                      onClick={() => setCalendarView(toCalendarView(view))}
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

            <div className="mt-3 border border-border bg-surface px-3 py-2 text-[12px] text-textSecondary">
              선택된 시간:{" "}
              <span className="font-bold text-textPrimary">{formatKoreanDateTime(selectedSlot)}</span>
            </div>

            {calendarView === "month" && (
              <MonthCalendar
                events={calendarEvents}
                monthStart={monthStart}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}
            {calendarView === "week" && (
              <WeekCalendar
                weekStart={weekStart}
                blocks={calendarBlocks}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}
            {calendarView === "day" && (
              <DayCalendar
                date={today}
                events={calendarEvents}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            {contextMenu && (
              <div
                className="fixed z-50 w-[210px] border border-border bg-panel p-2 text-[12px] shadow-[0_12px_30px_rgba(47,52,50,0.08)]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                <button
                  className="block w-full px-3 py-2 text-left font-semibold text-textPrimary hover:bg-primary"
                  type="button"
                  onClick={() => handleSelectSlot(contextMenu.slot)}
                >
                  이 시간 선택
                </button>
                <button
                  className="block w-full px-3 py-2 text-left text-textSecondary hover:bg-surface"
                  type="button"
                  onClick={() => handleSelectSlot(new Date(contextMenu.slot.getTime() + 30 * 60_000))}
                >
                  30분 뒤로 선택
                </button>
                <button
                  className="block w-full px-3 py-2 text-left text-textSecondary hover:bg-surface"
                  type="button"
                  onClick={() => {
                    setContextMenu(null);
                    navigate("/brain-dumps");
                  }}
                >
                  생각 쏟아내기로 이동
                </button>
              </div>
            )}

            {calendarBlocks.length === 0 && !calendarLoading && (
              <div className="mt-4">
                <EmptyState
                  title="이번 주 캘린더 블록이 없습니다."
                  description="캘린더 칸을 클릭한 뒤 왼쪽 행동 후보에서 캘린더에 놓기를 누르면 바로 저장됩니다."
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

function WeekCalendar({
  weekStart,
  blocks,
  selectedSlot,
  onSelectSlot,
  onOpenContextMenu,
}: {
  weekStart: Date;
  blocks: CalendarBlock[];
  selectedSlot: Date;
  onSelectSlot: (slot: Date) => void;
  onOpenContextMenu: (event: MouseEvent, slot: Date) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-[64px_repeat(7,minmax(92px,1fr))] overflow-x-auto border border-border bg-input text-[12px]">
      <div className="border-b border-r border-border bg-surface px-2 py-3 font-semibold text-textMuted">
        시간
      </div>
      {weekDays.map((day, index) => (
        <div
          key={day}
          className="border-b border-r border-border bg-surface px-3 py-3 font-bold text-textPrimary last:border-r-0"
        >
          {day} <span className="text-textMuted">{addDays(weekStart, index).getDate()}</span>
        </div>
      ))}
      {timeSlots.map((slot, slotIndex) => (
        <CalendarRow
          key={slot}
          weekStart={weekStart}
          slot={slot}
          slotIndex={slotIndex}
          blocks={blocks}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
          onOpenContextMenu={onOpenContextMenu}
        />
      ))}
    </div>
  );
}

function CalendarRow({
  weekStart,
  slot,
  slotIndex,
  blocks,
  selectedSlot,
  onSelectSlot,
  onOpenContextMenu,
}: {
  weekStart: Date;
  slot: string;
  slotIndex: number;
  blocks: CalendarBlock[];
  selectedSlot: Date;
  onSelectSlot: (slot: Date) => void;
  onOpenContextMenu: (event: MouseEvent, slot: Date) => void;
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
        const cellSlot = slotDate(addDays(weekStart, dayIndex), slot);
        const selected = sameMinute(selectedSlot, cellSlot);
        return (
          <div
            key={`${day}-${slot}`}
            className={`min-h-[86px] space-y-2 border-r border-t border-border p-2 last:border-r-0 ${
              selected ? "bg-accentSoft" : "bg-panel/60 hover:bg-surface"
            }`}
            onClick={() => onSelectSlot(cellSlot)}
            onContextMenu={(event) => onOpenContextMenu(event, cellSlot)}
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

function MonthCalendar({
  events,
  monthStart,
  selectedSlot,
  onSelectSlot,
  onOpenContextMenu,
}: {
  events: CalendarEvent[];
  monthStart: Date;
  selectedSlot: Date;
  onSelectSlot: (slot: Date) => void;
  onOpenContextMenu: (event: MouseEvent, slot: Date) => void;
}) {
  const days = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index));
  return (
    <div className="mt-4 grid grid-cols-7 overflow-hidden border border-border bg-input text-[12px]">
      {weekDays.map((day) => (
        <div key={day} className="border-b border-r border-border bg-surface px-3 py-3 font-bold">
          {day}
        </div>
      ))}
      {days.map((day) => {
        const cellSlot = slotDate(day, "09:00");
        const cellEvents = events.filter((event) => sameDay(new Date(event.start_at), day));
        return (
          <div
            key={day.toISOString()}
            className={`min-h-[116px] space-y-2 border-b border-r border-border p-2 ${
              sameDay(selectedSlot, cellSlot) ? "bg-accentSoft" : "bg-panel hover:bg-surface"
            }`}
            onClick={() => onSelectSlot(cellSlot)}
            onContextMenu={(event) => onOpenContextMenu(event, cellSlot)}
          >
            <div className="font-bold text-textPrimary">{day.getDate()}</div>
            {cellEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="border border-primary bg-primary px-2 py-1">
                <div className="line-clamp-1 font-semibold">{event.title}</div>
                <div className="text-[11px] text-textSecondary">
                  {formatTime(new Date(event.start_at))}
                </div>
              </div>
            ))}
            {cellEvents.length > 3 && (
              <div className="text-[11px] text-textMuted">+{cellEvents.length - 3}개</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayCalendar({
  date,
  events,
  selectedSlot,
  onSelectSlot,
  onOpenContextMenu,
}: {
  date: Date;
  events: CalendarEvent[];
  selectedSlot: Date;
  onSelectSlot: (slot: Date) => void;
  onOpenContextMenu: (event: MouseEvent, slot: Date) => void;
}) {
  return (
    <div className="mt-4 border border-border bg-input text-[12px]">
      {timeSlots.map((slot) => {
        const cellSlot = slotDate(date, slot);
        const cellEvents = events.filter((event) => sameMinute(new Date(event.start_at), cellSlot));
        return (
          <div key={slot} className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-border">
            <div className="border-r border-border bg-surface px-3 py-4 font-medium text-textMuted">
              {slot}
            </div>
            <div
              className={`min-h-[76px] space-y-2 p-3 ${
                sameMinute(selectedSlot, cellSlot) ? "bg-accentSoft" : "bg-panel hover:bg-surface"
              }`}
              onClick={() => onSelectSlot(cellSlot)}
              onContextMenu={(event) => onOpenContextMenu(event, cellSlot)}
            >
              {cellEvents.map((event) => (
                <div key={event.id} className="border border-primary bg-primary px-3 py-2">
                  <div className="font-bold text-textPrimary">{event.title}</div>
                  <div className="text-[11px] text-textSecondary">
                    {formatTime(new Date(event.start_at))} · {event.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
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

function startOfMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(first);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function slotDate(date: Date, slot: string) {
  const [hour, minute] = slot.split(":").map(Number);
  const copy = new Date(date);
  copy.setHours(hour, minute, 0, 0);
  return copy;
}

function sameMinute(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate() &&
    left.getHours() === right.getHours() &&
    left.getMinutes() === right.getMinutes()
  );
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
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

function formatKoreanDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function viewLabel(view: CalendarView) {
  if (view === "month") return "월";
  if (view === "day") return "일";
  return "주";
}

function toCalendarView(label: string): CalendarView {
  if (label === "월") return "month";
  if (label === "일") return "day";
  return "week";
}

function defaultSuggestionMinutes(suggestion: Suggestion) {
  if (suggestion.effort_level === "nano" || suggestion.effort_level === "tiny") return 15;
  if (suggestion.effort_level === "quiet") return 20;
  return 30;
}
