import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { DatasetSchemaSourceListResponse } from "../../../types/dataset.types";

const GET_DATASET_SCHEMALIST_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/schemaList`;

const getSchemaSourceList = async (
  id: string,
  source: string,
): Promise<IFetchApiRFesultContent<DatasetSchemaSourceListResponse> | null> => {
  const response = await axios.get(`${GET_DATASET_SCHEMALIST_API_URL}/${id}/${source}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetSchemaSourceList = (id: string, source: string) => {
  return useQuery({
    queryKey: ["getSchemaSourceList", id, source],
    queryFn: () => getSchemaSourceList(id, source),
    enabled: !!id && !!source,
  });
};
