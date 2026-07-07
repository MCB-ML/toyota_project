import { useMsal } from '@azure/msal-react'
import { Building2, Store, RefreshCw, LogOut } from 'lucide-react'
import { useUser, UNSELECTED_USER } from '../auth/UserContext'

// 로그인 후 선택한 본사/딜러사 계정을 사이드바에 표시하고,
// 다시 선택하거나 로그아웃할 수 있게 해주는 위젯.
// 실제 계정 선택은 로그인 직후 SelectAccount 페이지에서 이뤄진다(임시 방식).
export default function AccountSwitcher() {
  const { instance } = useMsal()
  const { user, setUser } = useUser()

  const handleReselect = () => setUser(UNSELECTED_USER)
  const handleLogout = () => instance.logoutRedirect()

  return (
    <div className="px-3 py-3 border-t border-white/10">
      <p className="px-1 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30">현재 계정</p>
      <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5">
        {user.role === 'hq'
          ? <Building2 size={13} className="flex-shrink-0 text-[#60a5fa]" />
          : <Store size={13} className="flex-shrink-0 text-[#60a5fa]" />}
        <span className="flex-1 truncate text-[11px] text-white/80">
          {user.role === 'hq' ? '본사 (전체 딜러)' : `${user.dealer} (${user.group})`}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1">
        <button
          onClick={handleReselect}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-white/50 hover:bg-white/5 hover:text-white/80"
        >
          <RefreshCw size={11} />
          계정 변경
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-white/50 hover:bg-white/5 hover:text-white/80"
        >
          <LogOut size={11} />
          로그아웃
        </button>
      </div>
    </div>
  )
}
