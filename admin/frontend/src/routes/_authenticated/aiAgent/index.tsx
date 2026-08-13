import { createFileRoute } from "@tanstack/react-router";
import AiAgentMainComponent from "@/components/layout/AiAgent/organism/AiAgentMainComponent";

export const Route = createFileRoute("/_authenticated/aiAgent/")({
  component: AiAgentMainComponent,
});
