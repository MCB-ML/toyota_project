// 게스트 계정은 68cfa2f3(toyotamotor.co.kr) 테넌트에서 이 리포트를 보는 권한만 있고
// 앱 등록/admin consent를 처리할 관리자 권한이 없어, 당장은 SSO 임베드(BiSso.jsx) 대신
// Power BI의 자체 autoAuth iframe으로 임시 운영한다. 전환 조건은 README.md 참고.
const REPORT_SRC = 'https://app.fabric.microsoft.com/reportEmbed?reportId=244c5f1a-f42b-4b9b-a5e1-277573956470&autoAuth=true&ctid=68cfa2f3-dc5c-424d-974c-78ef6863fe9d'

export default function KtwsBi() {
  return (
    // h-full 대신 뷰포트 기준 고정 높이를 쓴다 — DeployableTab의 래퍼 div가 height를
    // 지정하지 않아서(다른 페이지들은 콘텐츠 높이로 자연스럽게 늘어나는 방식이라 필요
    // 없었음) h-full이 조상 체인에서 끊겨 0으로 무너지고, iframe이 브라우저 기본 크기로만
    // 렌더돼 작은 썸네일처럼 보였다.
    <div className="h-[calc(100vh-6rem)] p-3">
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
