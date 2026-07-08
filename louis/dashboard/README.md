# Toyota / Lexus Data Dashboard

## KTWS BI 임베드 — 프로덕션 전환 시 처리할 것

현재 `KTWS > BI` 메뉴([src/pages/ktws/Bi.jsx](src/pages/ktws/Bi.jsx))는 Power BI/Fabric의
`autoAuth=true` iframe으로 리포트를 띄우고 있다. 이 방식은 웹 로그인(MSAL)과 완전히 별개의
로그인 세션이라 브라우저 쿠키 정책(서드파티 쿠키 차단)에 따라 BI에서 별도 로그인 창이 뜰 수 있다.

### 왜 지금 SSO(진짜 로그인 공유)로 안 되어 있는가

- 리포트가 있는 실제 테넌트: `68cfa2f3-dc5c-424d-974c-78ef6863fe9d` (`toyotamotor.co.kr`)
- 지금 웹 로그인에 쓰는 Azure AD 앱 등록(`toyota_ms_login_test`, clientId `dcb26049-...`)은
  테스트 테넌트(`033ad662-3b65-45f4-9052-5b0f8d949ff4`) 소속
- 지금 테스트 계정은 `toyotamotor.co.kr` 테넌트에 **게스트**로 초대되어 리포트 뷰어 권한만 있고,
  Azure Portal의 App registration / admin consent 같은 관리자 기능은 접근 불가
- `powerbi-client` SDK로 토큰을 직접 발급해서 꽂는 방식([src/pages/ktws/BiSso.jsx](src/pages/ktws/BiSso.jsx),
  이미 구현되어 있지만 라우팅에는 연결 안 됨)은 리포트가 있는 테넌트 안에 앱 등록 +
  admin consent가 있어야 토큰이 통과한다. 게스트 권한으로는 절대 처리할 수 없고,
  `toyotamotor.co.kr` 테넌트 관리자(IT팀)만 할 수 있는 작업이다.

### 실서비스 전환 시 IT팀에 요청할 것

1. `toyotamotor.co.kr`(68cfa2f3) 테넌트에 이 웹앱용 Azure AD 앱 등록 생성
   (또는 기존 로그인 앱을 이 테넌트로 재등록). Redirect URI는 운영 도메인으로 등록.
2. 그 앱 등록에 API permissions → **Power BI Service** → Delegated → `Report.Read.All` 추가 +
   **admin consent** 처리
3. 실사용자(Toyota 직원) 계정들이 해당 Power BI 워크스페이스에 **Viewer 이상** 권한 보유
4. 새로 발급된 clientId를 받아 `.env`에 반영:
   - `VITE_AZURE_AD_CLIENT_ID=<새 clientId>`
   - `VITE_AZURE_AD_TENANT_ID=68cfa2f3-dc5c-424d-974c-78ef6863fe9d`
   - `VITE_POWERBI_GROUP_ID=<리포트가 속한 워크스페이스 ID>` (Fabric 포털 URL의 `/groups/<groupId>/reports/...`에서 확인)
   - `VITE_POWERBI_REPORT_ID`는 기존 값(`244c5f1a-f42b-4b9b-a5e1-277573956470`) 그대로 사용 가능

### 위 조건이 충족되면 할 일 (코드는 이미 준비되어 있음)

[App.jsx](src/App.jsx)에서 `KtwsBi` import를 `Bi.jsx` 대신 `BiSso.jsx`로 바꾸기만 하면 된다.

```diff
- import KtwsBi from './pages/ktws/Bi'
+ import KtwsBi from './pages/ktws/BiSso'
```

`BiSso.jsx`는 이미 로그인된 MSAL 세션에서 Power BI API 토큰을 조용히(팝업 없이) 받아
`powerbi-client-react`로 직접 임베드하므로, 별도 BI 로그인 없이 웹 로그인 계정으로 바로 뜬다.
