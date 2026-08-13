import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import envLoader from "@/utils/envLoader";

/**
 * 모든 요청에 로그인 토큰을 붙인다.
 *
 * 백엔드가 인증 미들웨어를 쓰기 시작하면서, 헤더가 없는 요청은 전부 401 이 된다.
 * 각 API 파일이 직접 axios 를 부르고 있어 한곳에서 거는 편이 빠뜨릴 일이 없다.
 *
 * /auth/* 는 예외다. 로그인 전에는 붙일 토큰이 없다.
 */
export const setupAxios = () => {
  axios.interceptors.request.use((config) => {
    if (config.url?.includes("/api/v1/auth/")) return config;

    const token = localStorage.getItem(envLoader.TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  /**
   * 토큰이 만료되면(발급 후 1시간) 백엔드가 401 을 돌려준다. 갱신 경로가 없으므로
   * 세션을 비우고 로그인 화면으로 돌려보낸다.
   *
   * 이게 없으면 화면은 로그인한 것처럼 남은 채 모든 조회만 조용히 실패한다.
   * 라우트 가드(authStore.isAuthenticated)가 보는 것은 refreshToken 유무와
   * 무활동 시간뿐이라 토큰이 만료된 사실을 알지 못하기 때문이다.
   *
   * 403 은 여기서 다루지 않는다. 관리자 권한이 없다는 뜻이라 다시 로그인해도
   * 결과가 같다 — 로그인 화면으로 보내면 원인을 모른 채 반복하게 된다.
   */
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url: string = error?.config?.url ?? "";

      // 로그인 요청 자체의 401(비밀번호 오류)은 로그인 화면이 직접 안내한다.
      if (status === 401 && !url.includes("/api/v1/auth/")) {
        useAuthStore.getState().clearAuth();
        localStorage.removeItem(envLoader.TOKEN_KEY);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      }

      return Promise.reject(error);
    },
  );
};
