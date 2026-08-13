import { createFileRoute } from "@tanstack/react-router";
import DataAgentMainComponent from "@/components/layout/DataAgent/organism/DataAgentMainComponent";

export const Route = createFileRoute("/_authenticated/dataAgent")({
  component: DataAgentMainComponent,
});
