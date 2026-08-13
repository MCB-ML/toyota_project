import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { DatasetDeleteSource } from "../../../types/dataset.types";

const DELETE_DATASET_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/deleteSource`;

const deleteDatasetSource = async (
  payload: DatasetDeleteSource,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.delete(
      `${DELETE_DATASET_API_URL}/${payload.Id}/${payload.datasetType}/${payload.sourceName}`,
    );

    if (response.status !== 200) {
      console.error("Failed to dataset source, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting branch: ", error);
    throw error;
  }
};

export const useDeleteDatasetSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDatasetSource,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["companyById"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetPreview"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetByType"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getSchemaSourceList"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
      }
    },
    onError: (_error: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: ["getDatasetByType"] });
    },
  });
};
