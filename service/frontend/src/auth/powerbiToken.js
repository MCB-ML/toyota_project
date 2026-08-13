import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { powerbiRequest } from './msalConfig'

// 웹 로그인(MSAL) 세션에서 Power BI API용 토큰을 조용히 발급받는다.
// 브라우저 쿠키 기반 SSO(autoAuth)와 달리, 이미 로그인된 계정의 토큰을 그대로 재사용하므로
// 서드파티 쿠키 차단 등으로 BI에서 별도 로그인 창이 뜨는 문제가 생기지 않는다.
export async function acquirePowerBIToken(instance, account) {
  try {
    const result = await instance.acquireTokenSilent({ ...powerbiRequest, account })
    return result.accessToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await instance.acquireTokenPopup(powerbiRequest)
      return result.accessToken
    }
    throw err
  }
}
