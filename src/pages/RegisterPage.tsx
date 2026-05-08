import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login, me, register } from "../api/auth";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const normalizedNickname = nickname.trim();
    if (!normalizedNickname) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (normalizedNickname.length < 2 || normalizedNickname.length > 30) {
      setError("닉네임은 2~30자로 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password, normalizedNickname);
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await me();
      setUser(user);
      navigate("/today");
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[480px] rounded-panel border border-border bg-panel p-8 shadow-subtle backdrop-blur">
        <div className="text-[24px] font-bold text-textPrimary">Create account</div>
        <p className="mt-2 text-[13px] leading-6 text-textSecondary">
          닉네임은 화면 오른쪽 위 프로필에 표시됩니다. 비밀번호는 8자 이상, 문자와 숫자를
          포함해야 합니다.
        </p>
        <p className="mt-4 rounded-card border border-accent/35 bg-accentSoft p-3 text-[12px] leading-5 text-textSecondary">
          회원가입 후 인증 메일이 발송됩니다. 기존 흐름처럼 바로 사용할 수 있지만, Settings에서
          인증 상태를 확인하고 메일을 다시 보낼 수 있습니다.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Input
              placeholder="닉네임 예: 시열"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
            <p className="mt-1 text-[11px] text-textMuted">
              화면 오른쪽 위 프로필에 표시됩니다.
            </p>
          </div>
          <Input
            placeholder="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            placeholder="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            placeholder="confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error && <p className="text-[12px] font-semibold text-textPrimary">{error}</p>}
          <Button
            className="w-full"
            variant="primary"
            disabled={loading || !email || !password || !confirmPassword}
            onClick={handleRegister}
          >
            {loading ? "creating" : "register"}
          </Button>
        </div>
        <div className="mt-5 text-[13px] text-textSecondary">
          이미 계정이 있다면{" "}
          <Link className="font-bold text-textPrimary underline decoration-accent decoration-2 underline-offset-4 hover:text-accent" to="/login">
            login
          </Link>
        </div>
      </div>
    </div>
  );
}
