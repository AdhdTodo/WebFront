import {
  Bot,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  History,
  ListChecks,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const groups = [
  {
    label: "MAIN",
    items: [
      { to: "/today", label: "오늘", icon: ClipboardList },
      { to: "/brain-dumps", label: "생각 쏟아내기", icon: ListChecks },
      { to: "/suggestions", label: "행동 후보", icon: Sparkles },
      { to: "/calendar", label: "캘린더", icon: CalendarDays },
      { to: "/actions/active", label: "실행", icon: CheckSquare },
    ],
  },
  {
    label: "REVIEW",
    items: [
      { to: "/history", label: "최근 흐름", icon: History },
      { to: "/routines", label: "루틴", icon: ShieldCheck },
      { to: "/settings", label: "캘린더 가져오기", icon: CalendarDays },
    ],
  },
  {
    label: "SYSTEM",
    items: [{ to: "/settings", label: "AI / 계정 설정", icon: Bot }],
  },
];

export function Sidebar() {
  return (
    <aside className="border-b border-border bg-sidebar/95 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[244px] lg:flex-col lg:border-b-0 lg:border-r">
      <div className="border-b border-border px-4 py-4 lg:px-5 lg:py-5">
        <div className="text-[19px] font-bold tracking-tight text-textPrimary">Decide</div>
        <div className="mt-1 text-[12px] font-medium text-textSecondary">ADHD 일정 도우미</div>
      </div>
      <nav className="flex gap-3 overflow-x-auto px-3 py-3 lg:block lg:flex-1 lg:overflow-y-auto lg:py-4">
        {groups.map((group) => (
          <div key={group.label} className="min-w-max lg:mb-6">
            <div className="mb-2 px-2 text-[11px] font-bold tracking-[0.08em] text-textMuted">
              {group.label}
            </div>
            <div className="flex gap-1 lg:block lg:space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={`${group.label}-${item.label}`}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-2 rounded-sm px-2 text-[13px] font-medium transition ${
                      isActive
                        ? "bg-primary text-textPrimary"
                        : "text-textSecondary hover:bg-accentSoft hover:text-textPrimary"
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="hidden border-t border-border p-4 lg:block">
        <div className="rounded-card border border-border bg-panel p-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-textPrimary">
            <Settings size={14} />
            부담 낮은 모드
          </div>
          <p className="mt-2 text-[12px] leading-5 text-textSecondary">
            반응은 실패가 아니라 다음 제안 조절 신호입니다.
          </p>
        </div>
      </div>
    </aside>
  );
}
