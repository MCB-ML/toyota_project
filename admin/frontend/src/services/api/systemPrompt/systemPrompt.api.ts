import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult, IFetchApiRFesultContent } from "../../../types/apiResponse";
import type {
  SystemPrompt,
  SystemPromptCreateRequest,
  SystemPromptUpdateRequest,
} from "../../../types/systemPrompt.types";

const BASE = `${envLoader.BASE_OS_API_URL}/api/v1/systemPrompt`;

const QUERY_KEY = ["systemPromptAll"];

// ── 조회 ──────────────────────────────────────────────────────────────

const getAllSystemPrompt = async (): Promise<IFetchApiRFesultContent<SystemPrompt[]> | null> => {
  const response = await axios.get(`${BASE}/getAll`);

  if (response.status !== 200) {
    console.error("getAllSystemPrompt status not 200:", response.status);
    return null;
  }

  return response.data;
};

export const useGetAllSystemPrompt = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllSystemPrompt,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

// ── 생성 ──────────────────────────────────────────────────────────────

const createSystemPrompt = async (
  payload: SystemPromptCreateRequest,
): Promise<IFetchApiResult | null> => {
  const response = await axios.post(`${BASE}/create`, payload);
  return response.data;
};

export const useCreateSystemPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSystemPrompt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

// ── 수정 ──────────────────────────────────────────────────────────────

const updateSystemPrompt = async (
  payload: SystemPromptUpdateRequest,
): Promise<IFetchApiResult | null> => {
  const response = await axios.put(`${BASE}/update`, payload);
  return response.data;
};

export const useUpdateSystemPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSystemPrompt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

// ── 삭제 ──────────────────────────────────────────────────────────────

const deleteSystemPrompt = async (id: string): Promise<IFetchApiResult | null> => {
  const response = await axios.delete(`${BASE}/delete/${id}`);
  return response.data;
};

export const useDeleteSystemPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSystemPrompt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
