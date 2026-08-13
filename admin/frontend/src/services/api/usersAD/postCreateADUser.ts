import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CreateADUserRequest, CreateUserResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const CREATE_AD_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/adUserMaster/createUser`;

const createADUser = async (data: CreateADUserRequest): Promise<CreateUserResponse | null> => {
  try {
    const response = await axios.post(CREATE_AD_USER_API_URL, data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      console.error("Failed to create AD user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating AD user: ", error);
    throw error;
  }
};

export const useCreateADUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createADUser,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["adUserListAll"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Failed to create AD user:", error);
      queryClient.invalidateQueries({ queryKey: ["adUserListAll"] });
    },
  });
};
