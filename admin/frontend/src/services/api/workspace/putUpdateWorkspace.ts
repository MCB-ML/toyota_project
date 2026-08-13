import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { UpdateWorkspaceRequest, UpdateWorkspaceResponse } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const UPDATE_WORKSPACE_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/updateWorkspace`;

const updateWorkspace = async ({
  workspaceId,
  payload,
}: {
  workspaceId: string;
  payload: UpdateWorkspaceRequest;
}): Promise<UpdateWorkspaceResponse | null> => {
  try {
    const response = await axios.put(`${UPDATE_WORKSPACE_API_URL}/${workspaceId}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update workspace, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating workspace: ", error);
    throw error;
  }
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workspaceListAll"] });
        queryClient.invalidateQueries({
          queryKey: ["workspace", variables.workspaceId],
        });
        queryClient.invalidateQueries({
          queryKey: ["workspaceById", variables.workspaceId],
        });

        queryClient.invalidateQueries({ queryKey: ["workspaceByBranchId"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Workspace Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["workspaceListAll"] });
    },
  });
};
