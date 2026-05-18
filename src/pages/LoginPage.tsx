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
    <div className="min-h-screen bg-background px-5 py-8 lg:px-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1160px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
      <section className="py-4">
        <div>
          <div className="text-[20px] font-bold tracking-tight text-textPrimary">Decide</div>
          <div className="mt-1 text-[12px] font-medium text-textMuted">ADHD 일정 도우미</div>
        </div>
        <div className="mt-24 lg:mt-28">
          <div className="mb-4 text-[12px] font-semibold text-textMuted">No pressure mode</div>
          <h1 className="max-w-[620px] text-[42px] font-bold leading-[1.12] tracking-[-0.02em] text-textPrimary lg:text-[48px]">
            생각을 정리하지 않아도 작은 행동으로 시작할 수 있게
          </h1>
          <p className="mt-5 max-w-[580px] text-[15px] leading-7 text-textSecondary">
            할 일 목록을 직접 관리하게 만들지 않습니다. 생각을 입력하면 시스템이 여러
            개의 작은 행동 후보로 나누고, 사용자는 하나를 선택합니다.
          </p>
          <div className="mt-12 max-w-[680px] border-t border-border pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-card border border-border bg-panel p-4">
              <div className="mb-3 text-[12px] font-bold text-textMuted">생각 쏟아내기</div>
              <p className="text-[14px] leading-7 text-textPrimary">
                발표 준비해야 하는데 자료도 없고 메일도 보내야 하고...
              </p>
            </div>
            <div className="space-y-3">
              {["발표 자료 제목만 작성", "교수님 메일 첫 줄 쓰기"].map((item) => (
                <div
                  key={item}
                  className="rounded-sm border-l-4 border-primary bg-panel px-4 py-3"
                >
                  <div className="text-[13px] font-bold text-textPrimary">{item}</div>
                  <p className="mt-1 text-[11px] font-medium text-textSecondary">
                    조용한 시작 행동
                  </p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex items-center gap-2 text-[12px] text-textSecondary">
          <ShieldCheck size={15} />
          No pressure mode. Signals are not failure labels.
        </div>
      </section>

      <section className="flex justify-center lg:justify-end">
        <div className="w-full max-w-[420px] rounded-card border border-border bg-panel p-7 shadow-subtle">
          <h2 className="text-[26px] font-bold text-textPrimary">로그인</h2>
          <p className="mt-2 text-[13px] leading-6 text-textSecondary">
            JWT access / refresh token, login protection, rate limiting이 적용됩니다.
          </p>
          <div className="mt-7 space-y-3">
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
              {loading ? "로그인 중" : "로그인"}
              <ArrowRight size={15} />
            </Button>
          </div>
          <div className="mt-5 text-[13px] text-textSecondary">
            계정이 없다면{" "}
            <Link className="font-bold text-textPrimary hover:text-accent" to="/register">
              회원가입
            </Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
