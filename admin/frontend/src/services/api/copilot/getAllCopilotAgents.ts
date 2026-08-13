import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { GetAllCopilotAgentsResponse } from "@/types/copilot.types";
import envLoader from "@/utils/envLoader";

const GET_ALL_COPILOT_AGENTS_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/copilotAgents/getAllCopilotAgents`;

const getAllCopilotAgents = async (): Promise<GetAllCopilotAgentsResponse> => {
  try {
    const response = await axios.get(GET_ALL_COPILOT_AGENTS_API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching copilot agents:", error);
    throw error;
  }
};

export const useGetAllCopilotAgents = () => {
  return useQuery({
    queryKey: ["copilotAgentListAll"],
    queryFn: getAllCopilotAgents,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
