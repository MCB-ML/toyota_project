import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import AppHeader from "../../components/layout/AppLayout/AppHeader";
import AppSidebar from "../../components/layout/AppLayout/AppSidebar";
import NoAccessPage from "../../components/layout/AppLayout/NoAccessPage";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";

const ProtectedRoute = () => {
  const { isAuthenticated, isForbidden, isLoading, refetch, token } = useAuth();

  const prevToken = useRef<string | null>(null);

  const _location = useLocation();

  useEffect(() => {
    if (!token) return;

    if (prevToken.current !== token) {
      refetch();
      prevToken.current = token;
    }
  }, [token]);
  //useEffect(() => {
  //    if (isAuthenticated) {
  //        refetch();
  //    }
  //}, [location.pathname, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  // 관리자가 아니면 로그인 화면으로 돌려보내지 않는다. 다시 로그인해도
  // 결과가 같아서 로그인만 반복하게 된다. 이유를 알려주는 편이 낫다.
  if (isForbidden) {
    return <NoAccessPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  return (
    <div className="w-full h-screen flex overflow-hidden">
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default ProtectedRoute;
