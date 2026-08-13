import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../../types/apiResponse";
import type {
  DatasetFabricConnectRequest,
  FabricTableList,
} from "../../../../types/datasetFabric.types";

const CONNECT_DATASET_FABRIC_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataset/fabric/connect`;

const connectFabric = async (
  payload: DatasetFabricConnectRequest,
): Promise<IFetchApiRFesultContent<FabricTableList[]> | null> => {
  try {
    const response = await axios.post(CONNECT_DATASET_FABRIC_API_URL, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to connect, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in connect: ", error);
    throw error;
  }
};

export const useConnectFabric = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectFabric,
    onSuccess: (data, _variables) => {
      if (data) {
      }
    },
    onError: (_error: AxiosError) => {},
  });
};
