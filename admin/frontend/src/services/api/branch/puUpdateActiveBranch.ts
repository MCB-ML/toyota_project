import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { BranchUpdateActiveRequest } from "@/types/branch.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

type UpdateActiveBranchVars = {
  endpoint: string;
  payload: BranchUpdateActiveRequest;
};

const updateActiveBranch = async ({
  endpoint,
  payload,
}: UpdateActiveBranchVars): Promise<IFetchApiResult | null> => {
  const UPDATE_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/${endpoint}`;

  const response = await axios.put(UPDATE_BRANCH_API_URL, payload);

  if (response.status !== 200) {
    throw new Error(`Failed to update branch, status: ${response.status}`);
  }

  return response.data;
};

export const useUpdateActiveBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateActiveBranch,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["branchByCompanyId"] });
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
