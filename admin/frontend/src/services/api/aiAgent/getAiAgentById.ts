import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { GetAiAgentByIdResponse } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const GET_AI_AGENT_CONFIG_BY_ID = `${envLoader.AI_AGENT_API_URL}/ai-agent/ConfigGetData`;

const getAiAgentById = async (agentId: string): Promise<GetAiAgentByIdResponse> => {
  try {
    const response = await axios.post(GET_AI_AGENT_CONFIG_BY_ID, {
      agentId,
    });
    return {
      success: true,
      message: "Agent fetched successfully",
      data: response.data,
    };
  } catch (AxiosError) {
    console.error("Error fetching ai agent configuration details:", AxiosError);
    throw AxiosError;
  }
};

export const useGetAiAgentById = () => {
  return useMutation({
    mutationFn: getAiAgentById,
  });
};

export { getAiAgentById };
