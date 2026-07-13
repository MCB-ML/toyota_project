# Toyota / Lexus Data Dashboard

## AI 대시보드 커스터마이징 파이프라인 (KTWS 대시보드 커스텀 페이지)

`KTWS > 대시보드 커스텀`([src/pages/ktws/Custom.jsx](src/pages/ktws/Custom.jsx))은 사용자가
오른쪽 상단 챗봇 버튼으로 자연어를 입력하면 AI가 위젯(차트/KPI카드/표)을 대시보드에
추가·삭제·수정해주는 파일럿 페이지다. 다른 12개 페이지는 여전히 정적 하드코딩 JSX이며,
이 기능은 이 페이지 하나에만 적용되어 있다.

> **2026-07-13 업데이트**: 이 파이프라인은 이제 `public/data/*.json`이 아니라 **Fabric 데이터
> 웨어하우스에 실제로 라이브 쿼리를 실행**해서 차트 데이터를 가져온다. 아래 내용은 최신 구조 기준.

### 파이프라인 단계

```
사용자 요청 → 의도 분류(주제 매핑) → 현재 대시보드 JSON 상태 읽기 → 관련 테이블 스키마 로드
→ SQL 생성 + 차트 스펙 생성(LLM이 실제 SELECT 작성) → Fabric에 라이브 실행
→ 레이아웃 patch 생성 → 검토 에이전트 → React 대시보드 반영
```

실제 구현은 **Azure OpenAI 호출 3번 + 결정론적 JS 함수**로 이뤄진다 — LLM은 항상 테이블/컬럼
"이름"만 고르고, 숫자 자체는 항상 Fabric 쿼리 실행 결과에서만 나온다(LLM이 숫자를 지어낼 채널이
구조적으로 없음).

| 단계 | 구현 | 위치 |
|---|---|---|
| 의도 분류 + 상태 읽기 + 주제(topic) 매핑 | LLM 호출 #1 (tool-calling, 11개 주제 중 선택) | [server/dashboardPipeline.js](server/dashboardPipeline.js), [server/dashboardTools.js](server/dashboardTools.js) `buildDashboardTools()` |
| 관련 테이블 스키마 로드 | 결정론적 — 전체 187개 테이블 중 그 주제에 연결된 1~3개만 온디맨드 로드 | [server/schemaLoader.js](server/schemaLoader.js) `loadTablesForTopic()` |
| SQL 생성 + 차트 스펙 | LLM 호출 #2 (tool-calling) — 실제 실행될 T-SQL SELECT와 차트 타입/컬럼 매핑을 함께 작성 | [server/dashboardTools.js](server/dashboardTools.js) `buildWidgetQueryTools()` |
| **Fabric에 라이브 실행** | 결정론적 — `SELECT`/`WITH` 아닌 쿼리는 거부 | [server/fabricClient.js](server/fabricClient.js) `queryFabric()` |
| 위젯 props 구성 | 결정론적 — 실제 쿼리 결과 행을 render_* prop 모양으로 변환 | [server/widgetSchema.js](server/widgetSchema.js) `buildWidgetPropsFromRows()` |
| 레이아웃 patch 생성 | 결정론적 | [server/dashboardPipeline.js](server/dashboardPipeline.js) |
| 검토 에이전트 | LLM 호출 #3 (별도 tool-calling) — 형식적 검증은 이미 끝난 상태에서 "요청 의도에 부합하는가"만 판단 | [server/dashboardTools.js](server/dashboardTools.js) `buildReviewTools()` |
| React 대시보드 반영 | 서버는 미리보기만 반환. **사용자가 "적용" 버튼을 눌러야** 실제 반영됨 | [src/components/PatchPreviewCard.jsx](src/components/PatchPreviewCard.jsx), [src/context/DashboardStateContext.jsx](src/context/DashboardStateContext.jsx) |

SQL은 이제 표시용이 아니라 **실제로 Agora/Karete/BP_KTWS Fabric 엔드포인트에 실행된다**
(`server/fabricClient.js`, Azure AD 비밀번호 인증 — 자격 증명 위치는 `.env.example` 참고).
사용 가능한 테이블/컬럼은 `server/schema/`(187개 실업무 테이블, gitignore — 사내정보)로 제한되며,
그 스키마의 출처와 생성 방식은 아래 "웨어하우스 시맨틱 스키마" 절 참고.

### 주제(topic) 확장하기

새 주제나 테이블을 추가하려면 `server/schema/index.yaml`의 `topics` 섹션에 항목을 추가하면
된다(`server/schemaLoader.js`가 이 파일을 로드한다). 별도의 코드 변경 없이 Planner 프롬프트와
검증 로직에 자동으로 반영된다. 스키마 자체(테이블/컬럼 목록)를 다시 생성하려면
`louis/docs/정의서/DB정의서_*.md`를 갱신한 뒤 그로부터 `server/schema/`를 재생성해야 한다.

### 롤백(Undo/Redo)

적용된 변경은 브라우저에 풀 스냅샷 스택으로 저장된다(diff 역연산 아님 — 위젯 개수가
적어서 스냅샷 비용이 무시할 만하고, 구현이 훨씬 단순·안전하다). `localStorage` 키
`toyota_dashboard_layout_ktws_custom`에 저장되어 새로고침 후에도 유지된다. 페이지 상단
"실행 취소"/"다시 실행" 버튼, 또는 채팅의 "적용됨 · 실행취소" 링크로 되돌릴 수 있다.

### 다른 페이지로 확장하려면

1. 대상 페이지를 [src/context/DashboardStateContext.jsx](src/context/DashboardStateContext.jsx)처럼
   `localStorage` 키를 페이지별로 분리하도록 일반화(현재는 KTWS 커스텀 페이지 하나로 고정됨)
2. [src/App.jsx](src/App.jsx)의 `pageKey` 계산에 해당 라우트 추가
3. 필요한 테이블/주제가 `server/schema/`에 없다면 추가

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
