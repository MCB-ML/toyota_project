import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { CompanyViewResponse } from "@/types/orgChart.types";
import envLoader from "@/utils/envLoader";

const COMPANY_VIEW_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/orgChart/getCompanyView`;

const getCompanyView = async (): Promise<CompanyViewResponse | null> => {
  try {
    const response = await axios.get(COMPANY_VIEW_API_URL);

    if (response.status !== 200) {
      console.error("getCompanyView status not 200");
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching company view data: ", error);
    return null;
  }
};

export const useGetCompanyView = () => {
  return useQuery({
    queryKey: ["orgChartCompanyView"],
    queryFn: getCompanyView,
    retry: 3,
    refetchOnWindowFocus: true,
  });
};
