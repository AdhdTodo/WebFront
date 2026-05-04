import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../store/authStore";
import { ProtectedRoute } from "./ProtectedRoute";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it("redirects to login without token", () => {
    render(
      <MemoryRouter initialEntries={["/today"]}>
        <Routes>
          <Route element={<ProtectedRoute restoringUser={false} />}>
            <Route path="/today" element={<div>protected</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders protected content with token and user", () => {
    useAuthStore.getState().setTokens("access", "refresh");
    useAuthStore.getState().setUser({
      id: 1,
      email: "user@example.com",
      nickname: "유저",
      created_at: "now",
    });

    render(
      <MemoryRouter initialEntries={["/today"]}>
        <Routes>
          <Route element={<ProtectedRoute restoringUser={false} />}>
            <Route path="/today" element={<div>protected</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("protected")).toBeInTheDocument();
  });
});
