import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { UpdateUserRequest, User } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const UPDATE_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/users/updateUser`;

const updateUser = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: UpdateUserRequest;
}): Promise<User | null> => {
  try {
    const response = await axios.put(`${UPDATE_USER_API_URL}/${userId}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating user: ", error);
    throw error;
  }
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["workspaceUserAcces"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["userListAll"] });
        queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Failed to update user:", error);
      queryClient.invalidateQueries({ queryKey: ["userListAll"] });
    },
  });
};
