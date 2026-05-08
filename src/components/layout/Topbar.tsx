import { Search } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { Input } from "../common/Input";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = getDisplayName(user?.nickname, user?.email);
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex min-h-[84px] flex-col items-start justify-center gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-10">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-textPrimary md:text-[30px]">
            {title}
          </h1>
          <p className="mt-1 text-[13px] text-textSecondary">{subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <Input className="pl-9" placeholder="Search session, action, signal" />
          </div>
          <div className="flex h-10 items-center gap-3 rounded-sm border border-border bg-panel px-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-textPrimary">
              {avatarInitial}
            </div>
            <div>
              <div className="text-[12px] font-bold text-textPrimary">{displayName}</div>
              <div className="text-[11px] text-textMuted">protected session</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getDisplayName(nickname?: string | null, email?: string | null) {
  const trimmedNickname = nickname?.trim();
  if (trimmedNickname) return trimmedNickname;
  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || "사용자";
}
