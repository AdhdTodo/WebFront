import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login, me, register } from "../api/auth";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password);
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await me();
      setUser(user);
      navigate("/today");
    } catch {
      setError("회원가입에 실패했습니다. 이메일 또는 비밀번호 정책을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-[460px] rounded-panel border border-border bg-surface p-8 shadow-subtle">
        <div className="text-[24px] font-bold text-textPrimary">Create account</div>
        <p className="mt-2 text-[13px] leading-6 text-textSecondary">
          비밀번호는 8자 이상, 문자와 숫자를 포함해야 합니다.
        </p>
        <div className="mt-6 space-y-4">
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
          {error && <p className="text-[12px] text-redMuted">{error}</p>}
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
          <Link className="font-bold text-primary" to="/login">
            login
          </Link>
        </div>
      </div>
    </div>
  );
}
