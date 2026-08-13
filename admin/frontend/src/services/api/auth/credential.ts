import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { CredentialLoginRequest, CredentialLoginResponset } from "../../../types/auth.types";

const LOGIN = `${envLoader.BASE_OS_API_URL}/api/v1/auth/login/credentials`;

const createLoginCredential = async (
  payload: CredentialLoginRequest,
): Promise<IFetchApiRFesultContent<CredentialLoginResponset> | null> => {
  try {
    const response = await axios.post(LOGIN, payload);

    if (response.status !== 201 && response.status !== 200) {
      console.error("Failed to azure , status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating azure: ", error);
    throw error;
  }
};

export const useCreateLoginCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLoginCredential,
    onSuccess: (data) => {
      if (data) {
        //queryClient.invalidateQueries({ queryKey: ["azureListAll"] });
        //queryClient.invalidateQueries({ queryKey: ["azureById"], exact: false });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Create Azure Mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["azureListAll"] });
    },
  });
};
