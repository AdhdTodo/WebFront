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
      email_verified: false,
      created_at: "now",
    });
  });

  it("updates nickname in auth store", async () => {
    vi.mocked(authApi.updateMe).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      nickname: "새닉네임",
      email_verified: false,
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
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.nickname).toBe("새닉네임");
    });
  });

  it("changes password through account panel", async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue({
      message: "비밀번호가 변경되었습니다.",
    });

    render(
      <MemoryRouter>
        <AccountPanel />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("현재 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("새 비밀번호"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByPlaceholderText("새 비밀번호 확인"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith("password123", "newpass123");
    });
    expect(await screen.findByText("비밀번호가 변경되었습니다.")).toBeInTheDocument();
  });

  it("shows email verification status and resends verification", async () => {
    vi.mocked(authApi.resendVerification).mockResolvedValue({
      message: "인증 메일을 다시 보냈습니다.",
    });

    render(
      <MemoryRouter>
        <AccountPanel />
      </MemoryRouter>,
    );

    expect(screen.getByText("인증 필요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "인증 메일 다시 보내기" }));

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalled();
    });
    expect(await screen.findByText("인증 메일을 다시 보냈습니다.")).toBeInTheDocument();
  });
});
