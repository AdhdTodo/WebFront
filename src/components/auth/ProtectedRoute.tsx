import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingState } from "../common/LoadingState";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  restoringUser: boolean;
}

export function ProtectedRoute({ restoringUser }: ProtectedRouteProps) {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (restoringUser || !user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <LoadingState message="로그인 상태를 복원하는 중입니다." />
      </div>
    );
  }

  return <Outlet />;
}
