import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { AiAgentCreateRequest, AiAgentResponse } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const SAVE_AI_AGENT_CONFIG = `${envLoader.AI_AGENT_API_URL}/ai-agent/ConfigSave`;

const saveAiAgentConfig = async (payload: AiAgentCreateRequest): Promise<AiAgentResponse> => {
  try {
    const response = await axios.post<AiAgentResponse>(SAVE_AI_AGENT_CONFIG, payload, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });

    return response.data;
  } catch (AxiosError) {
    console.error("Error saving AI agent configuration:", AxiosError);
    throw AxiosError;
  }
};

export const useCreateAiAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAiAgentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
    },
    onError: (error: AxiosError) => {
      queryClient.invalidateQueries({ queryKey: ["aiAgentListAll"] });
      console.error("Create AI Agent Mutation error:", error);
    },
  });
};
export { saveAiAgentConfig };
