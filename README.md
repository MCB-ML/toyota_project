# Toyota Dashboard Web

Toyota/Lexus dashboard stack for local development. Run the project from the repository root only. The root Docker Compose file starts the service UI/backend, admin UI, admin API, shared Postgres, Redis, and Chroma together.

## Structure

```text
.
|-- admin/
|   |-- backend/             # Admin API (FastAPI)
|   `-- frontend/            # Admin UI (Vite)
|-- service/
|   |-- backend/             # Dashboard API, RAG, Agentic BI
|   |-- frontend/            # Dashboard UI (Vite)
|   `-- deploy/              # Deployment snapshot (not built into local images)
|-- db/
|   |-- README.md            # Shared Postgres ownership map
|   |-- service/             # Service schema (dashboard, RAG)
|   `-- admin/               # Admin schema (dbo, agent, link)
|-- docs/                    # All project documentation
|-- docker/                  # Central Dockerfiles for local images
|-- scripts/                 # Local setup/update helpers (.ps1 and .sh)
|-- notebook/                # Analysis notebooks
|-- docker-compose.yml       # Single local stack entry point
|-- .dockerignore            # Single Docker build ignore file
|-- .gitignore               # Single Git ignore file
|-- .gitattributes           # Line-ending policy (LF for .sh, CRLF for .ps1)
`-- .env.example             # Canonical local env template
```

Both apps share one Postgres database and split it by schema, so every `.sql` file lives
under `db/` rather than inside each app. See [db/README.md](db/README.md) for the ownership map.

Do not run Docker Compose from `service/` or `admin/`. The old service-only compose file, Docker wrapper scripts, and per-app Dockerfiles were removed so the root command is the supported path.

## Prerequisites

- Docker Desktop
- Git
- PowerShell (Windows) or Bash (macOS/Linux)

No local Node, Python, Postgres, Redis, or Chroma install is required for the Docker path.

## First Local Setup

From a fresh clone — this is the one command another person needs to reach the same
environment. It installs nothing on the host; every dependency is installed inside the images.

```powershell
# Windows
.\scripts\setup-local.ps1
```

```bash
# macOS / Linux
./scripts/setup-local.sh
```

The setup script does the local bootstrap work:

- creates `.env` from `.env.example` if missing
- creates a random `ADMIN_SECRET_KEY` in `.env` if missing
- builds the admin backend image first
- creates `admin/backend/certs/private.pem` and `admin/backend/certs/public.pem`
- starts all containers with `docker compose up -d --build --remove-orphans`
- applies the service schema (`db-seed`) and seeds the RAG knowledge base (`rag-seed`)
- builds RAG embeddings when `AZURE_OPENAI_KEY` and `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` are set
- creates the first admin account if `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` are set in `.env`

The generated `.env` and `admin/backend/certs/` are ignored by Git.

`docker compose up -d --build` alone also starts the stack, but it skips the certs, the
schema seed, and the RAG seed — use the setup script for a first run.

### The one thing the script cannot do for you

Secrets are not in the repository, by design. Everything else — schema, dealer list,
development logins, RAG knowledge base — is created automatically, so the stack comes up
and you can log in without them. These keys only gate the AI and live-warehouse features:

| Key in `.env` | Without it |
|---|---|
| `ANTHROPIC_API_KEY` / `AZURE_OPENAI_KEY` + `AZURE_OPENAI_ENDPOINT` | Chatbot and dashboard generation fail |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | RAG runs without embeddings (setup skips that step and says so) |
| `Fabric_ID` / `Fabric_PW`, `FABRIC_SQL_*` | Live Fabric warehouse queries fail; pre-aggregated pages still work |
| `VITE_AZURE_AD_*`, `AZURE_AD_*` | Microsoft login unavailable; the development accounts below still work |

Copy those values from whoever set up the project, paste them into `.env`, then re-run
`update-local.ps1` (or `update-local.sh`).

### Checking it came up the same

```powershell
docker compose ps                                  # 6 services, all healthy
Invoke-WebRequest http://localhost:3000/healthz    # 200
Invoke-WebRequest http://localhost:8090/ping       # 200
```

Then open `http://localhost:3000` and sign in with one of the development accounts below.
If the database looks wrong or half-initialized, the fastest fix is a clean rebuild:
`.\scripts\setup-local.ps1 -ResetVolumes` (this deletes local DB data).

### Clean First Setup

If you want to delete local Postgres/Chroma volumes and start from scratch:

```powershell
.\scripts\setup-local.ps1 -ResetVolumes   # Windows
```

```bash
./scripts/setup-local.sh --reset-volumes  # macOS / Linux
```

This deletes local Docker volumes. Use it only when you are okay losing local dashboard/admin data.

