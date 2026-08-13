import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { DeleteWorkspaceResponse } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const DELETE_WORKSPACE_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/deleteWorkspace`;

const deleteWorkspace = async (workspaceId: string): Promise<DeleteWorkspaceResponse | null> => {
  try {
    const response = await axios.delete(`${DELETE_WORKSPACE_API_URL}/${workspaceId}`);

    if (response.status !== 200) {
      console.error("Failed to delete workspace, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting workspace: ", error);
    throw error;
  }
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workspaceListAll"] });
        queryClient.invalidateQueries({ queryKey: ["workspaceByBranchId"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Delete Workspace Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["workspaceListAll"] });
    },
  });
};
