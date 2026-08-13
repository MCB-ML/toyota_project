import envLoader from "./envLoader";

/**
 * 데모 모드 여부.
 *
 * DEMO_EMAIL / DEMO_PASSWORD / DEMO_REFRESH_INTERVAL 은 제거했다.
 * 이 값들을 쓰던 자동 로그인 훅이 사라져 소비처가 없었고,
 * VITE_ 변수는 빌드 시 번들에 그대로 박혀 계정 정보가 공개된다.
 */
export const DEMO_CONFIG = {
  DEMO_MODE: envLoader.DEMO_MODE === "true",
} as const;

export const isDemoMode = () => DEMO_CONFIG.DEMO_MODE;
