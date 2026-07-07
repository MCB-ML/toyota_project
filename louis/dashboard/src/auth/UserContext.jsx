import { createContext, useContext, useState } from 'react'

// MS 로그인(MSAL)은 "우리 회사 계정인지"만 검증한다. 로그인한 사람이 본사 소속인지
// 어느 딜러사 소속인지는 아직 이메일→딜러 매핑 데이터가 없어 자동 판별할 수 없다.
// 그래서 로그인 직후 SelectAccount 페이지에서 본인이 직접 선택하게 하는 임시 방식을 쓴다.
// TODO(실서비스 전환): 딜러사 이메일→dealerId 매핑 데이터가 확보되면, SelectAccount를 거치지 않고
// 로그인 성공 콜백(main.jsx)에서 바로 setUser({ role, dealerId, dealer, group })를 호출하도록 교체한다.
const UserContext = createContext(null)

const STORAGE_KEY = 'toyota_dashboard_account_selection'

export const HQ_USER = {
  role: 'hq',       // 'hq' | 'dealer'
  dealerId: null,
  dealer: null,
  group: null,
}

// 로그인은 했지만 아직 본사/딜러사를 선택하지 않은 상태
export const UNSELECTED_USER = {
  role: null,
  dealerId: null,
  dealer: null,
  group: null,
}

function loadStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : UNSELECTED_USER
  } catch {
    return UNSELECTED_USER
  }
}

export function UserProvider({ children }) {
  const [user, setUserState] = useState(loadStoredUser)

  const setUser = (next) => {
    setUserState(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // sessionStorage 접근 불가 시(시크릿 모드 등) 세션 유지만 포기하고 넘어간다
    }
  }

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
