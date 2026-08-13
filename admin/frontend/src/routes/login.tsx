import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPageComponent from "@/components/layout/LoginPage/organism/LoginPageComponent";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/dashboard",
    };
  },
  beforeLoad: () => {
    //// In demo mode, allow access without auth check
    //if (isDemoMode()) {
    //  throw redirect({
    //    to: "/companyInfo",
    //    replace: true,
    //  });
    //}

    const { isAuthenticated } = useAuthStore.getState();

    // If user is authenticated (has refresh token AND not inactive) -> redirect to companyInfo
    if (isAuthenticated()) {
      throw redirect({
        to: "/companyInfo",
        replace: true,
      });
    }
  },
  component: LoginPageComponent,
});
