import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function CalendarImportPanel() {
  return (
    <Card title="Calendar Import" meta="캘린더 일정은 1회 흡수 후 후보로 전환하는 방식입니다.">
      <div className="rounded-card border border-dashed border-border bg-input p-4">
        <p className="text-[13px] leading-6 text-textSecondary">
          planned: 캘린더 일정은 바로 할 일로 만들지 않고, 한 번 가져와서 선택 가능한
          suggestion 후보로만 보여주는 흐름으로 준비합니다.
        </p>
        <Button className="mt-4" variant="quiet" disabled>
          calendar import planned
        </Button>
      </div>
    </Card>
  );
}
