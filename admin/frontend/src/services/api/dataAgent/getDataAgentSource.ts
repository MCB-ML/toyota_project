import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const GET_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/getDataAgentSource`;

const getDataAgentSource = async (): Promise<IFetchApiRFesultContent<any> | null> => {
  try {
    const response = await axios.get(`${GET_DATAAGENT_API_URL}`);

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

export const useGetDataAgentSource = () => {
  return useQuery({
    queryKey: ["dataAgentByWorkspace"],
    queryFn: () => getDataAgentSource(),
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
