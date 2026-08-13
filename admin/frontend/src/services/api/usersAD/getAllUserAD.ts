import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ADUserListResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const AD_USER_LIST_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/adUserMaster/getAllUsers`;

const getAllUserAD = async (): Promise<ADUserListResponse | null> => {
  try {
    const response = await axios.get(AD_USER_LIST_API_URL);

    if (response.status !== 200) {
      console.log("getAllUserAD status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetching all AD users: ", error);
    return null;
  }
};

export const useGetAllUserAD = () => {
  return useQuery({
    queryKey: ["adUserListAll"],
    queryFn: getAllUserAD,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
