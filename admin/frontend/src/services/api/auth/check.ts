import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type { UserInfo } from "../../../types/auth.types";

const CHECK_URL = `${envLoader.BASE_OS_API_URL}/api/v1/auth/check`;

/**
 * 관리자 권한이 없어 거절된 경우. 미인증과 구분해야 안내 화면을 띄울 수 있다.
 *
 * 어느 계정으로 들어왔는지도 함께 담는다. 이 시점에는 토큰만 있고
 * 화면에는 계정 정보가 없어서, 서버가 알려주지 않으면 보여줄 방법이 없다.
 */
export type Forbidden = {
  forbidden: true;
  email?: string;
  role?: string;
};

export type CheckResult = IFetchApiRFesultContent<UserInfo> | Forbidden | null;

export const isForbiddenResult = (r: CheckResult): r is Forbidden =>
  !!r && (r as Forbidden).forbidden === true;

const getCheckToken = async (token: string): Promise<CheckResult> => {
  try {
    const response = await axios.get(`${CHECK_URL}/${token}`);

    if (response.status !== 200) return null;

    return response.data;
  } catch (error) {
    // 403 은 자격 증명이 멀쩡한데 권한만 없는 경우다. 로그인 화면으로
    // 되돌리면 사용자는 원인을 모른 채 로그인만 반복하게 된다.
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const body = error.response.data as { result?: { email?: string; role?: string } };

      return { forbidden: true, email: body?.result?.email, role: body?.result?.role };
    }

    console.error("Error in checking token: ", error);
    return null;
  }
};

export const useGetCheckToken = (token: string) => {
  return useQuery({
    queryKey: ["check", token],
    queryFn: () => getCheckToken(token!),
    select: (data) => data,
    enabled: !!token,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
