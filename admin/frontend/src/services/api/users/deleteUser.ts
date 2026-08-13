import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { DeleteUserResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const DELETE_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/users/deleteUser`;

const deleteUser = async (userId: string): Promise<DeleteUserResponse | null> => {
  try {
    const response = await axios.delete(`${DELETE_USER_API_URL}/${userId}`);

    if (response.status !== 200) {
      console.error("Failed to delete user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting user: ", error);
    throw error;
  }
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
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
      console.error("Failed to delete user:", error);
      queryClient.invalidateQueries({ queryKey: ["userListAll"] });
    },
  });
};
