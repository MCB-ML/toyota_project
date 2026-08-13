import { createFileRoute } from "@tanstack/react-router";
import CompanyInfoMainComponent from "@/components/layout/CompanyInfo/pages/CompanyInfoMainComponent";

export const Route = createFileRoute("/_authenticated/companyInfo")({
  component: CompanyInfoMainComponent,
});
