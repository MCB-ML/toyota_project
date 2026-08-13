import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import envLoader from "@/utils/envLoader";
import type { WorkspaceUserAccessList } from "../../../types/workspace.types";

const GET_WORKSPACE_BY_BRANCH_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/getWorkspaceUserAccess`;

const getWorkspaceUserAccess = async (id: string): Promise<WorkspaceUserAccessList[] | null> => {
  try {
    const response = await axios.get(`${GET_WORKSPACE_BY_BRANCH_ID_API_URL}/${id}`);
    if (response.status !== 200) {
      console.error("Failed to fetch workspace by branch id", response.status);
      return null;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching workspace by branch id", error);
    throw error;
  }
};

export const useGetWorkspaceUserAccess = (id: string | null) => {
  return useQuery({
    queryKey: ["workspaceUserAcces", id],
    queryFn: () => getWorkspaceUserAccess(id!),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
