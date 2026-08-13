import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { PowerBIData } from "../../../types/powerBi.types";

const GET_POWERBI_BY_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/getById`;

const getPowerBIById = async (id: string): Promise<IFetchApiRFesultContent<PowerBIData> | null> => {
  const response = await axios.get(`${GET_POWERBI_BY_ID_API_URL}/${id}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetPowerBIById = (id: string | null) => {
  return useQuery({
    queryKey: ["getPowerBIById", id],
    queryFn: () => getPowerBIById(id!),
    enabled: !!id,
  });
};
