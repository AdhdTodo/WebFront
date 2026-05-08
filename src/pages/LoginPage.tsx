import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { login, me } from "../api/auth";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await me();
      setUser(user);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || "/today");
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background p-4 lg:grid-cols-[1.08fr_0.92fr] lg:p-6">
      <section className="flex min-h-[560px] flex-col justify-between rounded-panel border border-border bg-surface p-7 shadow-subtle lg:p-12">
        <div>
          <div className="inline-flex rounded-full border border-accent/35 bg-accentSoft px-3 py-1 text-[12px] font-bold text-textPrimary">
            No pressure mode
          </div>
          <div className="mt-5 text-[26px] font-bold text-textPrimary">Decide</div>
          <div className="mt-1 text-[13px] text-textSecondary">ADHD Todo System</div>
        </div>
        <div>
          <h1 className="max-w-[560px] text-[42px] font-bold leading-[1.12] tracking-[-0.02em] text-textPrimary">
            생각을 정리하지 않아도 작은 행동으로 시작할 수 있게
          </h1>
          <p className="mt-5 max-w-[580px] text-[15px] leading-7 text-textSecondary">
            할 일 목록을 직접 관리하게 만들지 않습니다. Brain Dump를 입력하면 시스템이 여러
            개의 micro-action 후보로 나누고, 사용자는 하나를 선택합니다.
          </p>
          <div className="mt-8 grid max-w-[680px] grid-cols-1 gap-4 md:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-card border border-border bg-panel p-5">
              <div className="mb-3 text-[12px] font-bold text-textMuted">Brain Dump</div>
              <p className="text-[14px] leading-7 text-textPrimary">
                발표 준비해야 하는데 자료도 없고 메일도 보내야 하고...
              </p>
            </div>
            <div className="space-y-3">
              {["발표 자료 제목만 작성", "교수님 메일 첫 줄 쓰기"].map((item) => (
                <div
                  key={item}
                  className="rounded-card border border-primary bg-primary/45 p-4"
                >
                  <div className="text-[13px] font-bold text-textPrimary">{item}</div>
                  <p className="mt-1 text-[11px] font-medium text-textSecondary">
                    quiet micro-action
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-textSecondary">
          <ShieldCheck size={15} />
          No pressure mode. Signals are not failure labels.
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] rounded-panel border border-border bg-panel p-8 shadow-subtle backdrop-blur">
          <h2 className="text-[26px] font-bold text-textPrimary">Login</h2>
          <p className="mt-2 text-[13px] leading-6 text-textSecondary">
            JWT access / refresh token, login protection, rate limiting이 적용됩니다.
          </p>
          <div className="mt-7 space-y-4">
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
            {error && <p className="text-[12px] font-semibold text-textPrimary">{error}</p>}
            <Button
              className="w-full"
              variant="primary"
              disabled={loading || !email || !password}
              onClick={handleLogin}
            >
              {loading ? "logging in" : "login"}
              <ArrowRight size={15} />
            </Button>
          </div>
          <div className="mt-5 text-[13px] text-textSecondary">
            계정이 없다면{" "}
            <Link className="font-bold text-textPrimary underline decoration-accent decoration-2 underline-offset-4 hover:text-accent" to="/register">
              register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