## Development Accounts

Setup seeds four local accounts so a fresh clone can get past the login screen without
any manual DB work. **The password is `121212` for all four.**

| Account | Role | Company |
|---|---|---|
| `max.kim@mcloudbridge.com` | admin | TMKR |
| `louis@mcloudbridge.com` | user | TMKR |
| `lumi.han@mcloudbridge.com` | user | 토요타 용산 |
| `leo.park@mcloudbridge.com` | user | 렉서스 분당 |

They cover the three cases worth testing: an admin, a headquarters user, and dealer users
who should only see their own dealership's data.

The same credentials work on both the admin UI (`http://localhost:8088`) and the service
AI365 login (`http://localhost:3000`).

These are **local development only** — defined in
[db/admin/060_dev_accounts.sql](db/admin/060_dev_accounts.sql) and never intended for a
deployed environment. On a fresh volume `initdb` creates them; on an existing volume the
setup/update scripts apply them. To (re)apply by hand:

```powershell
docker compose --profile tools run --rm dev-accounts
```

## Admin Account

To create your own account instead of using the development ones, the account table is
shared Postgres:

```sql
dbo."User_master"
```

To auto-create an account during setup, set these in `.env` before running `setup-local.ps1`:

```env
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=AdminPassword123!
ADMIN_BOOTSTRAP_NAME=Toyota Admin
ADMIN_BOOTSTRAP_SCOPE_KEY=hq
```

To create or update an account later:

```powershell
docker compose --profile tools run --rm admin-bootstrap
```

If the account already exists and you want to update password/role, set this in `.env` first:

```env
ADMIN_BOOTSTRAP_UPDATE_EXISTING=true
```

The same email/password works for:

- admin UI: `http://localhost:8088`
- service AI365 login: `http://localhost:3000`

## Daily Run

Start the existing local stack:

```powershell
docker compose up -d
```

Start and rebuild after pulling changes — this also reapplies the schema and RAG seeds,
so run it instead of a bare `docker compose up` whenever you pull:

```powershell
.\scripts\update-local.ps1     # Windows
```

```bash
./scripts/update-local.sh      # macOS / Linux
```

Equivalent raw command (without the seeds):

```powershell
docker compose up -d --build --remove-orphans
```

If database/schema seed changes require a clean DB:

```powershell
.\scripts\update-local.ps1 -ResetVolumes    # Windows
```

```bash
./scripts/update-local.sh --reset-volumes   # macOS / Linux
```

## URLs

```text
service UI       http://localhost:3000
admin UI         http://localhost:8088
admin API        http://localhost:8090
Postgres         localhost:5433
Redis            localhost:6379
Chroma           http://localhost:8000
```

Health checks:

```powershell
Invoke-WebRequest http://localhost:3000/healthz
Invoke-WebRequest http://localhost:8090/ping
Invoke-WebRequest http://localhost:8088/api/health
```

## Compose Services

Default services:

```text
service
admin-backend
admin-frontend
postgres
redis
chroma
```

Tool profile services:

```text
admin-bootstrap
db-seed
rag-seed
rag-embeddings
rag-check
chroma-browser
```

Example:

```powershell
docker compose --profile tools run --rm rag-check
```

## Environment Rules

Root `.env.example` is the canonical Docker template. Docker Compose reads root `.env` automatically.

Important values:

```env
ADMIN_SECRET_KEY=                 # generated locally by setup-local.ps1
ADMIN_BOOTSTRAP_EMAIL=            # optional first admin account
ADMIN_BOOTSTRAP_PASSWORD=         # optional first admin account
Fabric_ID=                        # Fabric SQL login, if live Fabric queries are needed
Fabric_PW=
AZURE_OPENAI_KEY=                 # needed for Azure OpenAI flows/RAG embeddings
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=
```

Secrets must stay in `.env` or another ignored secret store. Do not commit `.env`, cert files, or deployment env files.

`service/.env.example` and `admin/backend/deployments/dev.env.example` are only for running one app directly outside Docker. They are not used by the root Docker stack.

## JWT Certs

Local RS256 certs live here:

```text
admin/backend/certs/private.pem
admin/backend/certs/public.pem
```

They are generated by:

```powershell
.\scripts\setup-local.ps1
```

To regenerate them manually:

```powershell
docker compose build admin-backend
docker run --rm -v "${PWD}:/workspace" -w /workspace toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs --force
```

## Useful Maintenance Commands

