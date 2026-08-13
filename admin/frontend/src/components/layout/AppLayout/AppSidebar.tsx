import type React from "react";
import { useTranslation } from "react-i18next";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarMainMenu } from "@/types/sidebar.types";
import AppNavUser from "./AppNavUser";

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { t } = useTranslation();
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  // authStore 가 아니라 /auth/check 결과를 본다.
  // 로그인은 토큰만 저장하고 authStore.user 는 비워 두므로,
  // authStore 를 보면 requiredRole 이 걸린 메뉴가 관리자에게도 안 보인다.
  const { user } = useAuth();

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredMenu = sidebarMainMenu.filter((item) => {
    if (!item.requiredRole) return true;
    return user?.role === item.requiredRole;
  });

  const mainItems = filteredMenu.filter((item) => !item.requiredRole);
  const adminItems = filteredMenu.filter((item) => item.requiredRole === "admin");

  const menuButtonClass = `
    w-full h-9 text-sm font-extralight text-slate-600 
    hover:bg-[#1a73e8]/5 hover:text-[#1a73e8] hover:font-medium
    data-[active=true]:bg-[#1a73e8]/10 data-[active=true]:text-[#1a73e8]
    [&>svg]:size-4.5
  `;

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 bg-inherit" {...props}>
      <SidebarHeader className="mb-2 mt-2 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg text-white">
            <img src="/osIcon.png" alt="" />
          </div>

          <div className="h-full flex flex-col leading-none mt-1">
            <span className="font-medium text-sm text-[#45556c]">{t("AppLayout.appName")}</span>
            <span className="font-medium text-md text-[#45556c]">{t("AppLayout.adminCenter")}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <div className="mb-2">
          <SidebarMenu>
            {mainItems.map((item) => {
              const isActive = !!matchPath({ path: item.path, end: false }, location.pathname);

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    onClick={handleNavigation}
                    className={menuButtonClass}
                  >
                    <Link to={item.path} className="flex w-full items-center">
                      <item.icon />
                      <span className="ml-3">{t(item.title as any)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        {/*
          "관리자" 그룹 제목은 두지 않는다.
          이 페이지 자체가 관리자만 들어올 수 있으므로(ProtectedRoute) 굳이 나눠 말할 이유가 없다.
          아래로 밀어내는 배치(mt-auto)만 유지하려고 묶음은 남겨둔다.
        */}
        {adminItems.length > 0 && (
          <div className="mt-auto mb-3">
            <SidebarMenu className="gap-1">
              {adminItems.map((item) => {
                const isActive = !!matchPath({ path: item.path, end: false }, location.pathname);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={handleNavigation}
                      className={menuButtonClass}
                    >
                      <Link to={item.path} className="flex w-full items-center">
                        <item.icon />
                        <span className="ml-3">{t(item.title as any)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <AppNavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
