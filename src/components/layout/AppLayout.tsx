import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/today": {
    title: "오늘의 계획",
    subtitle: "생각을 입력하고, 작은 행동 후보를 캘린더 흐름 안에서 확인합니다.",
  },
  "/brain-dumps": {
    title: "생각 쏟아내기",
    subtitle: "정리하지 않은 문장을 그대로 입력하고 후보 생성을 확인합니다.",
  },
  "/suggestions": {
    title: "행동 후보",
    subtitle: "후보를 비교하고 반응 신호를 남깁니다.",
  },
  "/actions/active": {
    title: "실행 중인 행동",
    subtitle: "선택된 하나의 행동만 차분하게 보여줍니다.",
  },
  "/history": {
    title: "최근 흐름",
    subtitle: "성공률이 아니라 최근 흐름과 반응 신호를 확인합니다.",
  },
  "/routines": {
    title: "루틴",
    subtitle: "제안이 막힐 때 사용할 안전망 행동 풀입니다.",
  },
  "/settings": {
    title: "설정",
    subtitle: "AI fallback, 계정, 보안, 캘린더 가져오기를 관리합니다.",
  },
};

export function AppLayout() {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="min-h-screen lg:ml-[244px]">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="px-4 py-5 md:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/sessions/") && pathname.endsWith("/suggestions")) {
    return pageMeta["/suggestions"];
  }
  if (pathname.startsWith("/actions/")) {
    return pageMeta["/actions/active"];
  }
  return pageMeta[pathname] ?? pageMeta["/today"];
}
