export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginAPIUserResponse {
  email: string;
  username: string;
  role: string;
}

export interface LoginAPITokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginAPISuccessResponse {
  token: LoginAPITokenResponse;
  user: LoginAPIUserResponse;
}

export interface LoginRefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenSuccessResponse {
  access_token: string;
}

export interface LoginAPIErrorResponse {
  detail: string;
}

export type LoginAPIResponse = LoginAPISuccessResponse | LoginAPIErrorResponse;
export type LoginRefreshTokenResponse = RefreshTokenSuccessResponse | LoginAPIErrorResponse;
