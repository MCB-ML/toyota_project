import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { CreatePowerBiRequest } from "../../../types/powerBi.types";

const CREATE_POWERBI_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/powerbi/insert`;

const createPowerBI = async (payload: CreatePowerBiRequest): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(CREATE_POWERBI_API_URL, payload);

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

export const useCreatePowerBI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPowerBI,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["getPowerBiByWorkspace", variables.workspace] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["GetAllPowerBIAll"] });
    },
  });
};
