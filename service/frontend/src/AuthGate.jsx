import { useIsAuthenticated } from '@azure/msal-react'
import { useUser } from './auth/UserContext'
import Login from './pages/Login'
import SelectAccount from './pages/SelectAccount'
import App from './App'

// 로그인 -> (임시) 본사/딜러사 선택 -> 대시보드, 3단계 게이트.
// 인증 경로는 둘: MSAL(회사 Microsoft 계정) 또는 AI365(이메일/비밀번호).
// AI365 사용자는 MSAL 세션이 없으므로 AuthenticatedTemplate 대신 두 경로를 OR로 직접 판정한다.
export default function AuthGate() {
  const isMsalAuthenticated = useIsAuthenticated()
  const { user, ai365 } = useUser()
  const isAuthenticated = isMsalAuthenticated || !!ai365

  if (!isAuthenticated) return <Login />
  // 권한/부서 자동 판별(AI365) 또는 수동 선택(SelectAccount)으로 role이 정해지면 대시보드로.
  return user.role ? <App /> : <SelectAccount />
}
