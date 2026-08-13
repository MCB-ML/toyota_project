import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { EndUserViewResponse } from "@/types/orgChart.types";
import envLoader from "@/utils/envLoader";

const END_USER_VIEW_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/orgChart/getEndUserView`;

const getEndUserView = async (): Promise<EndUserViewResponse | null> => {
  try {
    const response = await axios.get(END_USER_VIEW_API_URL);

    if (response.status !== 200) {
      console.error("getEndUserView status not 200");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching end user view data: ", error);
    return null;
  }
};

export const useGetEndUserView = () => {
  return useQuery({
    queryKey: ["orgChartEndUserView"],
    queryFn: getEndUserView,
    retry: 3,
    refetchOnWindowFocus: true,
  });
};
