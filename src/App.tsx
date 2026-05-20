import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { me } from "./api/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ActiveActionPage } from "./pages/ActiveActionPage";
import { BrainDumpPage } from "./pages/BrainDumpPage";
import { CalendarCandidatesPage } from "./pages/CalendarCandidatesPage";
import { CalendarPage } from "./pages/CalendarPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoutinesPage } from "./pages/RoutinesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { TodayBoardPage } from "./pages/TodayBoardPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { useAuthStore } from "./store/authStore";

export function App() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [restoringUser, setRestoringUser] = useState(Boolean(accessToken && !user));

  useEffect(() => {
    if (!accessToken || user) {
      setRestoringUser(false);
      return;
    }

    setRestoringUser(true);
    me()
      .then(setUser)
      .catch(() => {
        logout();
      })
      .finally(() => setRestoringUser(false));
  }, [accessToken, logout, setUser, user]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute restoringUser={restoringUser} />}>
        <Route element={<AppLayout />}>
          <Route path="/today" element={<TodayBoardPage />} />
          <Route path="/brain-dumps" element={<BrainDumpPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/sessions/:sessionId/suggestions" element={<SuggestionsPage />} />
          <Route
            path="/sessions/:sessionId/calendar-candidates"
            element={<CalendarCandidatesPage />}
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/actions/active" element={<ActiveActionPage />} />
          <Route path="/actions/:actionId" element={<ActiveActionPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
