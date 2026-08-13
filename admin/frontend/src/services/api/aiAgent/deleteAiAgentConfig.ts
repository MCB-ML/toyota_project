import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { AiAgentDeleteRequestPayload, AiAgentResponse } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const DELETE_AI_AGENT_CONFIG = `${envLoader.AI_AGENT_API_URL}/ai-agent/ConfigDelete`;

const deleteAiAgentConfig = async (
  payload: AiAgentDeleteRequestPayload,
): Promise<AiAgentResponse> => {
  try {
    const response = await axios.delete<AiAgentResponse>(DELETE_AI_AGENT_CONFIG, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      data: payload,
    });

    return response.data;
  } catch (AxiosError) {
    console.error("Error deleting AI agent configuration:", AxiosError);
    throw AxiosError;
  }
};

export const useDeleteAiAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAiAgentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
    },
    onError: (error: AxiosError) => {
      console.error("Delete AI Agent Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
    },
  });
};

export { deleteAiAgentConfig };
