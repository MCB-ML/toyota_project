import { createFileRoute } from "@tanstack/react-router";
import UsageMainComponent from "@/components/layout/Usage/UsageMainComponent";

export const Route = createFileRoute("/_authenticated/usage")({
  component: UsageMainComponent,
});
