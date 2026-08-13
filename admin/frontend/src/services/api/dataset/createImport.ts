import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const CREATE_DATASET_IMPORT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/import`;

const createImport = async (payload: FormData): Promise<IFetchApiResult | null> => {
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

export const useCreateImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createImport,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["companyById"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetPreview"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetByType"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getSchemaSourceList"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create import error:", error);
      queryClient.invalidateQueries({ queryKey: ["getDatasetPreview"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["getDatasetByType"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["getSchemaSourceList"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["getDatasetSchema"], exact: false });
    },
  });
};
