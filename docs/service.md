# Toyota / Lexus Data Dashboard

## AI 대시보드 커스터마이징 파이프라인 (KTWS 대시보드 커스텀 페이지)

`KTWS > 대시보드 커스텀`([frontend/src/pages/ktws/Custom.jsx](frontend/src/pages/ktws/Custom.jsx))은 사용자가
오른쪽 상단 챗봇 버튼으로 자연어를 입력하면 AI가 위젯(차트/KPI카드/표)을 대시보드에
추가·삭제·수정해주는 파일럿 페이지다. 다른 12개 페이지는 여전히 정적 하드코딩 JSX이며,
이 기능은 이 페이지 하나에만 적용되어 있다.

> **2026-07-13 업데이트**: 이 파이프라인은 이제 `frontend/public/data/*.json`이 아니라 **Fabric 데이터
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
| 의도 분류 + 상태 읽기 + 주제(topic) 매핑 | LLM 호출 #1 (tool-calling, 11개 주제 중 선택) | [backend/dashboardPipeline.js](backend/dashboardPipeline.js), [backend/dashboardTools.js](backend/dashboardTools.js) `buildDashboardTools()` |
| 관련 테이블 스키마 로드 | 결정론적 — 전체 187개 테이블 중 그 주제에 연결된 1~3개만 온디맨드 로드 | [backend/schemaLoader.js](backend/schemaLoader.js) `loadTablesForTopic()` |
| SQL 생성 + 차트 스펙 | LLM 호출 #2 (tool-calling) — 실제 실행될 T-SQL SELECT와 차트 타입/컬럼 매핑을 함께 작성 | [backend/dashboardTools.js](backend/dashboardTools.js) `buildWidgetQueryTools()` |
| **Fabric에 라이브 실행** | 결정론적 — `SELECT`/`WITH` 아닌 쿼리는 거부 | [backend/fabricClient.js](backend/fabricClient.js) `queryFabric()` |
| 위젯 props 구성 | 결정론적 — 실제 쿼리 결과 행을 render_* prop 모양으로 변환 | [backend/widgetSchema.js](backend/widgetSchema.js) `buildWidgetPropsFromRows()` |
| 레이아웃 patch 생성 | 결정론적 | [backend/dashboardPipeline.js](backend/dashboardPipeline.js) |
| 검토 에이전트 | LLM 호출 #3 (별도 tool-calling) — 형식적 검증은 이미 끝난 상태에서 "요청 의도에 부합하는가"만 판단 | [backend/dashboardTools.js](backend/dashboardTools.js) `buildReviewTools()` |
| React 대시보드 반영 | 서버는 미리보기만 반환. **사용자가 "적용" 버튼을 눌러야** 실제 반영됨 | [frontend/src/components/PatchPreviewCard.jsx](frontend/src/components/PatchPreviewCard.jsx), [frontend/src/context/DashboardStateContext.jsx](frontend/src/context/DashboardStateContext.jsx) |

SQL은 이제 표시용이 아니라 **실제로 Agora/Karete/BP_KTWS Fabric 엔드포인트에 실행된다**
(`backend/fabricClient.js`, Azure AD 비밀번호 인증 — 자격 증명 위치는 `.env.example` 참고).
사용 가능한 테이블/컬럼은 `backend/schema/`(187개 실업무 테이블, gitignore — 사내정보)로 제한되며,
그 스키마의 출처와 생성 방식은 아래 "웨어하우스 시맨틱 스키마" 절 참고.

### 주제(topic) 확장하기

새 주제나 테이블을 추가하려면 `backend/schema/index.yaml`의 `topics` 섹션에 항목을 추가하면
된다(`backend/schemaLoader.js`가 이 파일을 로드한다). 별도의 코드 변경 없이 Planner 프롬프트와
검증 로직에 자동으로 반영된다. 스키마 자체(테이블/컬럼 목록)를 다시 생성하려면
`louis/docs/정의서/DB정의서_*.md`를 갱신한 뒤 그로부터 `backend/schema/`를 재생성해야 한다.

### 롤백(Undo/Redo)

