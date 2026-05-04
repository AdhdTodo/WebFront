import { useEffect, useState } from "react";

import { getApiErrorMessage } from "../api/errors";
import { getHistory } from "../api/history";
import { Card } from "../components/common/Card";
import { HistoryTable } from "../components/history/HistoryTable";
import { HistoryTimeline } from "../components/history/HistoryTimeline";
import type { HistoryResponse } from "../types/api";

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState("최근 흐름을 불러오는 중");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((data) => {
        setHistory(data);
        setStatusMessage("내 데이터 기준 최근 흐름을 불러왔습니다.");
      })
      .catch((error) => setStatusMessage(getApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const brainDumps = history?.brain_dumps ?? [];
  const actions = history?.actions ?? [];
  const feedback = history?.feedback ?? [];
  const smallerCount = feedback.filter((item) => item.reaction === "make_smaller").length;
  const captureOnlyCount = feedback.filter((item) => item.reaction === "capture_only").length;

  return (
    <div className="grid grid-cols-[1fr_340px] gap-5">
      <div className="space-y-5">
        <Card className="p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-textSecondary">
              {loading ? "loading" : "history"}
            </span>
            <span className="text-textMuted">{statusMessage}</span>
          </div>
        </Card>
        {history && brainDumps.length + actions.length + feedback.length === 0 && (
          <Card className="p-4">
            <p className="text-[13px] text-textSecondary">
              아직 저장된 흐름이 없습니다. Brain Dump를 입력하고 suggestion에 반응하면 여기에
              기록됩니다.
            </p>
          </Card>
        )}
        <HistoryTable brainDumps={brainDumps} actions={actions} feedback={feedback} />
      </div>
      <div className="space-y-5">
        <Card title="Weekly summary" meta="성공률 대신 다시 돌아온 흐름을 봅니다.">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Brain Dumps", String(brainDumps.length)],
              ["Actions returned", String(actions.length)],
              ["Smaller requests", String(smallerCount)],
              ["Capture only", String(captureOnlyCount)],
            ].map(([label, value]) => (
              <div key={label} className="bg-input p-3">
                <div className="text-[11px] text-textMuted">{label}</div>
                <div className="mt-1 text-[20px] font-bold">{value}</div>
              </div>
            ))}
          </div>
        </Card>
        <HistoryTimeline feedback={feedback} />
      </div>
    </div>
  );
}
