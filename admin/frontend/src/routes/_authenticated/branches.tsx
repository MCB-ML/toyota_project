import { createFileRoute } from "@tanstack/react-router";
import BranchesMainComponent from "@/components/layout/Branch/organism/BranchesMainComponent";

export const Route = createFileRoute("/_authenticated/branches")({
  component: BranchesMainComponent,
});
