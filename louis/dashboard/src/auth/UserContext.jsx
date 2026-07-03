import { createContext, useContext, useState } from 'react'

// TODO(실서비스 전환): 로그인 화면 없이 계정 컨텍스트만 코드에서 주입 가능한 구조.
// 실제 SSO/Azure AD 인증(msalConfig.js)이 연동되면, 로그인 성공 콜백에서
// setUser({ role, dealerId, dealer, group })를 호출하도록 교체하면 된다.
const UserContext = createContext(null)

export const HQ_USER = {
  role: 'hq',       // 'hq' | 'dealer'
  dealerId: null,
  dealer: null,
  group: null,
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(HQ_USER)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
