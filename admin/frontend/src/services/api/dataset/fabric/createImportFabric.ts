import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { IFetchApiResult } from "../../../../types/apiResponse";
import type { ImportFabricRequest } from "../../../../types/datasetFabric.types";
import envLoader from "../../../../utils/envLoader";

const CREATE_DATASET_IMPORT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/fabric/import`;

const createImportFabric = async (
  payload: ImportFabricRequest,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(CREATE_DATASET_IMPORT_API_URL, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to import, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in import: ", error);
    throw error;
  }
};

export const useCreateImportFabric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createImportFabric,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["getSchemaSourceList"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create import error:", error);
      queryClient.invalidateQueries({ queryKey: ["getSchemaSourceList"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
    },
  });
};
