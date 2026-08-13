import { createFileRoute } from "@tanstack/react-router";
import AppLayout from "@/components/layout/AppLayout/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <AppLayout />;
}
