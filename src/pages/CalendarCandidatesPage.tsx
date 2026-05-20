import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createCalendarCandidatesFromSuggestions,
  listCalendarCandidates,
  scheduleCalendarCandidate,
} from "../api/calendarCandidates";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingState } from "../components/common/LoadingState";
import { useAppStore } from "../store/appStore";
import type { CalendarCandidate } from "../types/api";

const typeLabels: Record<string, string> = {
  fixed_time: "시간 고정",
  flexible: "유연 배치",
  deadline_based: "마감 기반",
  routine: "루틴",
  recovery: "회복 후보",
};

const timeBlockLabels: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  night: "밤",
  anytime: "언제든",
};

const levelLabels: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

const splitLabels: Record<string, string> = {
  single_block: "한 블록",
  multiple_blocks: "분할 가능",
  tiny_first_step: "첫 시작",
};

export function CalendarCandidatesPage() {
  const params = useParams();
  const navigate = useNavigate();
  const routeSessionId = params.sessionId ? Number(params.sessionId) : null;
  const currentSession = useAppStore((state) => state.currentSession);
  const sessionId = routeSessionId ?? currentSession?.id ?? null;
  const [candidates, setCandidates] = useState<CalendarCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "행동 후보를 캘린더에 넣기 전, 시간 기준 후보로 한 번 더 검토합니다.",
  );
  const [startAt, setStartAt] = useState(toLocalInputValue(nextWorkSlot()));

  const selectedCandidate = candidates[selectedIndex] ?? null;
  const endAt = useMemo(() => {
    const start = new Date(startAt);
    const minutes = selectedCandidate?.estimated_minutes ?? 20;
    return toLocalInputValue(new Date(start.getTime() + minutes * 60_000));
  }, [selectedCandidate?.estimated_minutes, startAt]);

  useEffect(() => {
    if (!sessionId) return;
    refreshCandidates(sessionId);
  }, [sessionId]);

  async function refreshCandidates(nextSessionId: number) {
    setLoading(true);
    try {
      const items = await listCalendarCandidates(nextSessionId);
      setCandidates(items);
      setSelectedIndex(0);
      setStatusMessage(
        items.length > 0
          ? `캘린더 후보 ${items.length}개를 불러왔습니다.`
          : "아직 캘린더 후보가 없습니다. 행동 후보에서 생성할 수 있습니다.",
      );
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCandidates() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const items = await createCalendarCandidatesFromSuggestions(sessionId);
      setCandidates(items);
      setSelectedIndex(0);
      setStatusMessage(`캘린더 후보 ${items.length}개를 만들었습니다.`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule() {
    if (!selectedCandidate) return;
    setSaving(true);
    try {
      const response = await scheduleCalendarCandidate(selectedCandidate.id, {
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        timezone: "Asia/Seoul",
      });
      setCandidates((items) =>
        items.map((item) => (item.id === response.candidate.id ? response.candidate : item)),
      );
      setStatusMessage("캘린더에 배치했습니다. 캘린더 화면에서 주간 블록으로 확인할 수 있습니다.");
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function moveSelected(offset: number) {
    setSelectedIndex((index) => {
      const next = Math.min(Math.max(index + offset, 0), Math.max(candidates.length - 1, 0));
      return next;
    });
  }

  if (!sessionId) {
    return (
      <EmptyState
        title="검토할 세션이 없습니다."
        description="생각 쏟아내기에서 행동 후보를 만든 뒤 캘린더 후보를 생성할 수 있습니다."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Card
          title="캘린더 후보 검토"
          meta="AI/룰이 만든 행동 후보를 바로 일정으로 넣지 않고, 시간 기준으로 한 번 더 확인합니다."
          action={
            <Button variant="secondary" disabled={loading} onClick={handleCreateCandidates}>
              후보 만들기
            </Button>
          }
        >
          <div className="text-[12px] text-textSecondary">{statusMessage}</div>
        </Card>

        {loading && <LoadingState message="캘린더 후보를 불러오는 중입니다." />}

        {!loading && !selectedCandidate && (
          <EmptyState
            title="아직 캘린더 후보가 없습니다."
            description="행동 후보를 기준으로 예상 시간, 배치 방식, 에너지 기준을 만든 뒤 한 개씩 검토합니다."
          />
        )}

        {selectedCandidate && (
          <Card className="bg-panel">
            <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[12px] font-semibold text-textMuted">
                  {selectedIndex + 1} / {candidates.length}
                </div>
                <h2 className="mt-2 text-[24px] font-bold text-textPrimary">
                  {selectedCandidate.title}
                </h2>
                <p className="mt-3 text-[14px] leading-7 text-textSecondary">
                  {selectedCandidate.micro_step}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<ChevronLeft size={14} />}
                  disabled={selectedIndex === 0}
                  onClick={() => moveSelected(-1)}
                >
                  이전
                </Button>
                <Button
                  variant="secondary"
                  icon={<ChevronRight size={14} />}
                  disabled={selectedIndex >= candidates.length - 1}
                  onClick={() => moveSelected(1)}
                >
                  다음
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <CandidateMetric label="유형" value={typeLabels[selectedCandidate.candidate_type]} />
              <CandidateMetric
                label="예상 시간"
                value={`${selectedCandidate.estimated_minutes}분`}
              />
              <CandidateMetric
                label="추천 시간대"
                value={timeBlockLabels[selectedCandidate.preferred_time_block]}
              />
              <CandidateMetric
                label="분할 방식"
                value={splitLabels[selectedCandidate.split_strategy]}
              />
              <CandidateMetric
                label="에너지"
                value={levelLabels[selectedCandidate.energy_level]}
              />
              <CandidateMetric
                label="마찰감"
                value={levelLabels[selectedCandidate.friction_level]}
              />
              <CandidateMetric label="상태" value={statusLabel(selectedCandidate.status)} />
              <CandidateMetric
                label="시간 범위"
                value={`${selectedCandidate.min_minutes}-${selectedCandidate.max_minutes}분`}
              />
            </div>

            {selectedCandidate.reason && (
              <div className="mt-5 border border-border bg-surface p-4 text-[13px] leading-6 text-textSecondary">
                {selectedCandidate.reason}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="space-y-2 text-[12px] font-semibold text-textSecondary">
                시작 시간
                <input
                  className="h-10 w-full rounded-sm border border-border bg-input px-3 text-[13px] text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-[12px] font-semibold text-textSecondary">
                종료 시간
                <input
                  className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-[13px] text-textMuted"
                  type="datetime-local"
                  value={endAt}
                  readOnly
                />
              </label>
              <Button
                variant="primary"
                icon={<CalendarDays size={14} />}
                disabled={saving || selectedCandidate.status === "scheduled"}
                onClick={handleSchedule}
              >
                캘린더에 배치
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <Card title="화면 분리" meta="한 화면에서 하나의 결정만 하도록 나눕니다.">
          <ol className="space-y-3 text-[13px] leading-6 text-textSecondary">
            <li>1. 생각 쏟아내기: 정리하지 않은 입력</li>
            <li>2. 행동 후보: 무엇을 할지 선택</li>
            <li>3. 캘린더 후보: 언제 넣을지 검토</li>
            <li>4. 캘린더: 확정된 블록 확인</li>
            <li>5. 실행: 하나의 Action에 집중</li>
          </ol>
        </Card>
        <Card title="캘린더 기준" meta="후보 생성에 쓰는 엄밀한 기준입니다.">
          <div className="space-y-2 text-[12px] leading-5 text-textSecondary">
            <p>시간 표현이 있으면 시간 고정 후보로 봅니다.</p>
            <p>마감 표현이 있으면 마감 기반 후보로 봅니다.</p>
            <p>큰 작업은 첫 시작 행동으로 줄입니다.</p>
            <p>일정 확정 전에는 항상 사용자가 한 번 확인합니다.</p>
          </div>
        </Card>
        <Button variant="quiet" onClick={() => navigate("/calendar")}>
          캘린더 보기
        </Button>
      </div>
    </div>
  );
}

function CandidateMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-input p-3">
      <div className="text-[11px] font-semibold text-textMuted">{label}</div>
      <div className="mt-1 text-[14px] font-bold text-textPrimary">{value}</div>
    </div>
  );
}

function statusLabel(status: CalendarCandidate["status"]) {
  if (status === "scheduled") return "배치됨";
  if (status === "accepted") return "확인됨";
  if (status === "rejected") return "넘김";
  return "제안됨";
}

function nextWorkSlot() {
  const date = new Date();
  date.setMinutes(date.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (date.getMinutes() === 0) {
    date.setHours(date.getHours() + 1);
  }
  return date;
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
