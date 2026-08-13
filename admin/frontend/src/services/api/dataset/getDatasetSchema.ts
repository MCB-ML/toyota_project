import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { DatasetSchemaResponse } from "../../../types/dataset.types";

const GET_DATASET_SCHEMA_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/schema`;

const getDatasetSchema = async (
  id: string,
): Promise<IFetchApiRFesultContent<DatasetSchemaResponse> | null> => {
  const response = await axios.get(`${GET_DATASET_SCHEMA_API_URL}/${id}`);
  if (response.status !== 200) {
    return null;
  }
  return response.data;
};

export const useGetDatasetSchema = (id: string) => {
  return useQuery({
    queryKey: ["getDatasetSchema", id],
    queryFn: () => getDatasetSchema(id!),
    enabled: !!id,
  });
};
