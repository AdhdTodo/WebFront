import { env } from "../../config/env";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

export function AiSettingsPanel() {
  const aiStatus = env.aiSuggestionEnabled ? "enabled" : "off";

  return (
    <Card title="AI settings" meta="AI는 선택 사항이며 실패 시 rule-based fallback으로 전환됩니다.">
      <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">AI Suggestion</div>
          <div className="mt-2 flex items-center justify-between">
            <strong>{aiStatus}</strong>
            <Badge tone={env.aiSuggestionEnabled ? "green" : "muted"}>optional</Badge>
          </div>
        </div>
        <div className="rounded-card border border-border bg-input p-3">
          <div className="text-textMuted">model</div>
          <strong className="mt-2 block">{env.aiModel}</strong>
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
        AI는 Brain Dump 분해와 make_smaller를 보조합니다. 실패 시 기본 제안기가 계속
        동작합니다. OpenAI API key는 프론트에 저장하지 않고 백엔드에서만 사용합니다.
      </p>
    </Card>
  );
}
