import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";

export interface BranchUpdateAllowUserAccessRequest {
  companyId: string;
  branchId: string;
  allowUserAccess: boolean;
}

const UPDATE_BRANCH_ACCESS_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/updateBranchAllowUserAccess`;

const updateBranchAllowUserAccess = async (payload: BranchUpdateAllowUserAccessRequest) => {
  try {
    const response = await axios.put(`${UPDATE_BRANCH_ACCESS_API_URL}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update branch user access, status:", response.status);
      throw new Error("Failed to update branch user access");
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating branch user access: ", error);
    throw error;
  }
};

export const useUpdateBranchAllowUserAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBranchAllowUserAccess,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
        queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Branch Access Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
      queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
    },
  });
};
