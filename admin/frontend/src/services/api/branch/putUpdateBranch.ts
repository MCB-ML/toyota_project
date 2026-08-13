import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const UPDATE_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/updateBranch`;

const updateBranch = async (payload: FormData): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.put(`${UPDATE_BRANCH_API_URL}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating branch: ", error);
    throw error;
  }
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBranch,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
        queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
        queryClient.invalidateQueries({ queryKey: ["getBranchById"] });

        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
      queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
    },
  });
};
