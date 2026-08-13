import { LogOutIcon, MoreVerticalIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isDemoMode } from "@/utils/demoConfig";
import { useAuthContext } from "../../../auth/context/authContext";
import { useAuth } from "../../../auth/hooks/useAuth";

const AppNavUser = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isMobile } = useSidebar();
  const { logout } = useAuthContext();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  // Check if demo mode -> cannot logout
  const demoMode = isDemoMode();

  const handleLogoutClick = () => {
    logout();
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer hover:bg-[#e3e3e3] data-[active=true]:bg-[#e3e3e3]"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage />
                  <AvatarFallback className="rounded-lg">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <MoreVerticalIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage />
                    <AvatarFallback className="rounded-lg">U</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer focus:bg-[#eee]">
                  {t("common.account")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* Hide logout for demo */}
              {/*       {!demoMode && (*/}
              <DropdownMenuItem
                onClick={handleLogoutClick}
                className="cursor-pointer focus:bg-[#eee]"
                // disabled={isLoading}
              >
                <LogOutIcon />
                {t("common.logOut")}
                {/* {isLoading ? "Logging out..." : "Log out"} */}
              </DropdownMenuItem>
              {/*  )}*/}
              {/* Show demo mode indicator */}
              {/*{demoMode && (*/}
              {/*  <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">*/}
              {/*    <span className="text-xs text-muted-foreground">*/}
              {/*      {t("AppLayout.demoModeActive")}*/}
              {/*    </span>*/}
              {/*  </DropdownMenuItem>*/}
              {/*)}*/}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Logout Dialog - only in non demo mode */}
      {!demoMode && (
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("AppLayout.logoutConfirmation")}</AlertDialogTitle>
              <AlertDialogDescription>{t("AppLayout.logoutDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleCancelLogout}
                className="cursor-pointer"
                // disabled={isLoading}
              >
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmLogout}
                className="cursor-pointer"
                // disabled={isLoading}
              >
                {t("common.logOut")}
                {/* {isLoading ? "Logging out..." : "Log out"} */}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default AppNavUser;
