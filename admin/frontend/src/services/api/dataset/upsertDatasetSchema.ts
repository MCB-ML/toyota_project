import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { DatasetCreateSchemaRequest } from "../../../types/dataset.types";

const UPSERT_DATASET_SCHEMA_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/upsertSchema`;

const upsertDatasetSchema = async (
  payload: DatasetCreateSchemaRequest,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(UPSERT_DATASET_SCHEMA_API_URL, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to create branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating branch: ", error);
    throw error;
  }
};

export const useUpsertDatasetSchema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertDatasetSchema,
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
