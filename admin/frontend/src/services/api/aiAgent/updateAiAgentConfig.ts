import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { AiAgentResponse, AiAgentUpdateRequestPayload } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const UPDATE_AI_AGENT_CONFIG = `${envLoader.AI_AGENT_API_URL}/ai-agent/ConfigUpdate`;

const updateAiAgentConfig = async (
  payload: AiAgentUpdateRequestPayload,
): Promise<AiAgentResponse> => {
  try {
    const response = await axios.put<AiAgentResponse>(UPDATE_AI_AGENT_CONFIG, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });

    return response.data;
  } catch (AxiosError) {
    console.error("Error updating AI agent configuration:", AxiosError);
    throw AxiosError;
  }
};

export const useUpdateAiAgentConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAiAgentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
    },
    onError: (error: AxiosError) => {
      console.error("Update AI Agent Config Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
    },
  });
};

export { updateAiAgentConfig };
