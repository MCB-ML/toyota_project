import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import type { ADUser, UpdateADUserRequest } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const UPDATE_AD_USER_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/adUserMaster/updateUser`;

const updateADUser = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: UpdateADUserRequest;
}): Promise<ADUser | null> => {
  try {
    const response = await axios.put(`${UPDATE_AD_USER_API_URL}/${userId}`, payload);

    if (response.status !== 200) {
      console.error("Failed to update AD user, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in updating AD user: ", error);
    throw error;
  }
};

export const useUpdateADUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateADUser,
    onSuccess: (data, _variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["adUserListAll"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartCompanyView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartBranchView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartWorkspaceView"] });
        queryClient.invalidateQueries({ queryKey: ["orgChartEndUserView"] });
      }
    },
    onError: (error: AxiosError) => {
      console.error("Failed to update AD user:", error);
      queryClient.invalidateQueries({ queryKey: ["adUserListAll"] });
    },
  });
};
