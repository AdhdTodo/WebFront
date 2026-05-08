import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmail } from "../api/auth";
import { getApiErrorMessage } from "../api/errors";
import { Button } from "../components/common/Button";

type VerificationState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("이메일 인증을 확인하고 있습니다.");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("인증 링크에 필요한 token이 없습니다.");
      return;
    }

    let cancelled = false;
    verifyEmail(token)
      .then((response) => {
        if (cancelled) return;
        setState("success");
        setMessage(response.message || "이메일 인증이 완료되었습니다.");
      })
      .catch((error) => {
        if (cancelled) return;
        setState("error");
        setMessage(getApiErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[480px] rounded-card border border-border bg-panel p-7 shadow-subtle">
        <div className="text-[24px] font-bold text-textPrimary">Email verification</div>
        <p className="mt-3 text-[13px] leading-6 text-textSecondary">{message}</p>
        {state === "loading" && (
          <p className="mt-4 border border-border bg-input p-3 text-[12px] text-textMuted">
            잠시만 기다려주세요. 인증 링크를 안전하게 확인하고 있습니다.
          </p>
        )}
        {state === "success" && (
          <div className="mt-5 flex gap-2">
            <Link to="/today">
              <Button variant="primary">Today Board로 이동</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">login</Button>
            </Link>
          </div>
        )}
        {state === "error" && (
          <div className="mt-5 flex gap-2">
            <Link to="/settings">
              <Button variant="primary">Settings에서 다시 보내기</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">login</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
