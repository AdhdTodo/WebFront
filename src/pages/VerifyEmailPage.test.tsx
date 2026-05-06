import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "../api/auth";
import { VerifyEmailPage } from "./VerifyEmailPage";

vi.mock("../api/auth");

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows success after verifying token", async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      message: "이메일 인증이 완료되었습니다.",
    });

    render(
      <MemoryRouter initialEntries={["/verify-email?token=abc1234567891234"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith("abc1234567891234");
    });
    expect(await screen.findByText("이메일 인증이 완료되었습니다.")).toBeInTheDocument();
  });

  it("shows failure when token is rejected", async () => {
    vi.mocked(authApi.verifyEmail).mockRejectedValue(new Error("bad token"));

    render(
      <MemoryRouter initialEntries={["/verify-email?token=bad1234567891234"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("요청을 처리하지 못했습니다. 잠시 뒤 다시 시도하세요."),
    ).toBeInTheDocument();
  });
});
