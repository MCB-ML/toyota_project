import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { LogIn, ArrowLeft, Loader2 } from 'lucide-react'
import { loginRequest } from '../auth/msalConfig'
import { loginAi365 } from '../auth/ai365'
import { useUser } from '../auth/UserContext'

export default function Login() {
  const { instance } = useMsal()
  const { signInAi365 } = useUser()

  // 같은 카드 안에서 토글되는 "AI365 이메일/비밀번호" 폼 상태 (별도 라우트 없음)
  const [showAi365, setShowAi365] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMsLogin = () => {
    instance.loginRedirect(loginRequest)
  }

  const handleAi365Submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const session = await loginAi365(email.trim(), password)
      signInAi365(session) // 권한/부서가 있으면 자동으로 대시보드까지, 없으면 SelectAccount로
    } catch (err) {
      setError(err?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setShowAi365(false)
    setError('')
    setPassword('')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b1220]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EB0A1E] text-sm font-bold text-white">
            T
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-800">Toyota / Lexus</p>
            <p className="text-xs leading-tight text-gray-400">Data Dashboard</p>
          </div>
        </div>

        {!showAi365 ? (
          <>
            <h1 className="mb-1 text-lg font-semibold text-gray-800">로그인</h1>
            <p className="mb-6 text-xs text-gray-500">회사 Microsoft 계정으로 로그인해주세요.</p>

            <button
              onClick={handleMsLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f2f2f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
            >
              <LogIn size={15} />
              Microsoft 계정으로 로그인
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] text-gray-400">또는</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              onClick={() => setShowAi365(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              AI365 계정으로 로그인
            </button>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              회사(조직) 계정만 로그인이 허용됩니다.
            </p>
          </>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="뒤로"
              >
                <ArrowLeft size={15} />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">AI365 계정 로그인</h1>
            </div>
            <p className="mb-5 pl-8 text-xs text-gray-500">데이터 에이전트 계정으로 로그인합니다.</p>

            <form onSubmit={handleAi365Submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EB0A1E] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c50919] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    로그인 중…
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    로그인
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
