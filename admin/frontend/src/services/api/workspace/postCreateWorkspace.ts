import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CreateWorkspaceRequest, CreateWorkspaceResponse } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const CREATE_WORKSPACE_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/createWorkspace`;

const createWorkspace = async (
  payload: CreateWorkspaceRequest,
): Promise<CreateWorkspaceResponse | null> => {
  try {
    const response = await axios.post(CREATE_WORKSPACE_API_URL, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to create workspace, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating workspace: ", error);
    throw error;
  }
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workspaceListAll"] });
        queryClient.invalidateQueries({ queryKey: ["workspaceByBranchId"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
        queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
        queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create Workspace Mutation error:", error);
    },
  });
};
