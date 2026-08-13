import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AI365_STORAGE_KEY, fetchCurrentSession, logoutServerSession, storedSession } from './session'

// MS 로그인(MSAL)은 "우리 회사 계정인지"만 검증한다. 로그인한 사람이 본사 소속인지
// 어느 딜러사 소속인지는 아직 이메일→딜러 매핑 데이터가 없어 자동 판별할 수 없다.
// 그래서 로그인 직후 SelectAccount 페이지에서 본인이 직접 선택하게 하는 임시 방식을 쓴다.
//
// AI365(이메일/비밀번호) 로그인은 위 MSAL과 별개의 인증 경로다. AI365 응답의 name 필드에
// 부서명(DEALER_NM)이 실려오며, SelectAccount가 그 값으로 딜러 목록을 필터링한다
// (본사=TMKR/Admin → 전체, 특정 딜러명 → 그 딜러만). 매핑 규칙은 auth/ai365Mapping.js 참고.
const UserContext = createContext(null)

const STORAGE_KEY = 'toyota_dashboard_account_selection'
// AI365_STORAGE_KEY 는 auth/session.js 가 갖는다 — API 호출부도 같은 키로
// 토큰을 읽어야 해서, 키가 두 군데로 갈리면 한쪽만 고쳤을 때 조용히 어긋난다.

export const HQ_USER = {
  role: 'hq',       // 'hq' | 'dealer'
  dealerId: null,
  dealer: null,
  brand: null,
  region: null,
}

// 로그인은 했지만 아직 본사/딜러사를 선택하지 않은 상태
export const UNSELECTED_USER = {
  role: null,
  dealerId: null,
  dealer: null,
  brand: null,
  region: null,
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
  const [ai365, setAi365State] = useState(storedSession)
  const sessionChecked = useRef(false)

  const setUser = (next) => {
    setUserState(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // sessionStorage 접근 불가 시(시크릿 모드 등) 세션 유지만 포기하고 넘어간다
    }
  }

  // 세션 값만 갈아끼운다. 선택한 소속(user)은 건드리지 않는다.
  const storeAi365 = (session) => {
    setAi365State(session)
    try {
      sessionStorage.setItem(AI365_STORAGE_KEY, JSON.stringify(session))
    } catch {
      // 저장 실패는 무시(세션 유지만 포기)
    }
  }

  // AI365 로그인 성공 시 호출. 세션을 저장한다. 실제 딜러 확정은 SelectAccount에서
  // name(부서명)으로 필터된 목록을 통해 이뤄지므로 여기서는 UNSELECTED로 둔다.
  const signInAi365 = (session) => {
    storeAi365(session)
    setUser(UNSELECTED_USER)
  }

  const signOutAi365 = () => {
    // 서버 쪽 세션 쿠키도 함께 지운다(실패해도 클라이언트 세션은 정리한다).
    logoutServerSession()
    setAi365State(null)
    try {
      sessionStorage.removeItem(AI365_STORAGE_KEY)
    } catch {
      // 무시
    }
    setUser(UNSELECTED_USER)
  }

  // 새로고침 후 한 번, 들고 있는 토큰이 아직 유효한지 서버에 확인한다.
  // 토큰은 1시간이면 만료되는데 그걸 모르고 화면만 열려 있으면 사용자는 모든 위젯이
  // 이유 없이 실패하는 것만 보게 된다 — 차라리 로그인 화면으로 돌려보낸다.
  // 어드민 토큰에 scopeKey 가 실려 오지 않는 경로에서는 서버가 채워준 값을 받아 둔다.
  useEffect(() => {
    if (sessionChecked.current || !ai365?.token) return
    sessionChecked.current = true
    let cancelled = false
    fetchCurrentSession().then((serverUser) => {
      if (cancelled) return
      if (!serverUser) { signOutAi365(); return }
      if (serverUser.scopeKey && serverUser.scopeKey !== ai365.scopeKey) {
        // 세션만 고친다 — 이미 고른 소속을 여기서 초기화하면 화면이 되돌아간다.
        storeAi365({ ...ai365, scopeKey: serverUser.scopeKey })
      }
    })
    return () => { cancelled = true }
    // 최초 1회만 돈다(sessionChecked). ai365 는 확인 시점의 값을 읽기 위해서만 쓴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai365?.token])

  return (
    <UserContext.Provider value={{ user, setUser, ai365, signInAi365, signOutAi365 }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
