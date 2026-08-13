import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { GetAllAiAgentsResponse } from "@/types/aiAgent.types";
import envLoader from "@/utils/envLoader";

const GET_ALL_AI_AGENTS_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/aiAgents/getAllAiAgents`;

const getAllAiAgents = async (): Promise<GetAllAiAgentsResponse> => {
  try {
    const response = await axios.get(GET_ALL_AI_AGENTS_API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching AI agents:", error);
    throw error;
  }
};

export const useGetAllAiAgents = () => {
  return useQuery({
    queryKey: ["aiAgentListAll"],
    queryFn: getAllAiAgents,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
