import { Building2, Store } from 'lucide-react'
import { useUser, HQ_USER } from '../auth/UserContext'
import { dealerMaster } from '../data/dummy'

// 데모/개발용 계정 전환 UI. 실제 로그인 화면이 아직 없으므로,
// 본사 계정 vs 딜러사 계정 시점의 접근제어 동작을 눈으로 확인하기 위한 용도.
// TODO(실서비스 전환): 실제 로그인(MSAL 등) 연동 시 이 컴포넌트를 제거하고
// UserProvider의 초기값을 로그인 세션 정보로 채운다.
export default function AccountSwitcher() {
  const { user, setUser } = useUser()

  const handleChange = (e) => {
    const value = e.target.value
    if (value === 'hq') {
      setUser(HQ_USER)
      return
    }
    const dealer = dealerMaster.find(d => d.dealerId === value)
    if (dealer) {
      setUser({ role: 'dealer', dealerId: dealer.dealerId, dealer: dealer.dealer, group: dealer.group })
    }
  }

  return (
    <div className="px-3 py-3 border-t border-white/10">
      <p className="px-1 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30">데모 계정 전환</p>
      <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1.5">
        {user.role === 'hq'
          ? <Building2 size={13} className="text-[#60a5fa] flex-shrink-0" />
          : <Store size={13} className="text-[#60a5fa] flex-shrink-0" />}
        <select
          value={user.role === 'hq' ? 'hq' : user.dealerId}
          onChange={handleChange}
          className="flex-1 bg-transparent text-[11px] text-white/80 outline-none cursor-pointer"
        >
          <option value="hq" className="text-black">본사 (전체 딜러)</option>
          {dealerMaster.map(d => (
            <option key={d.dealerId} value={d.dealerId} className="text-black">
              {d.dealer} ({d.group})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
