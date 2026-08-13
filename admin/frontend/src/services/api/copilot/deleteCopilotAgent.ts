import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { DeleteCopilotAgentResponse } from "@/types/copilot.types";
import envLoader from "@/utils/envLoader";

const DELETE_COPILOT_AGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/copilotAgents/deleteCopilotAgent`;

const deleteCopilotAgent = async (copilotAgentId: string): Promise<DeleteCopilotAgentResponse> => {
  try {
    const response = await axios.delete(`${DELETE_COPILOT_AGENT_API_URL}/${copilotAgentId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting copilot agent:", error);
    throw error;
  }
};

export const useDeleteCopilotAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCopilotAgent,
    onSuccess: (data) => {
      console.log("Copilot agent deleted successfully:", data.message);
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
    },
    onError: (error: AxiosError) => {
      console.error("Delete Copilot Agent Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
    },
  });
};
