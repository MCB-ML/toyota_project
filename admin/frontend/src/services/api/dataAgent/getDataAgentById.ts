import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { DataAgentForm } from "../../../types/dataAgent.types";

const GET_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/getById`;

const getDataAgentById = async (
  id: string,
): Promise<IFetchApiRFesultContent<DataAgentForm> | null> => {
  const response = await axios.get(`${GET_DATAAGENT_API_URL}/${id}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetDataAgentById = () => {
  return useMutation({
    mutationFn: async (id?: string | null) => {
      if (!id) return null;
      return getDataAgentById(id);
    },
  });
};
