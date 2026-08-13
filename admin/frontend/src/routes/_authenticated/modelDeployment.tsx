import { createFileRoute } from "@tanstack/react-router";
import ModelDeploymentMainComponent from "@/components/layout/ModelDeployment/ModelDeploymentMainComponent";

export const Route = createFileRoute("/_authenticated/modelDeployment")({
  component: ModelDeploymentMainComponent,
});
