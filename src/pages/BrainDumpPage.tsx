import { useEffect, useState } from "react";

import { createBrainDump } from "../api/brainDumps";
import { getApiErrorMessage } from "../api/errors";
import { getHistory } from "../api/history";
import { BrainDumpComposer } from "../components/brainDump/BrainDumpComposer";
import { BrainDumpPreview } from "../components/brainDump/BrainDumpPreview";
import { Card } from "../components/common/Card";
import { useAppStore } from "../store/appStore";
import type { BrainDump } from "../types/api";

export function BrainDumpPage() {
  const currentSession = useAppStore((state) => state.currentSession);
  const currentSuggestions = useAppStore((state) => state.currentSuggestions);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);
  const setCurrentSuggestions = useAppStore((state) => state.setCurrentSuggestions);
  const setActiveAction = useAppStore((state) => state.setActiveAction);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [statusMessage, setStatusMessage] = useState("긴 Brain Dump를 그대로 입력할 수 있습니다.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getHistory()
      .then((history) => setBrainDumps(history.brain_dumps))
      .catch(() => setBrainDumps([]));
  }, []);

  async function handleCreateBrainDump(rawText: string) {
    setLoading(true);
    setStatusMessage("Brain Dump를 분해하는 중입니다.");
    try {
      const response = await createBrainDump(rawText, currentSession?.id);
      setCurrentSession(response.session);
      setCurrentSuggestions(response.suggestions);
      setActiveAction(null);
      setBrainDumps((items) => [response.brain_dump, ...items]);
      setStatusMessage(`후보 ${response.suggestions.length}개를 생성했습니다.`);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5">
      <div className="space-y-5">
        <Card className="p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-textSecondary">
              {loading ? "loading" : "brain dump"}
            </span>
            <span className="text-textMuted">{statusMessage}</span>
          </div>
        </Card>
        <BrainDumpComposer loading={loading} onSubmit={handleCreateBrainDump} />
        <Card title="Past brain dumps" meta="이전 입력과 생성된 후보 흐름입니다.">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-textMuted">
              <tr>
                <th className="pb-3">time</th>
                <th className="pb-3">summary</th>
                <th className="pb-3">candidates</th>
                <th className="pb-3">actions</th>
              </tr>
            </thead>
            <tbody>
              {brainDumps.length === 0 && (
                <tr className="border-t border-border">
                  <td className="py-3 text-textSecondary" colSpan={4}>
                    아직 저장된 Brain Dump가 없습니다.
                  </td>
                </tr>
              )}
              {brainDumps.slice(0, 10).map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="py-3 text-textSecondary">{formatDate(item.created_at)}</td>
                  <td className="py-3 text-textSecondary">{item.raw_text.slice(0, 36)}</td>
                  <td className="py-3 text-textSecondary">session #{item.session_id}</td>
                  <td className="py-3 text-textSecondary">후보 흐름</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <BrainDumpPreview suggestions={currentSuggestions} />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
