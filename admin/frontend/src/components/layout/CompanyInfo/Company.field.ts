import { z } from "zod";

export const getCompanySchema = (t: any) =>
  z.object({
    companyName: z.string().min(2, t("CompanyInfo.validation.nameRequired")),
  });
