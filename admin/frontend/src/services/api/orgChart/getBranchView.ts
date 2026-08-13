import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BranchViewResponse } from "@/types/orgChart.types";
import envLoader from "@/utils/envLoader";

const BRANCH_VIEW_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/orgChart/getBranchView`;

const getBranchView = async (): Promise<BranchViewResponse | null> => {
  try {
    const response = await axios.get(BRANCH_VIEW_API_URL);

    if (response.status !== 200) {
      console.error("getBranchView status not 200");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching branch view data: ", error);
    return null;
  }
};

export const useGetBranchView = () => {
  return useQuery({
    queryKey: ["orgChartBranchView"],
    queryFn: getBranchView,
    retry: 3,
    refetchOnWindowFocus: true,
  });
};
