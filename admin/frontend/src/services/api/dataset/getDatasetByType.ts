import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { DatasetResponse } from "../../../types/dataset.types";

const GET_DATASET_BY_TYPE_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/getByType`;

const getDatasetByType = async (
  type: string,
  companyId: string,
): Promise<IFetchApiRFesultContent<DatasetResponse[]> | null> => {
  const response = await axios.get(`${GET_DATASET_BY_TYPE_API_URL}/${type}/${companyId}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetDatasetByType = (type: string | null, companyId: string) => {
  return useQuery({
    queryKey: ["getDatasetByType", type, companyId],
    queryFn: () => getDatasetByType(type!, companyId!),
    enabled: !!type && !!companyId,
  });
};
