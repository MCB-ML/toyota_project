import { createFileRoute } from "@tanstack/react-router";
import WorkspaceMainComponent from "@/components/layout/Workspace/organism/WorkspaceMainComponent";

export const Route = createFileRoute("/_authenticated/workspaces")({
  component: WorkspaceMainComponent,
});
