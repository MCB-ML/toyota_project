import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { DeleteBranchResponse } from "@/types/branch.types";
import envLoader from "@/utils/envLoader";

const DELETE_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/deleteBranch`;

const deleteBranch = async (branchId: string): Promise<DeleteBranchResponse | null> => {
  try {
    const response = await axios.delete(`${DELETE_BRANCH_API_URL}/${branchId}`);

    if (response.status !== 200) {
      console.error("Failed to delete branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting branch: ", error);
    throw error;
  }
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
        queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Delete Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
    },
  });
};
