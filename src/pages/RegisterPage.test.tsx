import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { RegisterPage } from "./RegisterPage";

describe("RegisterPage", () => {
  it("requires nickname", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("confirm password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(screen.getByText("닉네임을 입력해주세요.")).toBeInTheDocument();
  });

  it("shows password mismatch", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("닉네임 예: 시열"), {
      target: { value: "닉네임" },
    });
    fireEvent.change(screen.getByPlaceholderText("email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("confirm password"), {
      target: { value: "password456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(screen.getByText("비밀번호 확인이 일치하지 않습니다.")).toBeInTheDocument();
  });
});
