import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { GetAllWorkspacesResponse } from "@/types/workspace.types";
import envLoader from "@/utils/envLoader";

const GET_ALL_WORKSPACES_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/workspaces/getAllWorkspaces`;

const getAllWorkspaces = async (): Promise<GetAllWorkspacesResponse> => {
  try {
    const response = await axios.get(GET_ALL_WORKSPACES_API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
};

export const useGetAllWorkspaces = () => {
  return useQuery({
    queryKey: ["workspaceListAll"],
    queryFn: getAllWorkspaces,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
