import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../store/authStore";
import { Topbar } from "./Topbar";

describe("Topbar", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("renders nickname when present", () => {
    useAuthStore.getState().setUser({
      id: 1,
      email: "test@example.com",
      nickname: "시열",
      created_at: "now",
    });

    render(
      <MemoryRouter>
        <Topbar title="Today" subtitle="sub" />
      </MemoryRouter>,
    );

    expect(screen.getByText("시열")).toBeInTheDocument();
  });

  it("falls back to email prefix", () => {
    useAuthStore.getState().setUser({
      id: 1,
      email: "prefix@example.com",
      nickname: null,
      created_at: "now",
    });

    render(
      <MemoryRouter>
        <Topbar title="Today" subtitle="sub" />
      </MemoryRouter>,
    );

    expect(screen.getByText("prefix")).toBeInTheDocument();
  });
});
