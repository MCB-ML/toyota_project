import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const DELETE_POWERBI_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/deleteById`;

const deletePowerBI = async (id: string): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.delete(`${DELETE_POWERBI_API_URL}/${id}`);

    if (response.status !== 200) {
      console.error("Failed to delete branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting branch: ", error);
    throw error;
  }
};

export const useDeletePowerBI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePowerBI,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["getPowerBiByWorkspace"], exact: false });
      }
    },
    onError: (_error: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: ["getPowerBiByWorkspace"] });
    },
  });
};
