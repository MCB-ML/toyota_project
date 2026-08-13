import { isForbiddenResult, useGetCheckToken } from "../../services/api/auth/check";
import envLoader from "../../utils/envLoader";

export const useAuth = () => {
  const token = localStorage.getItem(envLoader.TOKEN_KEY);

  const { data, isLoading, refetch } = useGetCheckToken(token ?? "");

  const result = data ?? null;

  // 관리자 권한이 없어 거절된 경우. 자격 증명은 멀쩡하므로 미인증과 다르게 다뤄야 한다.
  const forbidden = isForbiddenResult(result) ? result : null;

  // 가드를 result 에 직접 걸어야 타입이 좁혀진다.
  // forbidden 여부로 삼항 연산을 하면 TS 가 result 를 좁히지 못한다.
  const check = result && !isForbiddenResult(result) ? result : null;

  return {
    token,
    isAuthenticated: !!token && !!check?.result,
    isForbidden: !!forbidden,
    /** 권한 거절된 계정. 안내 화면에서 "이 계정으로 들어왔다" 를 보여준다. */
    forbiddenAccount: forbidden,
    isLoading,
    user: check?.result,
    refetch,
  };
};
