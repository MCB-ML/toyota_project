import { createFileRoute } from "@tanstack/react-router";
import CopilotMainComponent from "@/components/layout/Copilot/organism/CopilotMainComponent";

export const Route = createFileRoute("/_authenticated/copilot")({
  component: CopilotMainComponent,
});
