import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiResult, IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { ModelSpec } from "../../../types/model.types";

const MODEL_BASE = `${envLoader.BASE_OS_API_URL}/api/v1/model`;

const MODEL_KEY = ["modelAll"];

const getAllModels = async (): Promise<IFetchApiRFesultContent<ModelSpec[]> | null> => {
  const response = await axios.get(`${MODEL_BASE}/getAll`);
  return response.status === 200 ? response.data : null;
};

export const useGetAllModels = () =>
  useQuery({
    queryKey: MODEL_KEY,
    queryFn: getAllModels,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

export const useCreateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ModelSpec): Promise<IFetchApiResult | null> =>
      (await axios.post(`${MODEL_BASE}/create`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODEL_KEY }),
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ModelSpec): Promise<IFetchApiResult | null> =>
      (await axios.put(`${MODEL_BASE}/update`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODEL_KEY }),
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<IFetchApiResult | null> =>
      (await axios.delete(`${MODEL_BASE}/delete/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODEL_KEY }),
  });
};
