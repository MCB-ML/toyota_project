import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { DataAgentRespone } from "../../../types/dataAgent.types";

const GET_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/getByWorkspace`;

const getDataAgentByWorkspace = async (
  id: string,
): Promise<IFetchApiRFesultContent<DataAgentRespone[]> | null> => {
  try {
    const response = await axios.get(`${GET_DATAAGENT_API_URL}/${id}`);

    if (response.status !== 200) {
      console.log("getAllCompanyList status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetching all company data: ", error);
    return null;
  }
};

export const useGetDataAgentByWorkspace = (id: string) => {
  return useQuery({
    queryKey: ["dataAgentByWorkspace", id],
    queryFn: () => getDataAgentByWorkspace(id!),
    select: (data) => data,
    enabled: !!id,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
