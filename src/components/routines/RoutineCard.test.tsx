import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Routine } from "../../api/routines";
import { RoutineCard } from "./RoutineCard";

const activeRoutine: Routine = {
  id: 1,
  title: "물 한 컵",
  micro_step: "컵에 물을 따라 한 모금 마십니다.",
  effort_level: "quiet",
  is_active: true,
};

describe("RoutineCard", () => {
  it("starts an active routine", () => {
    const onStart = vi.fn();

    render(<RoutineCard routine={activeRoutine} onStart={onStart} />);

    fireEvent.click(screen.getByRole("button", { name: "이 루틴으로 시작" }));

    expect(onStart).toHaveBeenCalledWith(activeRoutine);
  });

  it("disables start for inactive routines", () => {
    render(<RoutineCard routine={{ ...activeRoutine, is_active: false }} />);

    expect(screen.getByRole("button", { name: "이 루틴으로 시작" })).toBeDisabled();
  });
});
