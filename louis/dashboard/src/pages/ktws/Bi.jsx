// 게스트 계정은 68cfa2f3(toyotamotor.co.kr) 테넌트에서 이 리포트를 보는 권한만 있고
// 앱 등록/admin consent를 처리할 관리자 권한이 없어, 당장은 SSO 임베드(BiSso.jsx) 대신
// Power BI의 자체 autoAuth iframe으로 임시 운영한다. 전환 조건은 README.md 참고.
const REPORT_SRC = 'https://app.fabric.microsoft.com/reportEmbed?reportId=244c5f1a-f42b-4b9b-a5e1-277573956470&autoAuth=true&ctid=68cfa2f3-dc5c-424d-974c-78ef6863fe9d'

export default function KtwsBi() {
  return (
    <div className="h-full p-3">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        <iframe
          title="KTWS_Dashboard(tmkr)"
          src={REPORT_SRC}
          className="w-full h-full rounded-lg"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  )
}
