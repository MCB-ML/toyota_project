import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { CreatePowerBiUpdateRequest } from "../../../types/powerBi.types";

const UPDATE_POWERBI_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/update`;

const updatePowerBI = async (
  payload: CreatePowerBiUpdateRequest,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.put(`${UPDATE_POWERBI_API_URL}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update branch, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating branch: ", error);
    throw error;
  }
};

export const useUpdatePowerBI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePowerBI,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["getPowerBiByWorkspace"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["getPowerBIById"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Branch Mutation error:", error);
    },
  });
};
