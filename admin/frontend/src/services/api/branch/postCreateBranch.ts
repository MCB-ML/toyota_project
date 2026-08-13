import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const CREATE_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/createBranch`;

const createBranch = async (payload: FormData): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(CREATE_BRANCH_API_URL, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to create branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating branch: ", error);
    throw error;
  }
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBranch,
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
      console.error("Create Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["branchListAll"] });
    },
  });
};
