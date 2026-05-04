import { useEffect, useState } from "react";

import { getAIStatus, getMyAIUsage, type AIStatus, type AIUsageMe } from "../../api/ai";
import { getApiErrorMessage } from "../../api/errors";
import { env } from "../../config/env";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { LoadingState } from "../common/LoadingState";

export function AiSettingsPanel() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [usage, setUsage] = useState<AIUsageMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const aiStatus = (status?.enabled ?? env.aiSuggestionEnabled) ? "enabled" : "off";

  useEffect(() => {
    Promise.all([getAIStatus(), getMyAIUsage()])
      .then(([statusData, usageData]) => {
        setStatus(statusData);
        setUsage(usageData);
      })
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="AI settings" meta="AI는 선택 사항이며 실패 시 rule-based fallback으로 전환됩니다.">
      {loading && <LoadingState message="AI 상태를 백엔드에서 불러오는 중입니다." />}
      {error && (
        <EmptyState
          title="AI 상태를 불러오지 못했습니다."
          description={`${error} 기본 제안기로 계속 진행할 수 있습니다.`}
        />
      )}
      <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">AI Suggestion</div>
          <div className="mt-2 flex items-center justify-between">
            <strong>{aiStatus}</strong>
            <Badge tone={status?.enabled ? "green" : "muted"}>optional</Badge>
          </div>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">model</div>
          <strong className="mt-2 block">{status?.model ?? env.aiModel}</strong>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">JSON schema</div>
          <strong className="mt-2 block">{status?.structuredOutput ? "ready" : "unknown"}</strong>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">fallback</div>
          <strong className="mt-2 block">{status?.fallback ?? "rule_based"}</strong>
        </div>
      </div>
      {usage && (
        <div className="mt-4 grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-2">
          <Metric label="today calls" value={String(usage.todayCalls)} />
          <Metric label="today estimated cost" value={`$${usage.todayEstimatedCost.toFixed(6)}`} />
          <Metric
            label="monthly estimated cost"
            value={`$${usage.monthlyEstimatedCost.toFixed(6)}`}
          />
          <Metric label="cache hits / fallback" value={`${usage.cacheHits} / ${usage.fallbackCount}`} />
        </div>
      )}
      <p className="mt-4 text-[12px] leading-5 text-textSecondary">
        AI는 Brain Dump 분해와 make_smaller를 보조합니다. 실패 시 기본 제안기가 계속
        동작합니다. OpenAI API key는 프론트에 저장하지 않고 백엔드에서만 사용합니다.
      </p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-input px-3 py-2">
      <div className="text-textMuted">{label}</div>
      <strong className="mt-1 block text-textPrimary">{value}</strong>
    </div>
  );
}
