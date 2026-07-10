# Toyota / Lexus Data Dashboard

## AI 대시보드 커스터마이징 파이프라인 (KTWS 대시보드 커스텀 페이지)

`KTWS > 대시보드 커스텀`([src/pages/ktws/Custom.jsx](src/pages/ktws/Custom.jsx))은 사용자가
오른쪽 상단 챗봇 버튼으로 자연어를 입력하면 AI가 위젯(차트/KPI카드/표)을 대시보드에
추가·삭제·수정해주는 파일럿 페이지다. 다른 12개 페이지는 여전히 정적 하드코딩 JSX이며,
이 기능은 이 페이지 하나에만 적용되어 있다.

### 파이프라인 단계

```
사용자 요청 → 의도 분류 → 현재 대시보드 JSON 상태 읽기 → metric/semantic layer 매핑
→ SQL 생성 → 차트 스펙 생성 → 레이아웃 patch 생성 → 검토 에이전트 → React 대시보드 반영
```

실제 구현은 위 9단계를 **Azure OpenAI 호출 2번 + 결정론적 JS 함수 5개**로 압축했다 — LLM이
차트에 들어갈 숫자를 지어낼 수 있는 경로를 원천 차단하기 위함이다.

| 단계 | 구현 | 위치 |
|---|---|---|
| 의도 분류 + 상태 읽기 + metric 매핑 | LLM 호출 #1 (tool-calling) | [server/dashboardPipeline.js](server/dashboardPipeline.js), [server/dashboardTools.js](server/dashboardTools.js) |
| SQL 생성 | 결정론적 (표시용, **미실행**) | [server/semanticCatalog.js](server/semanticCatalog.js) `buildSqlForMetric()` |
| 차트 스펙 생성 | 결정론적 — 실제 데이터는 `public/data/*.json`에서만 채움 | [server/widgetSchema.js](server/widgetSchema.js) `buildWidgetProps()` |
| 레이아웃 patch 생성 | 결정론적 | [server/dashboardPipeline.js](server/dashboardPipeline.js) |
| 검토 에이전트 | LLM 호출 #2 (별도 tool-calling) — 형식적 검증은 이미 끝난 상태에서 "요청 의도에 부합하는가"만 판단 | [server/dashboardTools.js](server/dashboardTools.js) `buildReviewTools()` |
| React 대시보드 반영 | 서버는 미리보기만 반환. **사용자가 "적용" 버튼을 눌러야** 실제 반영됨 | [src/components/PatchPreviewCard.jsx](src/components/PatchPreviewCard.jsx), [src/context/DashboardStateContext.jsx](src/context/DashboardStateContext.jsx) |

SQL 생성 단계는 `louis/docs/DB정의서_*.md`와 `generate_data.py`에 나온 실제 웨어하우스
테이블/컬럼명(`karete_co_vehic`, `karete_om_contract`, `agora_svc_propo` 등)을 근거로
진짜처럼 보이는 SQL 문자열을 만들어 채팅에 보여주지만, **절대 실행되지 않는다** — 이 앱은
실시간 DB 연결이 없고, 실제 차트 데이터는 항상 `public/data/inventory.json` /
`contract.json` / `coupon.json`(오프라인에서 미리 집계된 실데이터)에서 가져온다.

### 지표(semantic layer) 확장하기

새 지표를 추가하려면 [server/semanticCatalog.js](server/semanticCatalog.js)의
`METRIC_CATALOG`에 항목을 하나 추가하면 된다 (`dataset`/`jsonPath`로 실제 데이터 위치를,
`sqlHint`로 표시용 SQL 근거를 지정). 별도의 코드 변경 없이 Planner 프롬프트와 검증 로직에
자동으로 반영된다.

### 롤백(Undo/Redo)

적용된 변경은 브라우저에 풀 스냅샷 스택으로 저장된다(diff 역연산 아님 — 위젯 개수가
적어서 스냅샷 비용이 무시할 만하고, 구현이 훨씬 단순·안전하다). `localStorage` 키
`toyota_dashboard_layout_ktws_custom`에 저장되어 새로고침 후에도 유지된다. 페이지 상단
"실행 취소"/"다시 실행" 버튼, 또는 채팅의 "적용됨 · 실행취소" 링크로 되돌릴 수 있다.

### 다른 페이지로 확장하려면

1. 대상 페이지를 [src/context/DashboardStateContext.jsx](src/context/DashboardStateContext.jsx)처럼
   `localStorage` 키를 페이지별로 분리하도록 일반화(현재는 KTWS 커스텀 페이지 하나로 고정됨)
2. [src/App.jsx](src/App.jsx)의 `pageKey` 계산에 해당 라우트 추가
3. 필요한 지표가 `METRIC_CATALOG`에 없다면 추가

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
