import type { Suggestion } from "../../types/api";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";

interface BrainDumpPreviewProps {
  suggestions?: Suggestion[];
}

export function BrainDumpPreview({ suggestions = [] }: BrainDumpPreviewProps) {
  return (
    <Card title="Generated preview" meta="생성 결과는 후보 카드로 먼저 확인합니다.">
      {suggestions.length === 0 && (
        <EmptyState
          title="아직 생성된 후보가 없습니다."
          description="Brain Dump를 입력하면 2~5개의 작은 행동 후보가 여기에 표시됩니다."
        />
      )}
      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-card border border-primary bg-primary/35 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={suggestion.effort_level === "neutral" ? "neutral" : "quiet"}>
                {suggestion.effort_level}
              </Badge>
              <span className="text-[11px] text-textMuted">{suggestion.source}</span>
            </div>
            <div className="text-[13px] font-bold text-textPrimary">{suggestion.title}</div>
            <p className="mt-1 text-[12px] leading-5 text-textSecondary">
              {suggestion.micro_step}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
