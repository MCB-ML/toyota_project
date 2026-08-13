import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CompanyInfoFormData } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const UPDATE_COMPANY_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/update`;

const updateCompany = async (payload: CompanyInfoFormData): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.put(`${UPDATE_COMPANY_API_URL}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating company: ", error);
    throw error;
  }
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate the company list query to refresh the table
        queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
        queryClient.invalidateQueries({
          queryKey: ["companyById", variables.companyId],
        });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
    },
  });
};
