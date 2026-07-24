# MCB-ML-toyota_project

MCB_토요타 고객사 프로젝트: 데이터 분석/예측 웹사이트

주요 작업 위치는 [`louis/dashboard`](louis/dashboard) (React 대시보드 웹앱)이며, 아래는 그 웹사이트의
현재 개발 현황과 AI 챗봇 아키텍처 요약이다. 세부 구현 노트는 [`louis/dashboard/README.md`](louis/dashboard/README.md) 참고.

## 웹사이트 개발 진행상황

### 완료됨
- **로그인/권한**: MS 로그인(MSAL) → 본사/딜러사 계정 선택 → 딜러사 계정은 본인 데이터만 조회 가능하도록 필터링
- **대시보드 페이지 13개**: 계약/출고 관리, 카드결제 관리, 재고관리, KPI 분석(Sales) · FMS 쿠폰관리(Service) ·
  VOC 분석/네트워크·PMA/딜러 재무(FVD) · 계약·재고 매칭/일별 타겟 분배(DSD) · BI/대시보드 커스텀(KTWS)
- **사이드바**: 접기/펼치기, 부서별 메뉴 그룹
- **AI 어시스턴트 전체 페이지**(`/`): 자연어 질문에 차트/표를 자동 생성해 답변
- **전 페이지 플로팅 챗봇 버튼**: AI 어시스턴트 페이지를 제외한 모든 페이지 우측 상단에 노출
- **KTWS 대시보드 커스텀 페이지**: 챗봇에게 자연어로 요청하면 **Fabric 웨어하우스에 실제로
  라이브 SQL을 실행**해 위젯(차트/KPI카드/표)을 추가·삭제·수정 — 미리보기 후 적용, 실행취소/
  다시실행 지원 (파일럿, 이 페이지에만 적용됨)
