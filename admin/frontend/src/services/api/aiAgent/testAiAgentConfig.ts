import { useMutation } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { AiAgentTestRequestPayload } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const TEST_AI_AGENT_URL = `${envLoader.AI_AGENT_API_URL}/ai-agent/ConfigTest`;

const testAiAgentConfig = async (payload: AiAgentTestRequestPayload): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("prompt_yaml", payload.prompt_yaml);
    formData.append("company_info_id", payload.company_info_id);

    const response = await axios.post(TEST_AI_AGENT_URL, formData, {
      headers: {
        accept: "application/json",
      },
    });

    return response.data;
  } catch (AxiosError) {
    console.error("Error testing AI agent configuration:", AxiosError);
    throw AxiosError;
  }
};

export const useTestAiAgentConfig = () => {
  return useMutation({
    mutationFn: testAiAgentConfig,
    onError: (error: AxiosError) => {
      console.error("Test AI Agent Config Mutation error:", error);
    },
  });
};

export { testAiAgentConfig };
