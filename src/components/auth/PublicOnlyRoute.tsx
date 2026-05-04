import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";

export function PublicOnlyRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (accessToken) {
    return <Navigate to="/today" replace />;
  }

  return <Outlet />;
}
