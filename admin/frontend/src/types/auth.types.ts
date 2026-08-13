import type { LoginAPIUserResponse } from "./login.types";

export interface AuthState {
  // Access token - stored in memory only (lost on refresh)
  accessToken: string | null;

  // Refresh token - persisted to localStorage (by zustand)
  refreshToken: string | null;

  user: LoginAPIUserResponse | null;
  accessTokenExpiry: number | null;
  lastActivity: number;

  setAuth: (
    accessToken: string,
    refreshToken: string,
    user: LoginAPIUserResponse,
    accessExpiry: number,
  ) => void;
  setAccessToken: (accessToken: string, expiry: number) => void;
  updateActivity: () => void;
  clearAuth: () => void;
  isAccessTokenExpired: () => boolean;
  shouldRefreshToken: () => boolean;
  isInactive: () => boolean;
  isAuthenticated: () => boolean;
  updateUser: (user: LoginAPIUserResponse) => void;
}

export interface CredentialLoginRequest {
  email: string;
  password: string;
}
export interface CredentialLoginResponset {
  token: string;
}

export interface UserInfo {
  email: string;
  name: string;
  /** 어드민 페이지는 admin 전용이다. 서버가 /auth/check 에서 함께 내려준다. */
  role?: string;
  defaultLanguage: string;
}
