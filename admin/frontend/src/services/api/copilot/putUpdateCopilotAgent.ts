import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { UpdateCopilotAgentRequest, UpdateCopilotAgentResponse } from "@/types/copilot.types";
import envLoader from "@/utils/envLoader";

const UPDATE_COPILOT_AGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/copilotAgents/updateCopilotAgent`;

const updateCopilotAgent = async ({
  copilotAgentId,
  payload,
}: {
  copilotAgentId: string;
  payload: UpdateCopilotAgentRequest;
}): Promise<UpdateCopilotAgentResponse> => {
  try {
    const response = await axios.put(`${UPDATE_COPILOT_AGENT_API_URL}/${copilotAgentId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating copilot agent:", error);
    throw error;
  }
};

export const useUpdateCopilotAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCopilotAgent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
      queryClient.invalidateQueries({
        queryKey: ["copilotAgentById", variables.copilotAgentId],
      });
    },
    onError: (error: AxiosError, variables) => {
      console.error("Update Copilot Agent Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
      queryClient.invalidateQueries({
        queryKey: ["copilotAgentById", variables.copilotAgentId],
      });
    },
  });
};
