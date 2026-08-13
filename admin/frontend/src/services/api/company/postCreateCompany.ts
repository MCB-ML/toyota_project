import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CompanyInfoFormData } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const CREATE_COMPANY_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/insert`;

const createCompany = async (data: CompanyInfoFormData): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(CREATE_COMPANY_API_URL, data);

    if (response.status !== 200 && response.status !== 201) {
      console.error("Failed to create company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating company: ", error);
    throw error;
  }
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: (data) => {
      if (data) {
        // Invalidate the company list query to refresh the table
        queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
    },
  });
};
