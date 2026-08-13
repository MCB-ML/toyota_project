import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";
import type { DataAgentUpdateRequest } from "../../../types/dataAgent.types";

const UPDATE_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/update`;

const updateDataAgent = async (
  payload: DataAgentUpdateRequest,
): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.put(`${UPDATE_DATAAGENT_API_URL}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating company: ", error);
    throw error;
  }
};

export const useUpdateDataAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDataAgent,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ["dataAgentByWorkspace"],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ["dataAgentById"],
          exact: false,
        });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Update Mutation error:", error);
    },
  });
};
