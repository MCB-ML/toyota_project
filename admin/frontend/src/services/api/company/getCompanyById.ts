import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { CompanyInfoFormDataDetail } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const GET_COMPANY_BY_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/getById`;

const getCompanyById = async (
  companyId: string,
): Promise<IFetchApiRFesultContent<CompanyInfoFormDataDetail> | null> => {
  const response = await axios.get(`${GET_COMPANY_BY_ID_API_URL}/${companyId}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetCompanyById = (companyId: string | null) => {
  return useQuery({
    queryKey: ["companyById", companyId],
    queryFn: () => getCompanyById(companyId!),
    enabled: !!companyId,
  });
};