- **위젯 자유 리사이즈 + 유저별 저장**: 위젯을 가로/세로 자유 드래그로 크기 조절(간섭되는
  옆 위젯은 자동으로 크기가 맞춰짐), 로그인 계정별로 로컬 Postgres에 레이아웃 저장 —
  다른 계정으로 로그인하면 각자 자신의 레이아웃만 보임 (아래 [유저별 대시보드 레이아웃
  저장](#유저별-대시보드-레이아웃-저장-로컬-postgres) 참고)
- **Fabric 데이터 웨어하우스 실시간 연결**: Agora/Karete/BP_KTWS 3개 엔드포인트에 Azure AD 인증으로
  접속, LLM이 자연어 질문을 실제 SQL로 변환해 라이브 조회하는 백엔드 파이프라인 완성 —
  KTWS 대시보드 커스텀 페이지와 별도의 `/api/warehouse-query`(백엔드만, UI 미연결) 둘 다에서 사용
- **KTWS Power BI 리포트 임베드**: 현재는 iframe 방식이라 별도 로그인 필요 (SSO 전환은 IT팀의
  Azure AD 앱 등록 필요 — 코드는 준비됨, 상세는 `dashboard/README.md`)
- **Text2SQL RAG 파이프라인 (프로덕션)**: `/api/chat`, `/api/dashboard-customize`,
  `/api/warehouse-query` 세 곳 모두 우선 시도하는 10단계 Pattern Card/Fragment 기반 RAG —
  자세한 내용은 아래 "RAG(Text2SQL) vs Agentic BI 비교" 섹션 참고
- **KTWS Agentic BI 페이지** (`/ktws/agentic-bi`, 실험 배지): RAG와 별도로, YAML로 정의한
  지표/차원 카탈로그(Semantic Layer) 안에서만 답하는 두 번째 자연어 파이프라인 — 실제 라이브
  Power BI DAX 측정값과 대조 검증 완료, `toyota-test-web`에 배포됨

### 진행 중 / 남은 것
- AI 대시보드 커스터마이징 기능은 KTWS 1개 페이지에만 적용 — 나머지 12개 페이지는 정적 하드코딩 JSX
- `/api/warehouse-query`(자유 질문형 라이브 쿼리)는 백엔드까지만 완성 — 채팅 UI에는 아직 연결 안 됨
  (KTWS 대시보드 커스텀 페이지의 위젯 생성 파이프라인과는 별개 엔드포인트)
- Power BI SSO는 IT팀의 Azure AD 앱 등록·admin consent 대기 중
- 위젯 실행취소/다시실행 이력은 브라우저 메모리에만 있음 — 레이아웃 자체는 Postgres에
  저장되지만, 새로고침하면 되돌리기 이력만 초기화됨(레이아웃 내용은 그대로 유지)

## 대시보드 생성 챗봇 아키텍처

서로 다른 데이터 소스를 쓰는 **3개의 독립된 파이프라인**이 있다:

| 엔드포인트 | 용도 | 데이터 소스 | UI 연결 |
|---|---|---|---|
| `/api/chat` | AI 어시스턴트 전체 페이지 — 일반 Q&A + 차트 자동 생성 | `public/data/*.json` (사전 집계) | 연결됨 |
| `/api/dashboard-customize` | KTWS 대시보드 커스텀 페이지 — 위젯 추가/삭제/수정 | **Fabric SQL 엔드포인트 (실시간)** | 연결됨 |
| `/api/warehouse-query` | 자유 질문형 라이브 쿼리 (챗봇 화면 없음) | **Fabric SQL 엔드포인트 (실시간)** | 미연결 (백엔드만) |
| `/api/agentic-bi-ask` | KTWS Agentic BI 페이지(실험) — 등록된 지표만 답변 | **Fabric SQL 엔드포인트 (실시간)**, Text2SQL이 아니라 Semantic Layer 컴파일 | 연결됨 |

### 데이터 흐름 — 두 갈래

```
louis/data/*.parquet ──(오프라인, generate_data.py)──▶ public/data/*.json ──▶ /api/chat

Fabric SQL 엔드포인트(Agora/Karete/BP_KTWS) ──(server/fabricClient.js, 실시간)──▶ /api/dashboard-customize, /api/warehouse-query
```

`/api/chat`만 미리 집계해둔 JSON 스냅샷을 본다 — 원본이 바뀌어도 `generate_data.py`를 다시
돌리기 전엔 반영되지 않는다. `/api/dashboard-customize`와 `/api/warehouse-query`는 둘 다 매
요청마다 실제 웨어하우스를 조회한다.

### 라이브 쿼리 공통 구조 — 의도 분류 → 온디맨드 스키마 로드 → 실행

`/api/dashboard-customize`와 `/api/warehouse-query` 둘 다 아래 패턴을 공유한다:

```
질문 → 의도 분류(11개 주제 중 하나로 분류) → 관련 테이블만 온디맨드 로드 → LLM이 실제 SELECT 작성
→ fabricClient.js로 Fabric에 실행 → 결과 반환(dashboard-customize는 위젯으로, warehouse-query는 표로)
```

- **의도 분류**: 187개 테이블 전체를 매번 프롬프트에 넣으면 토큰이 지나치게 커서(~15만 토큰),
  먼저 11개 주제(계약현황/차량재고/정비서비스실적/FMS쿠폰/딜러마스터/부품재고/판매목표/
  딜러재무/모델마스터/날짜캘린더/HR인사) 중 하나로 분류한 뒤 그 주제에 연결된 테이블 1~3개만 로드
- **시맨틱 스키마**: `louis/docs/정의서/DB정의서_*.md`(실제 DB 스캔 + 엑셀 정의서 병합, 한글 설명
  추가)에서 실업무 테이블만 187개로 추려 `server/schema/index.yaml`(상시 로드, ~350토큰) +
  `server/schema/tables/*.yaml`(테이블별 상세, 온디맨드)로 재구성 — 둘 다 사내 정보라 gitignore
- **실행**: `server/fabricClient.js`가 Azure AD 비밀번호 인증으로 3개 Fabric 엔드포인트에 접속,
  `SELECT`/`WITH` 아닌 쿼리는 차단
- **차이점**: `dashboard-customize`는 여기에 더해 위젯 반영을 위한 patch 생성 + 검토 에이전트
  단계가 있고, "적용" 버튼을 눌러야 실제 화면에 반영된다(자세한 단계별 구현 위치는
  [`louis/dashboard/README.md`](louis/dashboard/README.md#ai-대시보드-커스터마이징-파이프라인-ktws-대시보드-커스텀-페이지)
  참고). `warehouse-query`는 결과를 그대로 반환할 뿐 반영 개념이 없다.

## RAG(Text2SQL) vs Agentic BI 비교

`/api/chat`·`/api/dashboard-customize`·`/api/warehouse-query`가 쓰는 **RAG(Text2SQL)**과, KTWS
Agentic BI 페이지(`/api/agentic-bi-ask`)가 쓰는 **Agentic BI**는 둘 다 "자연어 질문 → Fabric SQL
실행 → 답변"을 하지만, SQL을 만드는 방식 자체가 근본적으로 다른 별개의 파이프라인이다. 서로를
대체하지 않고 각자 다른 트레이드오프로 병행 운영 중이다.

### RAG(Text2SQL) — `server/rag-poc/pipeline.js`

과거에 검증된 SQL 예시(GOLD SQL)들을 "Pattern Card"와 재사용 가능한 SQL 조각("Fragment")으로
미리 인덱싱해두고, 질문이 들어오면 임베딩 유사도로 가장 가까운 패턴을 찾아 조립하는 **검색 기반**
접근이다. 10단계로 구성:

```
구조화(Stage0) → 스키마 검색(Stage1) → 패턴카드 검색(Stage2) → 패턴 선택(Stage3)
→ GROUP_DIM 차원 치환(Stage3.5) → Fragment 해석(Stage4) → 테이블 백필(Stage5)
→ 규칙/용어집 검색(Stage6) → 스텝별 SQL 생성(Stage7, LLM) → SQL 조합(Stage8)
→ 구조 검증 + 라이브 Fabric 재검증/자동수정(Stage9~10)
```

- **커버리지가 넓다**: Pattern Card/Fragment 라이브러리만 계속 늘리면 새 질문 유형에 대응 가능 —
  187개 테이블 전체를 아우르는 범용 질문에 쓰임 (계약/재고/정비/쿠폰/딜러재무/HR 등 11개 주제).
- **SQL 생성에 LLM이 관여**(Stage7) — Fragment 조합은 결정론적이지만 스텝별 SQL 자체는
  LLM이 쓰기 때문에, Stage9~10의 라이브 실행 재검증이 정확성의 마지막 방어선이다.
- 정확도는 Pattern Card 매칭 품질에 좌우된다 — 매칭되는 패턴이 없으면 TOPIC 기반 폴백으로
  넘어간다(`server/rag-poc/test-report.md` 기준 RAG 14~15/15 vs TOPIC 8~9/15).

### Agentic BI — `server/agentic-bi/` + `server/agenticBiPipeline.js`

반대로 **"지표 카탈로그에서 고르기"** 접근이다. `server/agentic-bi/semantic/metrics/*.yaml`에
등록된 지표(계약/출고 실적·목표·달성률·PMA IN-OUT·월평균 출고·누적취소율 등, 실제 라이브 Power BI
DAX 측정값과 대조 검증됨)와 차원(SC/딜러/브랜드/기간 등)만 후보로 노출하고:

```
LLM 툴콜 = 질문을 등록된 metric_id + dimension_id + filters + 기간으로 매핑(SQL 아님, enum 선택)
→ SemanticQueryIR 구조/의미 검증 → 결정론적 컴파일러(compiler.js)가 SQL을 100% 코드로 조립
  (LLM은 SQL 텍스트를 한 글자도 안 씀) → Fabric 실행 → 비율 지표는 분자/분모를 각각 실행 후
  JS로 나눗셈 → DashboardPlanner가 결과 행 수/지표 타입 보고 위젯 컴포넌트 자동 선택
```

- **커버리지가 좁다**: 카탈로그에 없는 지표/차원 조합은 애초에 LLM이 고를 수 없어(enum
  제약) "답변 불가"로 명확히 거부된다 — RAG처럼 넓게 대응하지 못한다.
- **SQL은 100% 결정론적** — LLM은 어떤 지표/차원을 쓸지만 고르고, 실제 SQL 문자열은 전부
  `compiler.js`가 YAML 정의(base_table/expression/filter 조각)로 조립한다. Stage9~10 같은
  "실행해보고 틀리면 고치는" 안전망이 필요 없다 — 애초에 조립 규칙이 SQL 인젝션·오타를
  구조적으로 배제한다.
- 지표 정의 자체가 신뢰의 근거다: 이번 세션에서 실제 Power BI Desktop 파일에 ADOMD.NET으로
  직접 붙어 라이브 DAX 측정값과 하나씩 대조해, 문서(GOLD SQL)와 실제 운영 DAX가 다른 지점
  (예: 출고 목표가 `FCT_CRM_TARGET_M`이 아니라 `FCT_SALES_TARGET_DAILY`를 씀, PMA IN에
  `etc`를 잘못 포함시키는 버그 등)을 찾아 YAML에 반영했다.
- 아직 `/ktws/agentic-bi` 1개 페이지(실험 배지)에서만 쓰인다 — RAG처럼 여러 엔드포인트에
  걸쳐 프로덕션 트래픽을 받지 않는다.

### 핵심 차이 요약

| | RAG(Text2SQL) | Agentic BI |
|---|---|---|
| 접근 방식 | 과거 SQL 예시 검색·조립 | 등록된 지표 카탈로그에서 선택 |
| SQL 작성 주체 | LLM(스텝별 생성) + 결정론적 조합 | 100% 결정론적 컴파일러, LLM은 SQL 미작성 |
| 커버리지 | 넓음 (187개 테이블, 11개 주제) | 좁음 (등록된 ~40여개 지표만) |
| 정확성 방어선 | 라이브 실행 후 검증/자동수정(Stage9~10) | 애초에 검증된 지표 정의로만 조립 (사후 검증 불필요) |
| 새 질문 대응 | Pattern Card/Fragment 계속 추가 | metrics.yaml에 지표 추가 + 실측 DAX 대조 |
| 현재 상태 | 프로덕션, 3개 엔드포인트 | 실험 페이지 1개 |

## 유저별 대시보드 레이아웃 저장 (로컬 Postgres)

KTWS 대시보드 커스텀 페이지의 위젯 구성(무엇을 추가했는지, 크기를 어떻게 조절했는지)은
로그인 계정별로 로컬 Postgres에 저장된다. 이전에는 브라우저 `localStorage`에만 저장돼서
같은 기기/브라우저가 아니면 안 보이고 유저 구분도 안 됐는데, 그걸 대체한 것이다.

### 설계 결정 3가지

1. **유저 키 = MSAL 로그인 계정(`homeAccountId`)** — 본사/딜러사 role 구분이 아니라 개인
   로그인 계정 단위로 구분한다.
2. **DB에는 위젯 "스펙"만 저장, 조회 결과(데이터)는 저장하지 않는다** — 실행할 SQL 문자열 +
   차트 설정 + 레이아웃(가로/세로 크기)만 저장하고, 대시보드를 열 때마다 그 SQL로 Fabric에
   실시간 재조회해서 데이터를 채운다. 저장 용량이 작고 데이터가 항상 최신이라는 장점 대신,
   위젯이 많으면 로드 시 쿼리 지연(수백ms~수초)이 생긴다.
3. **로컬 Postgres는 Docker Compose로 띄운다** — `louis/dashboard/docker-compose.yml` (`docker
   compose up -d`로 실행, 기본 포트 5433 — 로컬에 이미 네이티브 Postgres가 5432를 쓰고 있을
   수 있어 충돌을 피하려고 5432가 아닌 5433을 씀).

### 테이블 구조

`louis/dashboard/server/db-init/init.sql` (컨테이너 최초 기동 시 자동 적용):

```sql
CREATE TABLE dashboard_layouts (
  user_id    TEXT NOT NULL,       -- MSAL homeAccountId
  page_key   TEXT NOT NULL,       -- 예: 'ktws-custom' (App.jsx의 pageKey)
  version    INTEGER NOT NULL DEFAULT 0,
  widgets    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, page_key)
);
```

- `(user_id, page_key)` 복합 기본키 하나로 "이 유저의 이 페이지 레이아웃" 한 행만 유지한다
  (여러 버전을 쌓지 않고 항상 최신 상태로 덮어씀).
- `page_key`를 키에 포함시켜서, 나중에 다른 페이지에도 이 기능을 넣을 때 테이블 구조를
  바꾸지 않고 `page_key` 값만 늘리면 되게 했다.
- `widgets`는 위젯 배열의 JSONB — 각 원소에 조회 결과(`props`)는 빠지고 재조회에 필요한
  필드만 들어간다: `id`, `db`(Fabric DB명), `sql`(실행할 SELECT), `chartCode`, `querySpec`
  (라벨/값 컬럼 매핑), `title`, `weight`/`height`(레이아웃), `topic`, `createdAt`.

### 저장/로드 흐름

```
[페이지 로드] GET /api/dashboard-layout?userId=&pageKey=
  → Postgres에서 위젯 스펙 목록 조회
  → 각 위젯의 sql을 fabricClient.js로 다시 실행 (병렬)
  → 실패한 위젯은 조용히 스킵(테이블 삭제·Fabric 연결 불가 등) — 나머지는 정상 표시
  → widgetSchema.js로 조회 결과를 props로 재구성해 반환

[위젯 추가/삭제/수정/리사이즈] PUT /api/dashboard-layout
  → 위젯 목록에서 props만 제거하고 나머지 스펙을 INSERT ... ON CONFLICT DO UPDATE로 저장
```

구현 파일: `louis/dashboard/server/db.js`(Pool), `server/dashboardLayoutHandler.js`
(GET/PUT 핸들러), `src/auth/useCurrentUserId.js`(MSAL 계정 → userId 추출),
`src/context/DashboardStateContext.jsx`(로드/저장 훅 — 기존엔 `localStorage` 읽기/쓰기였던
부분을 이 API 호출로 교체).