적용된 변경은 브라우저에 풀 스냅샷 스택으로 저장된다(diff 역연산 아님 — 위젯 개수가
적어서 스냅샷 비용이 무시할 만하고, 구현이 훨씬 단순·안전하다). `localStorage` 키
`toyota_dashboard_layout_ktws_custom`에 저장되어 새로고침 후에도 유지된다. 페이지 상단
"실행 취소"/"다시 실행" 버튼, 또는 채팅의 "적용됨 · 실행취소" 링크로 되돌릴 수 있다.

### 다른 페이지로 확장하려면

1. 대상 페이지를 [frontend/src/context/DashboardStateContext.jsx](frontend/src/context/DashboardStateContext.jsx)처럼
   `localStorage` 키를 페이지별로 분리하도록 일반화(현재는 KTWS 커스텀 페이지 하나로 고정됨)
2. [frontend/src/App.jsx](frontend/src/App.jsx)의 `pageKey` 계산에 해당 라우트 추가
3. 필요한 테이블/주제가 `backend/schema/`에 없다면 추가

### 위젯 그리드 레이아웃 (react-grid-layout)

위젯 크기/배치는 [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
(`v2`, `react-grid-layout/legacy` — v1 호환 API로 import)이 담당한다. 예전에는 각 위젯이
`weight`(같은 줄 안에서의 상대 너비)와 `height`(자유 px)만 가져서, 위젯이 서로 다른 높이로
시작하거나 자유롭게 2D 배치되는 걸 표현할 수 없었다. 지금은 12칸 고정 컬럼 그리드 위에서
위젯마다 `left`/`top`/`right`/`bottom`(칸/행 인덱스)으로 위치를 저장한다.

| 항목 | 위치 |
|---|---|
| 그리드 상수(`GRID_COLS`, `ROW_HEIGHT` 등) + AI 크기 프리셋(sm/md/lg) ↔ 칸수 매핑, 위젯→layout item 변환 | [frontend/src/utils/gridLayout.js](frontend/src/utils/gridLayout.js) — 브라우저와 Node 서버 양쪽에서 import(`applyDashboardPatch.js`와 같은 공유 패턴) |
| 실제 그리드 렌더링(리사이즈 핸들, 커밋 타이밍) | [frontend/src/components/WidgetGrid.jsx](frontend/src/components/WidgetGrid.jsx) |
| 리사이즈 결과를 위젯 상태에 반영 | [frontend/src/pages/ktws/Custom.jsx](frontend/src/pages/ktws/Custom.jsx) `commitLayout()` |

- **리사이즈**: 각 위젯 오른쪽 아래 모서리만 드래그 가능(`resizeHandles: ['se']`). KPI 카드
  위젯은 리사이즈 비활성.
- **빈 칸 자동 채움**: `compactType="vertical"` — 위젯을 줄이거나 지우면 아래 위젯들이 자동으로
  위로 당겨져 세로 방향 빈 공간이 남지 않는다. (가로 방향 빈 공간은 자동으로 채워지지 않음 —
  같은 줄 옆 위젯을 직접 늘려야 한다.)
- **저장 타이밍**: 드래그 도중 매 프레임 저장하지 않는다 — 놓았을 때(`onResizeStop`)만
  서버에 커밋된다.
- **레거시 마이그레이션**: `weight`/`height`만 있고 좌표가 없는 옛 저장본은 렌더링 시
  임시로 맨 아래(`y=BOTTOM` 센티널)에 놓이고, 수직 압축이 알아서 첫 빈 자리로 끌어올린다.
  그 결과가 그대로 커밋되면서 `weight`/`height`가 새 좌표로 교체된다 — 한 번 렌더링되면
  자동으로 새 스키마로 정착. AI가 새로 추가하는 위젯도 같은 경로(`sizeHint`만 들고 좌표 없이
  생성 → 첫 렌더링에서 배치)를 탄다.
- **알려진 제약**: `propose_reorder_widgets`(AI의 "순서 변경" 요청)는 위젯 배열 순서만
  바꾸는데, 2D 그리드에서는 각 위젯이 명시적 좌표를 가지므로 배열 순서가 화면 위치에
  영향을 주지 않는다 — 사실상 시각적으로는 no-op. 자유 배치 그리드에서는 애초에
  "N번째로 이동" 개념 자체가 잘 안 맞아서 지금은 그대로 둔 상태.

`vite.config.js`에 `define: { 'process.env': {} }`가 있는데, 이건 이 그리드 기능의
의존성인 `react-draggable`이 브라우저에 없는 `process.env.DRAGGABLE_DEBUG`를 참조해서
드래그 시작 시 `process is not defined`로 죽는 걸 막기 위함이다(Vite는 `process.env.NODE_ENV`만
기본으로 치환해준다). 이후 다른 패키지도 `process.env.*`를 브라우저에서 참조하면 이 설정
덕분에 함께 막힌다.

## Text2SQL: RAG 우선 + TOPIC 폴백 (rag-poc/)

프로덕션 챗봇의 Text2SQL은 **[backend/rag-poc/](backend/rag-poc/)의 Pattern Card / SQL
Fragment 기반 RAG 파이프라인을 우선 시도**하고, Pattern Card가 매칭되지 않거나 실행 검증에
실패하면 기존 `backend/schemaLoader.js` + `backend/warehouseTools.js`의 **TOPIC 분류 방식**으로
폴백하는 하이브리드 구조다. `backend/warehousePipeline.js`(`/api/warehouse-query`)와
`backend/chatHandler.js`(`/api/chat`의 `fetchLiveTopicData`) 두 경로 모두 이렇게 동작한다.

GOLD 검증된 15개 측정값 기준 RAG 93%(14~15/15) vs TOPIC 53~60%(8~9/15)로 정확도 차이가 커서
RAG를 우선 경로로 채택했다(지연시간은 RAG가 더 길다 — 평균 8.6초 vs 6.7초). RAG는 51개
Pattern Card(2026-07-21 기준)로 커버되는 범위만 다루므로, TOPIC 폴백이 그 밖의 질문에 대한
기존 커버리지를 그대로 유지한다. 설계 배경, 10-Stage 구조, 참고 논문, 테스트 결과는
[backend/rag-poc/README.md](backend/rag-poc/README.md)와
[backend/rag-poc/test-report.md](backend/rag-poc/test-report.md) 참고.

## Agentic BI (`/ktws/agentic-bi`) — 세 갈래 경로

`/api/agentic-bi-ask` 하나가 질문에 따라 세 경로 중 하나로 답한다. 어느 경로로 갔는지는
채팅의 디버그 패널(또는 `npm run dev` 터미널)의 `Compiled SQL (...)` 라벨로 확인한다.

| 경로 | 언제 | 어디서 값이 나오나 |
|---|---|---|
| **인증 리포트** | 여러 지표를 모은 완성된 표, 합계·전체 계층, 건별 명세 | `backend/reports/sql/*.sql` 확정 SQL 20종을 그대로 실행 |
| **GOLD 파생** | 퍼널 지표 하나를 물었을 때 | 퍼널 GOLD의 CTE를 뽑아 `GROUP BY`만 요청 grain으로 |
| **기존 컴파일러** | 위 둘로 답할 수 없을 때(여러 달 추이, GOLD에 없는 축) | `agentic-bi/semantic/metrics/*.yaml` → `compiler.js` |

### 왜 인증 리포트를 따로 두나

퍼널 GOLD는 지표 11개를 계산하는 SQL 모음이 아니라 **하나의 리포트 프로그램**이다. 계약 목표는
활동유형보다 상위 grain에서 계산돼 상세 행마다 반복되고, 합계 행에서만 `sc_first=1`로 중복이
제거된다. 이 규칙이 SQL 안에만 있어서 애플리케이션이 손대는 순간 숫자가 틀어진다.

그래서 SQL을 분해하지 않고 등록해 그대로 돌린다. LLM은 `report_id`와 파라미터만 고르고,
툴 스키마에 SQL 필드가 아예 없다. 계약(`reports/contracts/*.yaml`)에 SQL 해시를 박아 실행
직전 대조하므로 본문 바꿔치기가 불가능하다.

### 컬럼마다 집계 규칙이 다르다

`column_semantics`에 선언한다. **그냥 더하면 안 되는 컬럼이 많다.**

| 타입 | 뜻 | 그냥 더하면 |
|---|---|---|
| `additive` | 행 단위 값 | 정상 |
| `distinct_count` | `COUNT(DISTINCT)` — 한 건이 여러 단계에 걸침 | 총계에 **못 미침** (기회 8,655 vs 8,728) |
| `repeated_higher_grain_value` | 상위 grain 값이 행마다 반복 | **부풀어짐** (타겟 233,429 vs 12,338) |
| `separate_total_cte` | 상세용/합계용 CTE가 따로 있어 복구 불가 | 8배 (계약 목표 4,688 vs 586) |

복구 불가한 컬럼은 `funnelDerived/`가 GOLD를 그 grain으로 다시 돌려 채운다
(`forReportView.js`). 채운 값은 **리포트 합계 행과 대조**해 어긋나면 쓰지 않는다.

### 실행·검증

```bash
npm run test            # 오프라인 테스트 (라이브 DB 불필요)
npm run llm:check       # LLM 처리 검증 — 인-프로세스, 라이브 DB 필요
npm run llm:check:http  # 실행 중인 dev 서버(5173)의 실제 엔드포인트로
```

`llm:check`는 같은 질문을 여러 번 돌려 **경로·값·grain·일관성**을 함께 본다. LLM이 끼어 있어
한 번 통과는 근거가 약하고, 실행마다 경로가 갈리면 같은 질문에 다른 형태의 답이 나가기 때문이다.

`--http`가 따로 있는 이유: vite 미들웨어가 import한 서버 모듈은 프로세스가 사는 동안 캐시된다.
**"테스트는 통과하는데 브라우저는 옛 코드"**인 상태가 실제로 있었고, 인-프로세스 실행으로는
잡히지 않는다. 서버 코드를 고쳤으면 dev 서버를 재시작해야 한다.

화면을 눈으로 확인할 때 쓰는 프롬프트 목록은
[backend/agentic-bi/테스트-프롬프트.md](backend/agentic-bi/테스트-프롬프트.md)에 있다 —
기댓값, 알려진 약점, 자동 검증이 못 보는 항목이 함께 적혀 있다.

## KTWS BI 임베드 — 프로덕션 전환 시 처리할 것

현재 `KTWS > BI` 메뉴([frontend/src/pages/ktws/Bi.jsx](frontend/src/pages/ktws/Bi.jsx))는 Power BI/Fabric의
`autoAuth=true` iframe으로 리포트를 띄우고 있다. 이 방식은 웹 로그인(MSAL)과 완전히 별개의
로그인 세션이라 브라우저 쿠키 정책(서드파티 쿠키 차단)에 따라 BI에서 별도 로그인 창이 뜰 수 있다.

### 왜 지금 SSO(진짜 로그인 공유)로 안 되어 있는가

- 리포트가 있는 실제 테넌트: `00000000-0000-0000-0000-000000000000` (`toyotamotor.co.kr`)
- 지금 웹 로그인에 쓰는 Azure AD 앱 등록(`toyota_ms_login_test`, clientId `dcb26049-...`)은
  테스트 테넌트(`00000000-0000-0000-0000-000000000001`) 소속
- 지금 테스트 계정은 `toyotamotor.co.kr` 테넌트에 **게스트**로 초대되어 리포트 뷰어 권한만 있고,
  Azure Portal의 App registration / admin consent 같은 관리자 기능은 접근 불가
- `powerbi-client` SDK로 토큰을 직접 발급해서 꽂는 방식([frontend/src/pages/ktws/BiSso.jsx](frontend/src/pages/ktws/BiSso.jsx),
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
   - `VITE_AZURE_AD_TENANT_ID=00000000-0000-0000-0000-000000000000`
   - `VITE_POWERBI_GROUP_ID=<리포트가 속한 워크스페이스 ID>` (Fabric 포털 URL의 `/groups/<groupId>/reports/...`에서 확인)
   - `VITE_POWERBI_REPORT_ID`는 기존 값(`00000000-0000-0000-0000-000000000003`) 그대로 사용 가능

### 위 조건이 충족되면 할 일 (코드는 이미 준비되어 있음)

[App.jsx](frontend/src/App.jsx)에서 `KtwsBi` import를 `Bi.jsx` 대신 `BiSso.jsx`로 바꾸기만 하면 된다.

```diff
- import KtwsBi from './pages/ktws/Bi'
+ import KtwsBi from './pages/ktws/BiSso'
```

`BiSso.jsx`는 이미 로그인된 MSAL 세션에서 Power BI API 토큰을 조용히(팝업 없이) 받아
`powerbi-client-react`로 직접 임베드하므로, 별도 BI 로그인 없이 웹 로그인 계정으로 바로 뜬다.
