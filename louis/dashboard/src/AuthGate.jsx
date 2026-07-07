import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { useUser } from './auth/UserContext'
import Login from './pages/Login'
import SelectAccount from './pages/SelectAccount'
import App from './App'

// 로그인 -> (임시) 본사/딜러사 선택 -> 대시보드, 3단계 게이트.
export default function AuthGate() {
  const { user } = useUser()

  return (
    <>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        {user.role ? <App /> : <SelectAccount />}
      </AuthenticatedTemplate>
    </>
  )
}
