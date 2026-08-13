import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { CompanyConnections, TableList } from "@/types/companyInfo.types";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";

const CREATE_COMPANY_API_URL = `${envLoader.BASE_OS_API_URL}/api/v1/companies/connectDb`;

const connectDb = async (
  data: CompanyConnections,
): Promise<IFetchApiRFesultContent<TableList[]> | null> => {
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

export const useConnectDb = () => {
  return useMutation({
    mutationFn: connectDb,
  });
};
