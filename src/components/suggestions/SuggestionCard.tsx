import { ArrowDownToLine, CalendarPlus, Check, MinusCircle } from "lucide-react";

import type { Suggestion } from "../../types/api";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface SuggestionCardProps {
  suggestion: Suggestion;
  compact?: boolean;
  onDo?: (suggestion: Suggestion) => void;
  onMakeSmaller?: (suggestion: Suggestion) => void;
  onPass?: (suggestion: Suggestion) => void;
  onSchedule?: (suggestion: Suggestion) => void;
}

export function SuggestionCard({
  suggestion,
  compact = false,
  onDo,
  onMakeSmaller,
  onPass,
  onSchedule,
}: SuggestionCardProps) {
  return (
    <article className="rounded-card border border-border bg-panel p-4 transition hover:border-accent/45 hover:bg-surface">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={suggestion.effort_level === "neutral" ? "neutral" : "quiet"}>
            {suggestion.effort_level}
          </Badge>
          <span className="text-[11px] font-medium text-textMuted">{suggestion.source}</span>
        </div>
        <span className="text-[11px] text-textMuted">#{suggestion.id}</span>
      </div>
      <h3 className="mt-3 text-[15px] font-bold text-textPrimary">{suggestion.title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-textSecondary">{suggestion.micro_step}</p>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" icon={<Check size={14} />} onClick={() => onDo?.(suggestion)}>
            선택
          </Button>
          {onSchedule && (
            <Button
              variant="quiet"
              icon={<CalendarPlus size={14} />}
              onClick={() => onSchedule(suggestion)}
            >
              캘린더에 놓기
            </Button>
          )}
          <Button
            variant="secondary"
            icon={<ArrowDownToLine size={14} />}
            onClick={() => onMakeSmaller?.(suggestion)}
          >
            작게
          </Button>
          <Button variant="ghost" icon={<MinusCircle size={14} />} onClick={() => onPass?.(suggestion)}>
            이번엔 넘기기
          </Button>
        </div>
      )}
    </article>
  );
}