Show running containers:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f service
docker compose logs -f admin-backend
docker compose logs -f admin-frontend
```

Stop without deleting data:

```powershell
docker compose down
```

Stop and delete local data volumes:

```powershell
docker compose down -v --remove-orphans
```

Run service tests outside Docker, if Node dependencies are installed locally:

```powershell
cd service
npm test
npm run build
```
---

# MCB-ML-toyota_project — 개발 현황 및 아키텍처

MCB_토요타 고객사 프로젝트: 데이터 분석/예측 웹사이트

주요 작업 위치는 [`service`](service) (React 대시보드 웹앱)이며, 아래는 그 웹사이트의
현재 개발 현황과 AI 챗봇 아키텍처 요약이다. 세부 구현 노트는 [`docs/service.md`](docs/service.md) 참고.

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
  Azure AD 앱 등록 필요 — 코드는 준비됨, 상세는 `docs/service.md`)
- **Text2SQL RAG 파이프라인 (프로덕션)**: `/api/chat`, `/api/dashboard-customize`,
  `/api/warehouse-query` 세 곳 모두 우선 시도하는 10단계 Pattern Card/Fragment 기반 RAG —
  자세한 내용은 아래 "RAG(Text2SQL) vs Agentic BI 비교" 섹션 참고
- **KTWS Agentic BI 페이지** (`/ktws/agentic-bi`, 실험 배지): RAG와 별도로, YAML로 정의한
  지표/차원 카탈로그(Semantic Layer) 안에서만 답하는 두 번째 자연어 파이프라인 — 실제 라이브
  Power BI DAX 측정값과 대조 검증 완료, `toyota-test-web`에 배포됨
- **인증 리포트 계층**(`server/reports/`): 확정된 GOLD SQL 20종을 분해하지 않고 그대로 실행하는
  세 번째 경로. 퍼널·판매 성취도처럼 지표 조합으로 재현할 수 없는 화면을 담당하고, 값은
  Power BI 화면과 셀 단위로 대조해 맞췄다 — 아래 "인증 리포트 계층" 절 참고

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
main/data/*.parquet ──(오프라인, generate_data.py)──▶ public/data/*.json ──▶ /api/chat

Fabric SQL 엔드포인트(Agora/Karete/BP_KTWS) ──(server/fabricClient.js, 실시간)──▶ /api/dashboard-customize, /api/warehouse-query
```

`/api/chat`만 미리 집계해둔 JSON 스냅샷을 본다 — 원본이 바뀌어도 `generate_data.py`를 다시
돌리기 전엔 반영되지 않는다. `/api/dashboard-customize`와 `/api/warehouse-query`는 둘 다 매
요청마다 실제 웨어하우스를 조회한다.

### 라이브 쿼리 공통 구조 — 의도 분류 → 온디맨드 스키마 로드 → 실행

`/api/dashboard-customize`와 `/api/warehouse-query` 둘 다 아래 패턴을 공유한다:

```
질문 → 의도 분류(12개 주제 중 하나로 분류) → 관련 테이블만 온디맨드 로드 → LLM이 실제 SELECT 작성
→ fabricClient.js로 Fabric에 실행 → 결과 반환(dashboard-customize는 위젯으로, warehouse-query는 표로)
```

- **의도 분류**: `/api/chat`·`/api/dashboard-customize`·`/api/warehouse-query` 세 파이프라인이
  `schemaLoader.js` 하나(스키마 소스는 `server/schema/index.yaml` + `server/schema/tables/*.yaml`,
  둘 다 사내 정보라 gitignore)를 공유한다 — 이 스키마는 **KTWS(Fabric KPI_W DB) 스타 스키마 테이블
  22개**(DIM 11 + FCT 11)만 담고 있고, Agentic BI의 metric 카탈로그와 동일한 데이터 영역이다.
  22개 전체를 매번 프롬프트에 넣는 대신, 먼저 12개 주제(활동_실적/영업기회_퍼널/계약/CRM_목표/
  해피보드_HOT고객/담당고객/NPS_고객만족도/판매목표_일별/차량재고/차량스펙_마스터/
  딜러_사용자_마스터/날짜_캘린더) 중 하나로 분류한 뒤 그 주제에 연결된 테이블 1~7개만 로드한다.
- **시맨틱 스키마**: `main/docs/정의서/DB정의서_*.md`(실제 DB 스캔 + 엑셀 정의서 병합, 한글 설명
  추가)에서 실업무 테이블만 추려 `server/schema/index.yaml`(상시 로드, ~350토큰) +
  `server/schema/tables/*.yaml`(테이블별 상세, 온디맨드)로 재구성
- **실행**: `server/fabricClient.js`가 Azure AD 비밀번호 인증으로 3개 Fabric 엔드포인트에 접속,
  `SELECT`/`WITH` 아닌 쿼리는 차단
