import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { CopilotAgent } from "@/types/copilot.types";
import envLoader from "@/utils/envLoader";

const GET_COPILOT_AGENT_BY_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/copilotAgents/getCopilotAgentById`;

const getCopilotAgentById = async (copilotAgentId: string): Promise<CopilotAgent> => {
  try {
    const response = await axios.get(`${GET_COPILOT_AGENT_BY_ID_API_URL}/${copilotAgentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching copilot agent by ID:", error);
    throw error;
  }
};

export const useGetCopilotAgentById = (copilotAgentId: string) => {
  return useQuery({
    queryKey: ["copilotAgentById", copilotAgentId],
    queryFn: () => getCopilotAgentById(copilotAgentId),
    enabled: !!copilotAgentId,
    retry: 3,
    refetchOnWindowFocus: true,
  });
};
