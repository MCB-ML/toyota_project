import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { CompanyInfoData } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const COMPANY_LIST_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/getAll`;

const getAllCompanyList = async (): Promise<IFetchApiRFesultContent<CompanyInfoData[]> | null> => {
  try {
    const response = await axios.get(COMPANY_LIST_API_URL);

    if (response.status !== 200) {
      console.log("getAllCompanyList status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetching all company data: ", error);
    return null;
  }
};

export const useGetAllCompanyList = () => {
  return useQuery({
    queryKey: ["companyListAll"],
    queryFn: getAllCompanyList,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
