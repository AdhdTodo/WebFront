import { useNavigate } from "react-router-dom";

import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function AccountPanel() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resetFlow = useAppStore((state) => state.resetFlow);
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "사용자";

  function handleLogout() {
    logout();
    resetFlow();
    navigate("/login");
  }

  return (
    <Card title="Account / Security" meta="JWT access / refresh token과 login protection 상태입니다.">
      <div className="space-y-3 text-[13px] text-textSecondary">
        <div className="flex justify-between border-b border-border pb-2">
          <span>nickname</span>
          <strong className="text-textPrimary">{displayName}</strong>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>user email</span>
          <strong className="text-textPrimary">{user?.email ?? "not loaded"}</strong>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>token flow</span>
          <strong className="text-textPrimary">access + refresh</strong>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>login protection</span>
          <strong className="text-textPrimary">5 failures / 5 min block</strong>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>rate limit</span>
          <strong className="text-textPrimary">login + brain dumps</strong>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>profile update</span>
          <strong className="text-textPrimary">planned</strong>
        </div>
      </div>
      <Button className="mt-4" variant="secondary" onClick={handleLogout}>
        logout
      </Button>
    </Card>
  );
}
