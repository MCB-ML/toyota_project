import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { UserListResponse } from "@/types/user.types";
import envLoader from "@/utils/envLoader";

const USER_LIST_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/users/getAllUsers`;

const getAllUser = async (): Promise<UserListResponse | null> => {
  try {
    const response = await axios.get(USER_LIST_API_URL);

    if (response.status !== 200) {
      console.log("getAllUser status not 200, returning null");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetching all users: ", error);
    return null;
  }
};

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["userListAll"],
    queryFn: getAllUser,
    select: (data) => data,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
