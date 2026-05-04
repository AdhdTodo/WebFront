import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { AccountPanel } from "./AccountPanel";

vi.mock("../../api/auth");

describe("AccountPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.getState().logout();
    useAuthStore.getState().setUser({
      id: 1,
      email: "user@example.com",
      nickname: "이전",
      created_at: "now",
    });
  });

  it("updates nickname in auth store", async () => {
    vi.mocked(authApi.updateMe).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      nickname: "새닉네임",
      created_at: "now",
    });

    render(
      <MemoryRouter>
        <AccountPanel />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByDisplayValue("이전"), {
      target: { value: "새닉네임" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.nickname).toBe("새닉네임");
    });
  });
});
