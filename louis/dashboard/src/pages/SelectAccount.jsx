import { useMsal } from '@azure/msal-react'
import { Building2, Store, LogOut } from 'lucide-react'
import { useUser, HQ_USER } from '../auth/UserContext'
import { dealerMaster } from '../data/dummy'

// 로그인 직후 "본사 계정으로 볼지 / 어느 딜러사로 볼지"를 직접 고르는 임시 페이지.
// 아직 이메일→딜러 매핑 데이터가 없어서 자동 판별이 불가능해 우선 수동 선택으로 대체한다.
// TODO(실서비스 전환): 딜러사 이메일 매핑이 확보되면 이 페이지를 건너뛰고 자동으로 role/dealerId를 설정한다.
export default function SelectAccount() {
  const { instance, accounts } = useMsal()
  const { setUser } = useUser()
  const account = accounts[0]

  const handleSelectHq = () => setUser(HQ_USER)

  const handleSelectDealer = (dealer) => {
    setUser({ role: 'dealer', dealerId: dealer.dealerId, dealer: dealer.dealer, group: dealer.group })
  }

  const handleLogout = () => instance.logoutRedirect()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0b1220] p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">계정 유형 선택</h1>
            <p className="mt-1 text-xs text-gray-500">
              {account ? `${account.name || account.username}님, 환영합니다.` : '로그인되었습니다.'} 어떤 계정으로 조회하시겠습니까?
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <LogOut size={13} />
            로그아웃
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          임시 화면입니다. 추후 이메일 기준 자동 판별이 적용되면 이 선택 단계는 사라집니다.
        </div>

        <button
          onClick={handleSelectHq}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 text-left transition hover:border-blue-300 hover:bg-blue-50"
        >
          <Building2 size={18} className="flex-shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-800">본사 계정</p>
            <p className="text-xs text-gray-500">전체 딜러사 데이터를 조회합니다.</p>
          </div>
        </button>

        <p className="mb-2 text-xs font-medium text-gray-500">딜러사 계정으로 입장</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {dealerMaster.map((d) => (
            <button
              key={d.dealerId}
              onClick={() => handleSelectDealer(d)}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50"
            >
              <Store size={15} className="flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-gray-800">{d.dealer}</p>
                <p className="text-[11px] text-gray-400">{d.group} · {d.brand}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
