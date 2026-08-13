import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const DELETE_COMPANY_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/deleteById`;

const deleteCompany = async (companyId: string): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.delete(`${DELETE_COMPANY_API_URL}/${companyId}`);

    if (response.status !== 200) {
      console.error("Failed to delete company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting company: ", error);
    throw error;
  }
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: (data) => {
      if (data) {
        // Invalidate the company list query to refresh the table
        queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
        queryClient.invalidateQueries({ queryKey: ["userListAll"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Delete Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["companyListAll"] });
    },
  });
};
