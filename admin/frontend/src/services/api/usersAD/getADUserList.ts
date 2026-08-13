import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ADUserListResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const AD_USER_LIST_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/adUsers/getAllUsers`;

const getADUserList = async (): Promise<ADUserListResponse | null> => {
  try {
    const response = await axios.get(AD_USER_LIST_API_URL, {
      headers: {
        accept: "application/json",
      },
    });

    if (response.status !== 200) {
      console.log("getADUserList status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching AD user list:", error);
    return null;
  }
};

export const useGetADUserList = () => {
  return useQuery({
    queryKey: ["adUserList"],
    queryFn: getADUserList,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
