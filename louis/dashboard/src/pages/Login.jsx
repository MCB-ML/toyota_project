import { useMsal } from '@azure/msal-react'
import { LogIn } from 'lucide-react'
import { loginRequest } from '../auth/msalConfig'

export default function Login() {
  const { instance } = useMsal()

  const handleLogin = () => {
    instance.loginRedirect(loginRequest)
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

        <h1 className="mb-1 text-lg font-semibold text-gray-800">로그인</h1>
        <p className="mb-6 text-xs text-gray-500">회사 Microsoft 계정으로 로그인해주세요.</p>

        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f2f2f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
        >
          <LogIn size={15} />
          Microsoft 계정으로 로그인
        </button>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          회사(조직) 계정만 로그인이 허용됩니다.
        </p>
      </div>
    </div>
  )
}
