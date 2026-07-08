import { LogLevel } from '@azure/msal-browser'

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    // Single-tenant: 회사 계정만 허용
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || level !== LogLevel.Error) return
        console.error('[MSAL]', message)
      },
    },
  },
}

// Microsoft Graph — 사용자 프로필 읽기
export const loginRequest = {
  scopes: ['User.Read'],
}

// Power BI / Fabric 리포트 임베드 — 웹 로그인과 같은 MSAL 세션에서 토큰만 추가로 발급받아
// BI iframe의 별도 autoAuth 로그인 없이 SSO로 붙인다.
export const powerbiRequest = {
  scopes: ['https://analysis.windows.net/powerbi/api/Report.Read.All'],
}
