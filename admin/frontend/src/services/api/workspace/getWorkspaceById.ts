import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { WorkspaceData } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const GET_WORKSPACE_BY_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/getWorkspaceById`;

const getWorkspaceById = async (workspaceId: string): Promise<WorkspaceData | null> => {
  try {
    const response = await axios.get(`${GET_WORKSPACE_BY_ID_API_URL}/${workspaceId}`);
    if (response.status !== 200) {
      console.error("Failed to fetch workspace by id", response.status);
      return null;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching workspace by id", error);
    throw error;
  }
};

export const useGetWorkspaceById = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ["workspaceById", workspaceId],
    queryFn: () => getWorkspaceById(workspaceId!),
    enabled: !!workspaceId,
  });
};
