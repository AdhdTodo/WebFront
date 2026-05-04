import { Check, PauseCircle, Split } from "lucide-react";

import { Button } from "../common/Button";

interface ActionControlsProps {
  onComplete?: () => void;
  onAbort?: () => void;
  onMakeSmaller?: () => void;
  disabled?: boolean;
}

export function ActionControls({
  onComplete,
  onAbort,
  onMakeSmaller,
  disabled = false,
}: ActionControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        icon={<Check size={15} />}
        onClick={onComplete}
        disabled={disabled}
      >
        완료
      </Button>
      <Button
        variant="secondary"
        icon={<PauseCircle size={15} />}
        onClick={onAbort}
        disabled={disabled}
      >
        중단
      </Button>
      <Button variant="quiet" icon={<Split size={15} />} onClick={onMakeSmaller}>
        더 작게 보기
      </Button>
    </div>
  );
}
