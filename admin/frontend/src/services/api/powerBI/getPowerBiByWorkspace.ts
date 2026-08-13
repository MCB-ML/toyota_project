import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { PowerBIData } from "../../../types/powerBi.types";

const GET_POWERBI_BY_BRANCH_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/get`;

const getPowerBiByWorkspace = async (
  id: string,
): Promise<IFetchApiRFesultContent<PowerBIData[]> | null> => {
  try {
    const response = await axios.get(`${GET_POWERBI_BY_BRANCH_API_URL}/${id}`);

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

export const useGetPowerBiByWorkspace = (id: string) => {
  return useQuery({
    queryKey: ["getPowerBiByWorkspace", id],
    queryFn: () => getPowerBiByWorkspace(id!),
    select: (data) => data,
    enabled: !!id,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
