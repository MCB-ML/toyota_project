import { useMsal } from '@azure/msal-react'
import { Building2, Store, LogOut, AlertTriangle } from 'lucide-react'
import { useUser, HQ_USER } from '../auth/UserContext'
import { dealerMaster } from '../data/dummy'
import { resolveVisibleDealers, getDealerKey } from '../auth/ai365Mapping'

// 로그인 직후 "본사 계정으로 볼지 / 어느 딜러사로 볼지"를 고르는 페이지.
// AI365 로그인은 응답 name(부서명)으로 아래 딜러 목록을 자동 필터링한다:
//   - TMKR / Admin        → 전체 딜러 + 본사 옵션
//   - 특정 딜러명(렉서스 광주 등) → 그 딜러 하나만 노출(본사 옵션 없음)
//   - 등록되지 않은 딜러명   → 선택지 없이 안내(전체 권한으로 폴백하지 않음)
// MSAL 로그인·부서명 미확인 시엔 전체 목록을 그대로 보여준다(수동 선택).
export default function SelectAccount() {
  const { instance, accounts } = useMsal()
  const { setUser, ai365, signOutAi365 } = useUser()
  const account = accounts[0]

  // AI365 부서명(name)으로 노출할 딜러 목록/본사 옵션/미등록 여부를 결정
  const { showHq, dealers: visibleDealers, unmatched } = resolveVisibleDealers(ai365, dealerMaster)
  const dealerKey = getDealerKey(ai365)

  const handleSelectHq = () => setUser(HQ_USER)

  const handleSelectDealer = (dealer) => {
    setUser({
      role: 'dealer',
      dealerId: dealer.dealerId,
      dealer: dealer.dealer,
      brand: dealer.brand,
      region: dealer.region,
    })
  }

  // AI365 사용자는 MSAL 세션이 없으므로 AI365 세션만 정리한다.
  const handleLogout = () => (ai365 ? signOutAi365() : instance.logoutRedirect())

  // 인사 문구: MSAL은 사용자 이름, AI365는 부서명 기준
  const greeting = account
    ? `${account.name || account.username}님, 환영합니다.`
    : dealerKey
      ? `${dealerKey} 계정으로 로그인되었습니다.`
      : '로그인되었습니다.'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0b1220] p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">계정 유형 선택</h1>
            <p className="mt-1 text-xs text-gray-500">
              {greeting}
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

        {unmatched ? (
          // 등록되지 않은 딜러명 → 선택지 없이 안내만. 전체 권한으로 폴백하지 않는다.
          <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <AlertTriangle size={22} className="text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">등록되지 않은 딜러사입니다.</p>
              <p className="mt-1 text-xs text-red-500">
                부서명 &lsquo;{dealerKey}&rsquo; 에 해당하는 딜러사가 없습니다. 관리자에게 문의해주세요.
              </p>
            </div>
          </div>
        ) : (
          <>
            {showHq && (
              <>
                <div className="mb-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                  {dealerKey ? `${dealerKey} 계정입니다. ` : ''}전체 딜러를 조회할 수 있습니다. 본사 또는 특정 딜러사를 선택해주세요.
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
              </>
            )}

            <p className="mb-2 mt-4 text-xs font-medium text-gray-500">
              {showHq ? '딜러사 계정으로 입장' : '아래 딜러사로 입장합니다.'}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleDealers.map((d) => (
                <button
                  key={d.dealerId}
                  onClick={() => handleSelectDealer(d)}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <Store size={15} className="flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{d.dealer}</p>
                    <p className="text-[11px] text-gray-400">{d.brand} · {d.region}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