- **차이점**: `dashboard-customize`는 여기에 더해 위젯 반영을 위한 patch 생성 + 검토 에이전트
  단계가 있고, "적용" 버튼을 눌러야 실제 화면에 반영된다(자세한 단계별 구현 위치는
  [`docs/service.md`](docs/service.md#ai-대시보드-커스터마이징-파이프라인-ktws-대시보드-커스텀-페이지)
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

- **데이터 범위는 Agentic BI와 동일하다** — 둘 다 결국 같은 KTWS(Fabric KPI_W) 스키마 22개
  테이블을 본다(위 "라이브 쿼리 공통 구조" 절의 의도 분류 설명 참고). "RAG가 더 넓은 데이터를
  다룬다"는 설명은 부정확하다 — 실제 차이는 아래 커버리지 항목 참고.
- **카탈로그 밖(롱테일) 질문에 강하다**: Pattern Card/Fragment 라이브러리만 계속 늘리면 새 질문
  유형에 대응 가능 — Agentic BI의 등록 지표/리포트에 없는 조합(한 번도 안 물어본 필터·컬럼
  조합 등)도 SQL을 새로 짜서 시도해볼 수 있다.
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
- 지표 정의 자체가 신뢰의 근거다: Power BI Desktop 파일에 ADOMD.NET으로 직접 붙어 라이브 DAX
  측정값과 하나씩 대조해, 문서(GOLD SQL)와 실제 운영 DAX가 다른 지점(예: PMA IN에 `etc`를
  잘못 포함시키는 버그)을 찾아 YAML에 반영했다.
- 아직 `/ktws/agentic-bi` 1개 페이지(실험 배지)에서만 쓰인다 — RAG처럼 여러 엔드포인트에
  걸쳐 프로덕션 트래픽을 받지 않는다.

> **2026-08-04 정정** — 위 대조에서 "출고/계약 목표는 `FCT_CRM_TARGET_M`이 아니라
> `FCT_SALES_TARGET_DAILY`를 쓴다"고 적었던 것은 **틀렸다**. 2026년 1~7월 전 구간을 웹 BI
> 화면과 대조했더니 `FCT_SALES_TARGET_DAILY`는 어느 달도 맞지 않았고(4월 2,380 vs 화면 3,165,
> 5월은 4,010 vs 2,971로 방향까지 반대), 실제 소스는 `FCT_CRM_TARGET_M`이었다. 게다가 그
> 테이블에 브랜드 필터를 걸면 `DIM_MNG_USER`가 `dealer_key`로 조인되며 딜러당 SC 수만큼
> 팬아웃해 560,790이 나왔다. 지금은 아래 "인증 리포트 계층"에서 값을 가져온다.

### 인증 리포트 계층(Certified Report Layer) — `server/reports/`

지표를 조합해 만드는 것으로는 재현할 수 없는 화면이 있다. 퍼널 GOLD는 11개 시각적 개체를
한 쿼리로 합친 **하나의 리포트 프로그램**이라, 혼합 grain·상세/합계 규칙·SC 표시 분기가
SQL 안에 얽혀 있다. 지표별로 쪼개 실행한 뒤 JS에서 합치면 숫자가 틀어진다.

그래서 확정 SQL 20종을 **분해하지 않고 그대로** 등록해 실행한다. LLM은 `report_id`와
파라미터만 고르고 SQL 필드는 툴 스키마에 아예 없다. 계약(`contracts/*.yaml`)에 SQL 해시를
박아 실행 직전 대조하므로 본문을 바꿔치기할 수 없다.

- **컬럼 의미론**: `additive` / `distinct_count` / `repeated_higher_grain_value` /
  `separate_total_cte` 등으로 컬럼마다 집계 규칙을 선언한다. 그냥 더하면 안 되는 컬럼이
  많다 — 계약 목표는 활동유형 행마다 반복돼 상세를 더하면 8배가 되고, DISTINCT 카운트는
  한 건이 여러 단계에 걸쳐 상세 합이 총계에 못 미친다.
- **GOLD 파생 지표 15종**(`server/agentic-bi/funnelDerived/`): 지표 하나만 물었을 때도 GOLD의
  CTE를 그대로 써서 답한다. GOLD를 파싱해 필요한 CTE만 뽑고 `GROUP BY`만 요청 grain으로
  바꾸므로, 정의가 GOLD 한 곳에만 존재해 리포트와 값이 갈릴 수 없다. 계약·출고 목표 4종은
  2-1/2-3 리포트에서 꺼낸다.
- **원본 대조**: `server/reports/sources/`의 원본 GOLD와 등록 SQL을 줄 단위로 비교해,
  계약의 `deviations`에 적은 것 외의 수정이 섞이면 테스트가 잡는다.

### 핵심 차이 요약

| | RAG(Text2SQL) | Agentic BI |
|---|---|---|
| 접근 방식 | 과거 SQL 예시 검색·조립 | 등록된 지표 카탈로그에서 선택 |
| 데이터 범위 | KTWS(Fabric KPI_W) 22개 테이블 — Agentic BI와 동일 | KTWS(Fabric KPI_W) — 동일 |
| SQL 작성 주체 | LLM(스텝별 생성) + 결정론적 조합 | 100% 결정론적 컴파일러, LLM은 SQL 미작성 |
| 질문 커버리지 | 넓음 — 카탈로그에 없는 조합도 새 SQL로 시도 | 좁음 — 등록된 지표 53개 + 인증 리포트 20종 범위만, 나머지는 명확히 거부 |
| 정확성 방어선 | 라이브 실행 후 검증/자동수정(Stage9~10) — 매 질문마다 SQL을 새로 생성해 실행 성공 여부로만 검증 | 애초에 DAX 실측 대조까지 끝낸 지표 정의로만 조립 (사후 검증 불필요) |
| 겹치는 지표의 정확도 | 매번 LLM이 SQL을 새로 쓰므로 이론상 변동 가능 | 더 신뢰할 수 있음(고정 조립 규칙 + DAX 대조 완료) |
| 새 질문 대응 | Pattern Card/Fragment 계속 추가 | metrics.yaml에 지표 추가 + 실측 DAX 대조 |
| 현재 상태 | 프로덕션, 3개 엔드포인트 | 실험 페이지 1개 |
| 값 검증 | 실행 성공 여부 | 등록 리포트는 Power BI 화면과 셀 단위 대조(2026-04 기준 72셀 일치) |

## 챗봇이 그래프·값을 내놓기까지 — 단계별 흐름

아래는 현재 개발이 진행 중인 **KTWS Agentic BI 챗봇**(`/ktws/agentic-bi` → `/api/agentic-bi-ask`)
기준이다. 질문 한 줄이 들어와서 화면에 차트나 숫자가 찍히기까지 실제로 거치는 단계를
코드 순서대로 적었다. 응답은 한 번에 오지 않고 **SSE로 이벤트가 계속 흘러나오는** 구조라,
"진행 상태 → 디버그 → 결과 위젯 → 요약 문장"이 순서대로 도착한다.

```
[브라우저] ChatPanel.jsx ──POST /api/agentic-bi-ask (SSE)──▶ agenticBiHandler.js
   → runAgenticBiQuery()  (agenticBiPipeline.js)
      1. 결정론적 게이트 (LLM 이전)
      2. LLM 툴콜 1회 — 지표/차원/리포트 "선택"만 (SQL 미작성)
      3. IR 조립 + 결정론적 보정
      4. 2단계 검증 (구조 → 의미)
      5. SQL 컴파일 & Fabric 실행
      6. 행 후처리 (누적/증감률/비율)
      7. 시각화 결정 (planDashboard)
      8. 위젯 props 조립
   ──SSE 이벤트──▶ [브라우저] GeneratedWidget.jsx → 차트/카드/표 렌더
```

### 0. 요청 — 어느 엔드포인트로 갈지

[ChatPanel.jsx:102-113](main/dashboard/src/components/ChatPanel.jsx#L102-L113)에서
`pageKey`로 갈린다. `agentic-bi` 페이지면 `/api/agentic-bi-ask`, 다른 커스텀 페이지면
`/api/dashboard-customize`, 페이지 없이 열린 AI 어시스턴트면 `/api/chat`이다. 단
Agentic BI 페이지라도 "색만 바꿔줘" 같은 **겉모습만 바꾸는 요청**(`isPresentationEditRequest`)은
데이터 재조회가 필요 없어 `/api/dashboard-customize`로 보낸다.

본문에는 질문·대화이력과 함께 **현재 대시보드 상태**(`dashboardState` — 위젯 목록, version,
선택된 위젯 id)가 같이 실린다. "이거 꺾은선으로 바꿔줘"처럼 기존 위젯을 가리키는 말을
서버가 id로 특정하려면 이 상태가 필요하다.

[agenticBiHandler.js](main/dashboard/server/agenticBiHandler.js)는 SSE 헤더를 세우고
`sendEvent`를 만든 뒤 `runAgenticBiQuery()`에 넘긴다. `debug`/`error`/`rejected` 이벤트는
서버 콘솔에도 그대로 찍어서, 브라우저 디버그 패널을 안 열어도 `npm run dev` 터미널에서
LLM이 무엇을 골랐고 SQL이 어떻게 컴파일됐는지 볼 수 있다.

### 1. LLM을 부르기 전 결정론적 게이트

LLM에 맡기면 같은 질문에 실행마다 다른 답이 나가는 두 경우를 먼저 걸러낸다.

- **주어가 빠진 질문** — `detectAmbiguousSubject()` ([ambiguityGuard.js](main/dashboard/server/agentic-bi/ambiguityGuard.js)).
  "4월 목표 알려줘"는 무엇의 목표인지 없다. 짐작하지 않고 `reask` 이벤트로 되묻는다
  (버튼 하나로 재전송되는 대안 질문 2개 포함).
- **퍼널 요청** — `detectCertifiedFunnelRequest()` ([agenticBiPipeline.js:111](main/dashboard/server/agenticBiPipeline.js#L111)).
  "퍼널 역삼각형 보여줘"류는 LLM을 거치지 않고 곧장 인증 리포트(`funnel_full_structure`)를
  실행한다. 연도/월/SC별 여부만 정규식으로 뽑는다.

### 2. LLM 툴콜 — SQL이 아니라 "선택"만 한다

`stage: select` 이벤트가 나가고, Azure OpenAI에 **툴콜 1회**를 `toolChoice: 'required'`,
`temperature: 0`으로 요청한다 ([agenticBiPipeline.js:1605](main/dashboard/server/agenticBiPipeline.js#L1605)).
시스템 프롬프트에는 등록된 지표 카탈로그·차원 카탈로그·인증 리포트 목록·현재 위젯 목록이
텍스트로 들어간다. 고를 수 있는 툴은 4개다:

| 툴 | 언제 | 다음 단계 |
|---|---|---|
| `pick_semantic_query` | 값 하나·추이·자유 차트 | 3단계로 (아래 전체 흐름) |
| `run_certified_report` | 여러 지표를 모은 완성된 표, 합계·계층이 필요한 질문 | 확정 SQL 그대로 실행 |
| `regroup_report_widget` | 이미 만든 리포트 표에서 컬럼을 빼거나 묶기 | 재조회 없이 기존 행 재그룹 |
| `restyle_widget` | 차트 종류·색만 변경 | 재조회 없이 props만 변경 |

여기서 LLM이 출력하는 것은 `metric_ids`, `dimension_ids`, `filters`, 기간, 차트 종류 같은
**enum 값**뿐이다 — 툴 스키마에 SQL 필드가 아예 없어서 SQL 문자열을 쓸 방법이 없다.
답할 수 없으면 `answerable=false`와 함께 대안 질문 2개를 채우고, 파이프라인은 이를
`reask`(대안 2개 있음) 또는 `rejected`(없음) 이벤트로 바꾼다.

### 3. IR 조립 + 결정론적 보정 체인

툴 인자를 `buildIrFromToolArgs()`가 **SemanticQueryIR**(지표·차원·필터·기간의 구조체)로
바꾼 뒤, 질문 원문을 다시 읽어 LLM이 놓치거나 틀리기 쉬운 부분을 코드로 덮어쓴다
([agenticBiPipeline.js:1758](main/dashboard/server/agenticBiPipeline.js#L1758)). 적용 순서대로:

| 보정 | 하는 일 |
|---|---|
| `applyMetricSelectionOverrides` | YAML의 `selection_override`로 유사 업무용어 보정("계약 진행률" → 달성률이 아닌 진행률) |
| `applyKpiBundleIntent` | "실적·목표·진행률 KPI 카드"를 요청하면 `kpi_bundle` 선언을 읽어 빠진 역할을 채움 |
| `normalizeTemporalFilters` | 기간을 필터로 넣은 IR을 `time_range`로 되돌림(안 하면 달력 조인이 빠져 SQL 오류) |
| `applyTimeIntent` | "일별/월별/누적/증감률"을 시간 차원·`time_series_transform`으로 확정 |
| `applyRequestedChartType` | "콤보로", "도넛으로" 같은 명시 요청을 `chart_type`에 고정 |
| `appendMentionedProjectionDimensions` | 질문에 언급됐지만 LLM이 안 담은 호환 차원을 결과 컬럼에 추가 |
| `selectedWidgetShapeForRateChange` | 선택된 기존 위젯의 모양(차트 종류·방향)을 이어받음 |
| `applyMandatoryAccessFilters` | 권한 컨텍스트의 강제 필터를 **raw SQL이 아니라 IR 구조에** 합침 |

"2026년 4월 2주차"처럼 주차를 물으면 날짜를 계산하지 않고
`DIM_CALENDAR_KTWS`를 실제 조회해 주차 경계를 확정한 뒤 절대구간으로 바꿔 넣는다
(`resolveWeekOfMonthArgs`). 완성된 IR은 `debug` 이벤트(`Semantic Query IR`)로 그대로 나간다.

### 4. 2단계 검증

`validateSemanticQueryIR()`(구조 — 필드/타입/화이트리스트) → `validateSemanticQuery()`(의미 —
그 지표가 그 차원·기간을 실제로 지원하는지) 순으로 본다. 둘 중 하나라도 실패하면 `error`
이벤트로 끝내고 SQL을 만들지 않는다. 목표(target) 지표는 SC/부서/전시장 스코프면 SC 레벨
지표로 자동 전환되므로(`resolveEffectiveMetricId`), 검증도 전환된 지표 기준으로 한다.

### 5. SQL 컴파일과 실행 — `resolveMetricRows()`

`stage: compile` → `stage: execute` 이벤트가 나간다. 지표 종류에 따라 세 갈래다
([agenticBiPipeline.js:2536](main/dashboard/server/agenticBiPipeline.js#L2536)):

1. **비율형**(`ratio_metric`/`conversion_metric`/`progress_metric`) — 분자·분모 지표를
   각각 `resolveMetricRows`로 재귀 실행한 뒤 `mergeMetricRows` + `applyRatioDerivation`으로
   **JS에서 나눈다**. SQL 한 방에 계산하지 않는다.
2. **`controlled_analysis` 지표** — 2단계 집계나 상관 서브쿼리라 일반 조립기로 표현할 수 없는
   지표(월평균 출고, 유효 리드 수 등)는 `CONTROLLED_ANALYSIS_COMPILERS`의 전용 컴파일러가 맡는다.
3. **그 외** — `compileSingleMetricQuery()`([compiler.js](main/dashboard/server/agentic-bi/app/semantic/compiler.js))가
   YAML의 `base_table`/`expression`/필터 조각으로 SELECT를 조립한다.

2·3번은 실행 전에 항상 `runDerivedIfPossible()`을 먼저 시도한다 — 퍼널 지표는 GOLD의 CTE를
그대로 파생시켜 답하는 쪽이 정본이고, 조건이 안 맞을 때만 위 컴파일러로 내려간다.
컴파일 결과의 `@p0` 자리표시자는 `materializeSql()`이 작은따옴표를 이스케이프해 리터럴로
치환하고(파라미터 바인딩 미지원), `queryFabricWithTimeout(KPI_W, sql, 30s)`로 실행한다.
컴파일된 SQL 전문은 `debug` 이벤트(`Compiled SQL (...)`)로 나간다.

지표를 여러 개 물었으면 각 지표를 **순차로** 이 경로에 태운다 — 병렬로 하면 stage 이벤트가
뒤섞여 진행 표시가 어느 지표를 처리 중인지 알 수 없어진다.

### 6. 행 후처리

`applyTimeSeriesTransform()`으로 누적(`cumulative`)/전기 대비 증감률(`mom_change_pct`)을
계산한다. 시간 차원(`time_month`/`time_day`)일 때만 적용한다 — 정렬 가능한 시간축이 있어야
"직전 구간"이 성립하기 때문이다. 증감률이면 표시용으로만 `format: 'percentage'`인 복제
지표를 쓴다(원본 지표는 저장·재조회에 계속 필요).

### 7. 시각화 결정 — `planDashboard()`

`stage: render` 이벤트가 나간다. **0행이면 위젯을 만들지 않고** 어떤 필터·기간이 원인일지
LLM에 묻는 `reask`로 끝낸다(`sendZeroRowsReask`).

행이 있으면 [planner.js의 `pickComponentType()`](main/dashboard/server/agentic-bi/app/dashboard/planner.js#L42)이
컴포넌트를 고른다. 우선순위대로:

```
사용자가 차트 종류를 명시했으면 그것 → 1행이면 kpi_card → 30행 초과면 detail_table
→ 시계열이면 line_chart → 질문에 "도넛/라인/영역"이 있으면 그것 → 기본 bar_chart
```

도넛은 여기에 더해 `checkDonutEligible()`(합계가 의미 있는 값인지, 슬라이스 수가 과하지 않은지)을
통과해야 하고, 실패하면 이유를 남기고 막대로 대체한다. 마지막으로 `validateDashboardIr()`가
"고른 컴포넌트가 실제 결과 행 모양과 맞는지"를 검사하고, 실패하면 위젯 없이 요약 문장만 보낸다.

### 8. props 조립과 출력 — 두 가지 모양

`buildWidgetPropsFromRows(chartCode, rows, querySpec, title)`
([widgetSchema.js:63](main/dashboard/server/widgetSchema.js#L63))가 행 배열을
`{ type: 'render_bar_chart', props: { x_key, y_keys, data, ... } }` 모양으로 바꾼다.
이 함수는 **저장된 위젯을 새로고침 후 다시 그릴 때도 그대로 쓰인다**(`dashboardPagesHandler.js`) —
여기서 다른 모양을 만들면 방금 추가한 위젯과 재로드한 위젯이 달라 보인다.

그다음 두 갈래로 나간다:

- **대시보드에 저장 가능하면** — 재현용 SQL이 있고(`sql` 또는 비율형의 `sqlQueries`),
  `dashboardState`가 왔고, 위젯 12개 제한에 여유가 있으면 → **`patch_ready` 이벤트**.
  미리보기 위젯 + "적용/취소" 버튼이 뜨고, 사용자가 적용을 눌러야 실제 대시보드에 들어간다.
  `review.approved: true`와 그 근거(결정론적 컴파일 또는 확정 리포트 실행)가 함께 실린다.
- **아니면** — 각 컴포넌트를 **`component` 이벤트**로 보내 채팅 말풍선 안에만 렌더한다
  (대시보드에는 쌓이지 않음).

어느 쪽이든 마지막에 `text` 이벤트로 요약 한 줄이 나간다(1행 스칼라면 `지표명: 값`,
아니면 `지표명 (차원별) — N건 조회됨`). 주의사항(비율이 0~500% 범위를 벗어남, 도넛→막대 대체,
위젯 개수 제한 등)도 여기에 붙는다.

### 9. 브라우저 렌더

[ChatPanel.jsx:116-146](main/dashboard/src/components/ChatPanel.jsx#L116-L146)의 SSE 루프가
이벤트를 종류별로 메시지 상태에 쌓는다:

| 이벤트 | 화면 |
|---|---|
| `stage` | 진행 표시(StageTrace) — 지표 선택 중 → SQL 컴파일 중 → 쿼리 실행 중 → 결과 정리 중 |
| `debug` | 디버그 패널(IR·컴파일된 SQL·경로 선택 근거) |
| `text` | 말풍선 텍스트 (누적) |
| `component` | 말풍선 안 인라인 위젯 |
| `patch_ready` | 미리보기 카드 + 적용/취소 버튼 |
| `reask` | 되묻기 + 클릭 한 번에 재전송되는 대안 질문 버튼 |
| `rejected` / `error` | 거부 사유 / 오류 메시지 |
| `done` | 스트리밍 종료 |

실제 그림은 [GeneratedWidget.jsx](main/dashboard/src/components/widgets/GeneratedWidget.jsx)가
그린다 — `name`(`render_bar_chart`/`render_kpi_cards`/`render_table` 등)으로 렌더러를 고르고,
`objectSpec.vizSpec`(색·범례·축 포맷·정렬·파생 계산·객체 필터)을 props에 얹은 뒤 ECharts
구현으로 넘긴다. 적용을 누르면 `applyPatch()`가 대시보드 상태를 갱신하고 위젯이
[WidgetGrid.jsx](main/dashboard/src/components/WidgetGrid.jsx)로 옮겨가며, 그 시점에 위젯
스펙(SQL·차트 설정·레이아웃)이 Postgres에 저장된다 — 다음 접속 때는 저장된 SQL을 다시 실행해
채운다(아래 [유저별 대시보드 레이아웃 저장](#유저별-대시보드-레이아웃-저장-로컬-postgres) 참고).

### 요약: LLM이 관여하는 지점은 3곳뿐

전체 흐름에서 LLM이 실제로 판단하는 것은 ① 지표/차원/리포트 선택(2단계), ② 0행일 때
되묻기 문구 생성(7단계), ③ 다계열 위젯의 계열 배치 같은 표현 선택뿐이다. **SQL 문자열은
어느 단계에서도 LLM이 쓰지 않는다** — 컴파일러가 조립하거나, 확정 리포트를 그대로 실행하거나,
GOLD의 CTE를 파생시킨다. `/api/chat`·`/api/dashboard-customize`·`/api/warehouse-query`가 쓰는
RAG(Text2SQL) 경로는 이와 달리 LLM이 스텝별 SQL을 직접 쓰고 라이브 실행으로 재검증한다
(위 "RAG(Text2SQL) vs Agentic BI 비교" 참고).

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
3. **로컬 Postgres는 Docker Compose로 띄운다** — `service/docker-compose.yml` (`docker
   compose up -d`로 실행, 기본 포트 5433 — 로컬에 이미 네이티브 Postgres가 5432를 쓰고 있을
   수 있어 충돌을 피하려고 5432가 아닌 5433을 씀).

### 테이블 구조

`db/service/*.sql` (컨테이너 최초 기동 시 자동 적용):

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

구현 파일: `service/server/db.js`(Pool), `server/dashboardLayoutHandler.js`
(GET/PUT 핸들러), `src/auth/useCurrentUserId.js`(MSAL 계정 → userId 추출),
`src/context/DashboardStateContext.jsx`(로드/저장 훅 — 기존엔 `localStorage` 읽기/쓰기였던
부분을 이 API 호출로 교체).
