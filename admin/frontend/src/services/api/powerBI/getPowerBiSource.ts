import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const GET_POWERBI_BY_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/getPowerBiSource`;

const getPowerBiSource = async (): Promise<IFetchApiRFesultContent<any> | null> => {
  try {
    const response = await axios.get(`${GET_POWERBI_BY_BRANCH_API_URL}`);

    if (response.status !== 200) {
      console.log("getAllUser status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetching all users: ", error);
    return null;
  }
};

export const useGetPowerBiSource = () => {
  return useQuery({
    queryKey: ["getPowerBiByWorkspace"],
    queryFn: () => getPowerBiSource(),
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
