import { mockHistoryRows } from "../../mockData";
import type { Action, BrainDump, Feedback } from "../../types/api";
import { Card } from "../common/Card";

interface HistoryTableProps {
  brainDumps?: BrainDump[];
  actions?: Action[];
  feedback?: Feedback[];
}

export function HistoryTable({ brainDumps = [], actions = [], feedback = [] }: HistoryTableProps) {
  const rows =
    brainDumps.length + actions.length + feedback.length > 0
      ? [
          ...brainDumps.map((item) => [
            "Brain Dump",
            `${item.raw_text.slice(0, 34)}${item.raw_text.length > 34 ? "..." : ""}`,
            formatDate(item.created_at),
            "후보 생성",
          ]),
          ...actions.map((item) => [
            "Action",
            item.title,
            formatDate(item.updated_at ?? item.created_at),
            item.status === "aborted" ? "중단 기록" : item.status,
          ]),
          ...feedback.map((item) => [
            "Feedback",
            item.reaction,
            formatDate(item.created_at),
            item.action_id ? `action #${item.action_id}` : "반응 신호",
          ]),
        ].slice(0, 20)
      : mockHistoryRows;

  return (
    <Card title="Recent activity" meta="성공률이 아니라 최근 흐름을 확인합니다.">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-[12px] text-textMuted">
            <th className="pb-3 font-bold">type</th>
            <th className="pb-3 font-bold">content</th>
            <th className="pb-3 font-bold">time</th>
            <th className="pb-3 font-bold">result</th>
          </tr>
        </thead>
        <tbody>
          {mockHistoryRows.map((row) => (
            <tr key={row.join("-")} className="border-b border-border text-[13px]">
              {row.map((cell) => (
                <td key={cell} className="py-3 text-textSecondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
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
