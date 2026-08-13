import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { WorkspaceViewResponse } from "@/types/orgChart.types";
import envLoader from "@/utils/envLoader";

const WORKSPACE_VIEW_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/orgChart/getWorkspaceView`;

const getWorkspaceView = async (): Promise<WorkspaceViewResponse | null> => {
  try {
    const response = await axios.get(WORKSPACE_VIEW_API_URL);

    if (response.status !== 200) {
      console.error("getWorkspaceView status not 200");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching workspace view data: ", error);
    return null;
  }
};

export const useGetWorkspaceView = () => {
  return useQuery({
    queryKey: ["orgChartWorkspaceView"],
    queryFn: getWorkspaceView,
    retry: 3,
    refetchOnWindowFocus: true,
  });
};
