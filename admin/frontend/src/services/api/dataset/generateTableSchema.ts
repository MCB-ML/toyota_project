import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type {
  DatasetGenerateSchemaRequest,
  DatasetGenerateSchemaResponse,
} from "../../../types/dataset.types";

const UPSERT_DATASET_SCHEMA_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/generateTableSchema`;

const generateTableSchema = async (
  payload: DatasetGenerateSchemaRequest,
): Promise<IFetchApiRFesultContent<DatasetGenerateSchemaResponse>> => {
  try {
    const response = await axios.post(UPSERT_DATASET_SCHEMA_API_URL, payload);

    return response.data;
  } catch (error) {
    console.error("Error in creating branch: ", error);
    throw error;
  }
};

export const useGenerateTableSchema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateTableSchema,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["GetAllPowerBIAll"] });
    },
  });
};
