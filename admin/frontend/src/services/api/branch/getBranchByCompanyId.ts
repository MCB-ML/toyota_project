import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BranchData } from "@/types/branch.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const GET_BRANCH_BY_ID_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/branches/getBranchByCompanyId`;

const getBranchByCompanyId = async (
  companyId: string,
): Promise<IFetchApiRFesultContent<BranchData[]> | null> => {
  try {
    const response = await axios.get(`${GET_BRANCH_BY_ID_API_URL}/${companyId}`);
    if (response.status !== 200) {
      console.error("Failed to fetch branch by company id", response.status);
      return null;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching branch by company id", error);
    throw error;
  }
};

export const useGetBranchByCompanyId = (companyId: string | null) => {
  return useQuery({
    queryKey: ["branchByCompanyId", companyId],
    queryFn: () => getBranchByCompanyId(companyId!),
    enabled: !!companyId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
