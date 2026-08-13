import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { DeleteADUserResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const DELETE_AD_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/adUserMaster/deleteUser`;

const deleteADUser = async (userId: string): Promise<DeleteADUserResponse | null> => {
  try {
    const response = await axios.delete(`${DELETE_AD_USER_API_URL}/${userId}`);

    if (response.status !== 200) {
      console.error("Failed to delete AD user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in deleting AD user: ", error);
    throw error;
  }
};

export const useDeleteADUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteADUser,
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
      console.error("Failed to delete AD user:", error);
      queryClient.invalidateQueries({ queryKey: ["adUserListAll"] });
    },
  });
};
