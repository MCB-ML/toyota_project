import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { DataAgentCreateRequest } from "../../../types/dataAgent.types";

const CREATE_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/insert`;

const createDataAgent = async (
  payload: DataAgentCreateRequest,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.post(CREATE_DATAAGENT_API_URL, payload);

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

export const useCreateDataAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDataAgent,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ["dataAgentByWorkspace", variables.workspaceId],
        });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create Branch Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["dataAgentListAll"] });
    },
  });
};
