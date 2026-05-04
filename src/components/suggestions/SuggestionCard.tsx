import { ArrowDownToLine, Check, MinusCircle } from "lucide-react";

import type { Suggestion } from "../../types/api";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface SuggestionCardProps {
  suggestion: Suggestion;
  compact?: boolean;
  onDo?: (suggestion: Suggestion) => void;
  onMakeSmaller?: (suggestion: Suggestion) => void;
  onPass?: (suggestion: Suggestion) => void;
}

export function SuggestionCard({
  suggestion,
  compact = false,
  onDo,
  onMakeSmaller,
  onPass,
}: SuggestionCardProps) {
  return (
    <article className="border-l-2 border-primary bg-surface p-4 shadow-subtle">
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
        <div className="mt-4 flex gap-2">
          <Button variant="primary" icon={<Check size={14} />} onClick={() => onDo?.(suggestion)}>
            선택
          </Button>
          <Button
            variant="secondary"
            icon={<ArrowDownToLine size={14} />}
            onClick={() => onMakeSmaller?.(suggestion)}
          >
            작게
          </Button>
          <Button variant="ghost" icon={<MinusCircle size={14} />} onClick={() => onPass?.(suggestion)}>
            pass
          </Button>
        </div>
      )}
    </article>
  );
}
