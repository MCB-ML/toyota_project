import { createFileRoute } from "@tanstack/react-router";
import OrgChartMainComponent from "@/components/layout/OrgChart/organism/OrgChartMainComponent";

export const Route = createFileRoute("/_authenticated/orgChart")({
  component: OrgChartMainComponent,
});
