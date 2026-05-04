import { env } from "../../config/env";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

export function AiSettingsPanel() {
  return (
    <Card title="AI settings" meta="AI는 선택 사항이며 실패 시 rule-based fallback으로 전환됩니다.">
      <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">AI_SUGGESTION_ENABLED</div>
          <div className="mt-2 flex items-center justify-between">
            <strong>{env.aiSuggestionEnabled ? "true" : "false"}</strong>
            <Badge tone="muted">optional</Badge>
          </div>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">model</div>
          <strong className="mt-2 block">gpt-4.1-mini</strong>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">JSON schema</div>
          <strong className="mt-2 block">structured outputs</strong>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">fallback</div>
          <strong className="mt-2 block">rule_based</strong>
        </div>
      </div>
      <p className="mt-4 text-[12px] leading-5 text-textSecondary">
        현재는 rule-based suggestion generator가 기본입니다. AI 연결 시 Brain Dump 분해와
        make_smaller를 보조하고, AI가 실패해도 기본 제안기가 계속 동작합니다.
      </p>
    </Card>
  );
}
