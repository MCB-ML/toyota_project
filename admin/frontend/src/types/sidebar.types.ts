import {
  // Bot,
  BarChart3,
  Building2,
  FileText,
  // GitBranch,
  // LayoutGrid,
  Rocket,
  // Network,
  // Sparkles,
  Users,
  // WandSparkles,
} from "lucide-react";

interface NavItem {
  path: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: "admin" | "user";
  hasChildren?: boolean;
  hasDynamicChildren?: boolean;
  hasNestedChildren?: boolean;
}

export const sidebarMainMenu: NavItem[] = [
  {
    title: "AppLayout.menu.companyInfo",
    path: "/companyInfo",
    icon: Building2,
  },
  // 딜러사 = Company 단위로만 관리하므로 Branch / Workspace 계층은 사용하지 않는다.
  // Branch 의 유일한 기능이던 활성/비활성 토글은 Company Info 에서 처리한다.
  // {
  //   title: "AppLayout.menu.branches",
  //   path: "/branches",
  //   icon: GitBranch,
  // },
  // {
  //   title: "AppLayout.menu.workspaces",
  //   path: "/workspaces",
  //   icon: LayoutGrid,
  // },
  {
    title: "AppLayout.menu.users",
    path: "/users",
    icon: Users,
  },
  //{
  //  title: "Power BI",
  //  path: "/powerBI",
  //  icon: ChartBar,
  //},
  // 기존 AI365 Data Agent 의 실행 기능은 쓰지 않는다.
  // 어드민은 모델/프롬프트 등록까지만 담당하고, 실행은 신규 AI 에이전트가 맡는다.
  // {
  //   title: "AppLayout.menu.dataAgent",
  //   path: "/dataAgent",
  //   icon: Bot,
  // },
  // {
  //   title: "AppLayout.menu.copilot",
  //   path: "/copilot",
  //   icon: WandSparkles,
  // },
  // {
  //   title: "AppLayout.menu.aiAgent",
  //   path: "/aiAgent",
  //   icon: Sparkles,
  // },
  {
    title: "AppLayout.menu.modelDeployment",
    path: "/modelDeployment",
    icon: Rocket,
  },
  // 프롬프트는 전 딜러사 공용이라 Company 모달이 아닌 전역 메뉴에 둔다.
  {
    title: "AppLayout.menu.promptSettings",
    path: "/promptSettings",
    icon: FileText,
  },
  // 딜러사별 사용량. 키를 나누는 대신 호출 로그를 집계해서 본다.
  //
  // 어드민 페이지 자체가 관리자 전용이라(ProtectedRoute) 지금은 중복이지만,
  // 사용량은 다른 딜러사의 숫자까지 보이므로 메뉴 단위로도 못 박아 둔다.
  {
    title: "AppLayout.menu.usage",
    path: "/usage",
    icon: BarChart3,
    requiredRole: "admin",
  },
  // {
  //   title: "Org Chart",
  //   path: "/orgChart",
  //   icon: Network,
  // },
];

export const routeDisplayNames = {
  "/companyInfo": "companyInfo",
  "/branches": "branches",
  "/workspaces": "workspaces",
  "/users": "users",
  /*  "/_authenticated/powerBI": "Power BI Setup",*/
  "/dataAgent": "dataAgent",
  "/copilot": "copilot",
  "/aiAgent/": "aiAgent",
  "/modelDeployment": "modelDeployment",
  "/promptSettings": "promptSettings",
  "/usage": "usage",
  // "/_authenticated/orgChart": "Organization Chart",
} as const;

// Language
export const languagesList = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "kr", label: "한국어", flag: "🇰🇷" },
];
