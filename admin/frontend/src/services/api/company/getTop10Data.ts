import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { CompanyConnections } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const CREATE_COMPANY_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/getTop10Data`;

const getTop10datas = async (
  data: CompanyConnections,
): Promise<IFetchApiRFesultContent<any[]> | null> => {
  try {
    const response = await axios.post(CREATE_COMPANY_API_URL, data);

    if (response.status !== 200 && response.status !== 201) {
      console.error("Failed to create company, status:", response.status);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error in creating company: ", error);
    throw error;
  }
};

export const useGetTop10Data = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getTop10datas,

    onSuccess: (data, variables) => {
      queryClient.setQueryData(["tablePreview", variables.table], data);
    },
  });
};
