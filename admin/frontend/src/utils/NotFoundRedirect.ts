import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// For now use this until AI Agent is fixed
export const NotFoundRedirect = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      router.navigate({ to: "/", replace: true });
    } else {
      router.navigate({
        to: "/login",
        search: { redirect: "/" },
        replace: true,
      });
    }
  }, [isAuthenticated, router]);

  return null;
};
