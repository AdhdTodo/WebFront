import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { downloadCalendarIcs, listCalendarEvents } from "../api/calendar";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import type { CalendarEvent } from "../types/api";

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const timeSlots = ["09:00", "10:30", "13:00", "14:30", "16:00"];

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("확정된 캘린더 블록만 보여줍니다.");
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const blocks = useMemo(
    () => events.map((event) => toCalendarBlock(event, weekStart)),
    [events, weekStart],
  );

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshEvents() {
    setLoading(true);
    try {
      const items = await listCalendarEvents(weekStart.toISOString(), weekEnd.toISOString());
      setEvents(items);
      setStatusMessage(`이번 주 캘린더 블록 ${items.length}개를 불러왔습니다.`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
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
      setStatusMessage("표준 .ics 파일을 만들었습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="캘린더"
        meta="검토를 거쳐 확정된 일정 블록만 확인합니다."
        action={
          <Button variant="secondary" icon={<Download size={14} />} onClick={handleDownloadIcs}>
            .ics 내보내기
          </Button>
        }
      >
        <div className="text-[12px] text-textSecondary">{statusMessage}</div>
      </Card>

      {loading && <LoadingState message="캘린더 블록을 불러오는 중입니다." />}

      <Card className="bg-panel">
        <div className="grid grid-cols-[64px_repeat(7,minmax(92px,1fr))] overflow-x-auto border border-border bg-input text-[12px]">
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
            <CalendarRow key={slot} slot={slot} slotIndex={slotIndex} blocks={blocks} />
          ))}
        </div>

        {blocks.length === 0 && !loading && (
          <div className="mt-4">
            <EmptyState
              title="이번 주 캘린더 블록이 없습니다."
              description="행동 후보를 캘린더 후보로 검토한 뒤 배치하면 이 화면에 표시됩니다."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

interface CalendarBlock {
  id: number;
  dayIndex: number;
  slotIndex: number;
  title: string;
  meta: string;
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
              <div key={block.id} className="rounded-sm border border-primary bg-primary px-2 py-2">
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
    meta: `${formatTime(start)} · ${event.source === "calendar_candidate" ? "후보 배치" : "일정"}`,
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
