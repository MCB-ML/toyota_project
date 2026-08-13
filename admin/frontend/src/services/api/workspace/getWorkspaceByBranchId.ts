import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { GetAllWorkspacesResponse } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const GET_WORKSPACE_BY_BRANCH_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/getWorkspaceByBranchId`;

const getWorkspaceByBranchId = async (
  branchId: string,
): Promise<GetAllWorkspacesResponse | null> => {
  try {
    const response = await axios.get(`${GET_WORKSPACE_BY_BRANCH_ID_API_URL}/${branchId}`);
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

export const useGetWorkspaceByBranchId = (branchId: string | null) => {
  return useQuery({
    queryKey: ["workspaceByBranchId", branchId],
    queryFn: () => getWorkspaceByBranchId(branchId!),
    enabled: !!branchId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
