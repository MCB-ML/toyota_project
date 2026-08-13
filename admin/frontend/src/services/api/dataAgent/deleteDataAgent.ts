import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult } from "../../../types/apiResponse";

const DELETE_DATAAGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/dataagent/deleteById`;

const deleteDataAgent = async (id: string): Promise<IFetchApiResult | null> => {
  try {
    const response = await axios.delete(`${DELETE_DATAAGENT_API_URL}/${id}`);

    if (response.status !== 200) {
      console.error("Failed to delete company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting company: ", error);
    throw error;
  }
};

export const useDeleteDataAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDataAgent,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["dataAgentByWorkspace"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["dataAgentById"], exact: false });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Delete Mutation error:", error);
    },
  });
};
