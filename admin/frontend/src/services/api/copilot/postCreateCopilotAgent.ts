import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CreateCopilotAgentRequest, CreateCopilotAgentResponse } from "@/types/copilot.types";
import envLoader from "@/utils/envLoader";

const CREATE_COPILOT_AGENT_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/copilotAgents/createCopilotAgent`;

const createCopilotAgent = async (
  payload: CreateCopilotAgentRequest,
): Promise<CreateCopilotAgentResponse> => {
  try {
    const response = await axios.post(CREATE_COPILOT_AGENT_API_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating copilot agent:", error);
    throw error;
  }
};

export const useCreateCopilotAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCopilotAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
    },
    onError: (error: AxiosError) => {
      console.error("Create Copilot Agent Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["copilotAgentListAll"] });
    },
  });
};
