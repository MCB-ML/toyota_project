import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();

    // In demo mode always redirect to companyInfo
    //if (isDemoMode()) {
    //  throw redirect({ to: "/companyInfo", replace: true });
    //}

    // If user is authenticated -> go to companyInfo
    if (isAuthenticated()) {
      throw redirect({ to: "/companyInfo", replace: true });
    }
    throw redirect({
      to: "/login",
      search: { redirect: "/companyInfo" },
      replace: true,
    });
  },
  component: () => {
    // Use auto login in demo mode
    //UseDemoAutoLogin();
    return null;
  },
});
