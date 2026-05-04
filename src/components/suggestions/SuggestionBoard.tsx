import type { Suggestion } from "../../types/api";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { SuggestionCard } from "./SuggestionCard";

interface SuggestionBoardProps {
  suggestions?: Suggestion[];
  onDo?: (suggestion: Suggestion) => void;
  onMakeSmaller?: (suggestion: Suggestion) => void;
  onPass?: (suggestion: Suggestion) => void;
}

export function SuggestionBoard({
  suggestions = [],
  onDo,
  onMakeSmaller,
  onPass,
}: SuggestionBoardProps) {
  return (
    <Card title="Generated Suggestions" meta="처음부터 하나만 고르지 않고 후보를 비교합니다.">
      {suggestions.length === 0 && (
        <EmptyState
          title="아직 생성된 후보가 없습니다."
          description="Brain Dump를 입력하면 여러 suggestion이 여기에 표시됩니다."
        />
      )}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDo={onDo}
            onMakeSmaller={onMakeSmaller}
            onPass={onPass}
          />
        ))}
      </div>
    </Card>
  );
}
