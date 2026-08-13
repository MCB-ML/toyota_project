import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { CreateUserRequest, CreateUserResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const CREATE_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/users/createUser`;

const createUser = async (data: CreateUserRequest): Promise<CreateUserResponse | null> => {
  try {
    const response = await axios.post(
      CREATE_USER_API_URL,
      {
        ...data,
        // 권한은 화면에서 고른 값을 그대로 보낸다 (admin / user / viewer).
        // 예전에는 "user" 로 고정되어 화면 선택이 무시됐다.
        userRole: data.userRole ?? "user",
      },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200 && response.status !== 201) {
      console.error("Failed to create user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating user: ", error);
    throw error;
  }
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workspaceUserAcces"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["userListAll"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Failed to create user:", error);
      queryClient.invalidateQueries({ queryKey: ["userListAll"] });
    },
  });
};
