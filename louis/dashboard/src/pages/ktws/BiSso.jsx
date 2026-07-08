// IT팀이 toyotamotor.co.kr(68cfa2f3) 테넌트에 앱 등록 + Power BI Service 권한(admin consent)을
// 완료하면, Bi.jsx 대신 이 컴포넌트를 라우팅에 연결해서 iframe autoAuth 없이
// 웹 로그인(MSAL) 세션으로 바로 SSO 임베드한다. 자세한 전환 절차는 README.md 참고.
import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { PowerBIEmbed } from 'powerbi-client-react'
import { models } from 'powerbi-client'
import { acquirePowerBIToken } from '../../auth/powerbiToken'

const REPORT_ID = import.meta.env.VITE_POWERBI_REPORT_ID
const GROUP_ID = import.meta.env.VITE_POWERBI_GROUP_ID

export default function KtwsBiSso() {
  const { instance, accounts } = useMsal()
  const [accessToken, setAccessToken] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    acquirePowerBIToken(instance, accounts[0])
      .then((token) => { if (!cancelled) setAccessToken(token) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [instance, accounts])

  return (
    <div className="h-full p-3">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center justify-center">
        {error && (
          <p className="text-sm text-red-500 px-6 text-center">
            BI 인증에 실패했습니다. Azure AD 앱에 Power BI Service 권한(admin consent)이 등록되어 있는지 확인해주세요.
          </p>
        )}
        {!error && !accessToken && (
          <p className="text-sm text-gray-400">BI 리포트 인증 중...</p>
        )}
        {!error && accessToken && (
          <PowerBIEmbed
            cssClassName="w-full h-full rounded-lg"
            embedConfig={{
              type: 'report',
              id: REPORT_ID,
              embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${REPORT_ID}&groupId=${GROUP_ID}`,
              accessToken,
              tokenType: models.TokenType.Aad,
              settings: {
                panes: { filters: { visible: false } },
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
