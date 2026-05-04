import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { updateMe } from "../../api/auth";
import { getApiErrorMessage } from "../../api/errors";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Input } from "../common/Input";

export function AccountPanel() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const resetFlow = useAppStore((state) => state.resetFlow);
  const displayName = user?.nickname?.trim() || user?.email?.split("@")[0] || "사용자";
  const [nickname, setNickname] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setNickname(displayName);
  }, [displayName]);

  function handleLogout() {
    logout();
    resetFlow();
    navigate("/login");
  }

  async function handleSaveNickname() {
    const normalized = nickname.trim();
    if (normalized.length < 2 || normalized.length > 30) {
      setMessage("닉네임은 2~30자로 입력해주세요.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateMe(normalized);
      setUser(updated);
      setMessage("닉네임을 저장했습니다.");
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
      </div>
      <div className="mt-4 border border-border bg-input p-3">
        <label className="text-[12px] font-semibold text-textSecondary">nickname</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          <Button variant="primary" disabled={saving} onClick={handleSaveNickname}>
            save
          </Button>
        </div>
        {message && <p className="mt-2 text-[12px] text-textSecondary">{message}</p>}
      </div>
      <Button className="mt-4" variant="secondary" onClick={handleLogout}>
        logout
      </Button>
    </Card>
  );
}
