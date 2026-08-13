import { Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
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

export default AppLayout;
