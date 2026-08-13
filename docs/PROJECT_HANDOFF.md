# Toyota Dashboard Web 프로젝트 인수인계 문서

최종 정리일: 2026-07-27

이 문서는 이 프로젝트를 처음 받은 개발자가 문서 하나만 보고 다음 내용을 이해할 수 있도록 작성했다.

- 어디가 실제 실행되는 메인 앱인지
- 프론트엔드와 백엔드가 어떻게 연결되는지
- Postgres, Chroma, Fabric이 각각 무슨 역할인지
- RAG/Text2SQL 파이프라인이 어떻게 도는지
- `agentic_bi_design`은 실제로 쓰는 것인지, 참고용인지
- Docker로 어떻게 전체를 띄우고 데이터 적재 상태를 확인하는지
- 신규 개발자가 어디부터 보면 되는지

## 1. 가장 중요한 결론

실제로 개발하고 실행해야 하는 메인 프로젝트는 아래 경로다.

```text
service
```

이 폴더가 현재 서비스의 본체다.

구성은 다음과 같다.

- React + Vite 프론트엔드
- Node/Express 백엔드
- Azure OpenAI 연동
- Microsoft Fabric SQL 연동
- Postgres 연동
- Chroma 벡터 DB 연동
- RAG/Text2SQL 파이프라인
- KTWS 커스텀 대시보드
- Agentic BI 실험 기능
- Docker Compose 실행 환경

반드시 구분해야 할 것이 있다.

```text
service/server/agentic-bi
```

이 경로는 현재 Node 앱에서 실제로 사용하는 Agentic BI 런타임 코드다.

반면 아래 경로들은 설계/실험/감사/마이그레이션/참고자료 성격이 강하다.

```text
agentic_bi_design
service/server/agentic_bi_design
```

즉, Agentic BI 기능을 고치려면 `agentic_bi_design`부터 만지는 게 아니라 `service/server/agentic-bi`, `server/agenticBiPipeline.js`, `src/pages/ktws/AgenticBi.jsx`부터 봐야 한다.

## 2. 전체 폴더 구조

루트 구조는 대략 다음과 같다.

```text
toyota-dashboard-web
├── README.md
├── agentic_bi_design/
└── main/
    ├── README.md
    ├── notebook/
    └── dashboard/
```

### 2.1 `service`

현재 메인 앱이다.

```text
service
├── src/                         프론트엔드 React 코드
├── server/                      백엔드 Node/Express 코드
├── public/data/                 일부 화면에서 쓰는 정적 JSON 데이터
├── server/db-init/              Postgres 초기화 SQL 및 seed 스크립트
├── server/rag-poc/              RAG/Text2SQL 파이프라인
├── server/schema/               KTWS 테이블/용어/라우팅/스키마 정의
├── server/agentic-bi/           현재 앱에서 사용하는 Agentic BI 런타임
├── server/agentic_bi_design/    Agentic BI 설계/실험/검증 자료
├── deploy/                      과거 배포용 복사본/산출물
├── deploy_backup/               과거 배포 백업
├── Dockerfile                   앱 Docker 이미지 빌드 파일
├── docker-compose.yml           로컬 전체 실행용 compose 파일
├── package.json                 npm 스크립트와 의존성
└── server.js                    운영/Docker 실행 시 Express 엔트리포인트
```

### 2.2 `agentic_bi_design`

루트의 `agentic_bi_design`은 Agentic BI 설계 패키지에 가깝다.

포함된 것:

- ontology
- semantic model
- metric 정의
- SQL inventory
- workbook inventory
- migration report
- 테스트 케이스
- 프로토타입 app 코드
- 최종 보고서

현재 웹 앱이 이 폴더를 직접 import해서 실행하는 구조는 아니다. 실무에서는 참고자료로 보고, 실제 기능 수정은 `service` 안에서 해야 한다.

### 2.3 `notebook`

분석용 Jupyter notebook들이 있다.

```text
notebook
```

현재 웹 앱 런타임의 필수 구성요소는 아니다. 데이터 분석, 과거 PoC, 업무 로직 확인용 자료로 보면 된다.

### 2.4 `deploy`, `deploy_backup`

`service/deploy`, `service/deploy_backup`은 예전 배포 복사본이나 백업 성격이다.

신규 개발자는 기본적으로 여기서 작업하지 않는 것이 좋다.

일반 개발 대상은 아래다.

```text
service/src
service/server
service/server/schema
service/server/rag-poc
service/server/agentic-bi
```

## 3. 실행 아키텍처

전체 구조는 아래처럼 보면 된다.

```text
브라우저
  |
  v
React SPA
  |
  v
Express server.js
  |
  ├── Azure OpenAI
  ├── Microsoft Fabric SQL
  ├── Postgres
  └── Chroma
```

운영/Docker에서는 다음 파일이 서버 엔트리포인트다.

```text
service/server.js
```

로컬 Vite 개발 서버에서는 `vite.config.js`가 백엔드 핸들러를 연결해서 비슷한 API 흐름으로 동작하게 만든다.

## 4. 프론트엔드 구조

프론트엔드 시작점:

```text
service/src/main.jsx
service/src/App.jsx
```

`App.jsx`가 전체 라우팅을 잡는다.

주요 라우트:

```text
/                         AI 챗봇 메인
/sales/contract           Sales 계약 관리
/sales/payment            Sales 결제 관리
/sales/inventory          Sales 재고
/sales/kpi                Sales KPI
/service/coupon           Service 쿠폰
/fvd/voc                  FVD VOC
/fvd/network              FVD 네트워크
/fvd/finance              FVD 재무
/dsd/stock                DSD 재고 매칭
/dsd/target               DSD 일일 목표
/ktws/bi                  Power BI iframe
/ktws/custom              KTWS 커스텀 대시보드
/ktws/agentic-bi          Agentic BI 실험 페이지
```

중요 컴포넌트:

```text
src/components/Sidebar.jsx
src/components/ChatPanel.jsx
src/components/DeployableTab.jsx
src/components/DashboardBuilder.jsx
src/components/WidgetGrid.jsx
src/context/DashboardStateContext.jsx
src/pages/ktws/Custom.jsx
src/pages/ktws/AgenticBi.jsx
src/pages/ktws/Bi.jsx
```

### 4.1 ChatPanel 동작 방식

우측 플로팅 AI 패널은 `ChatPanel.jsx`다.

현재 페이지에 따라 API가 달라진다.

```text
일반 페이지 또는 기본 챗봇       -> /api/chat
/ktws/custom                  -> /api/dashboard-customize
/ktws/agentic-bi              -> /api/agentic-bi-ask
```

서버 응답은 일반 JSON이 아니라 SSE 형태로 들어온다.

주요 이벤트:

```text
text
stage
debug
component
patch_ready
rejected
error
done
```

`patch_ready`는 대시보드 위젯 추가/수정 제안이다. 사용자가 적용하면 `DashboardStateContext` 쪽 상태에 반영된다.

### 4.2 커스텀 대시보드 상태

커스텀 대시보드 상태 관리는 이 파일이 담당한다.

```text
src/context/DashboardStateContext.jsx
```

담당 기능:

- 위젯 목록 관리
- 레이아웃 관리
- 버전 관리
- undo/redo
- 저장
- 불러오기
- 배포
- 롤백
- 템플릿 처리
- 본사/딜러 scope 구분

scope 규칙:

```text
본사 사용자        -> hq
딜러 사용자        -> dealer:<dealerId>
```

일반 대시보드 탭은 `DeployableTab`으로 감싸져 있다. 특정 scope/pageKey에 배포된 커스텀 대시보드가 있으면 그걸 보여주고, 없으면 기존 하드코딩 React 화면을 보여준다.

## 5. 백엔드 구조

백엔드 엔트리포인트:

```text
service/server.js
```

핵심 핸들러:

```text
server/chatHandler.js
server/dashboardCustomizeHandler.js
server/warehouseQueryHandler.js
server/agenticBiHandler.js
server/scopesHandler.js
server/dashboardPagesHandler.js
```

핵심 서비스:

```text
server/azureClient.js
server/azureStream.js
server/fabricClient.js
server/db.js
server/schemaLoader.js
server/widgetSchema.js
server/dashboardPipeline.js
server/warehousePipeline.js
server/agenticBiPipeline.js
```

### 5.1 API 라우트

`server.js`에서 제공하는 API:

```text
GET    /healthz
POST   /api/chat
POST   /api/dashboard-customize
POST   /api/warehouse-query
POST   /api/agentic-bi-ask
GET    /api/scopes
GET    /api/dashboard-pages
PUT    /api/dashboard-pages
DELETE /api/dashboard-pages
GET    /api/dashboard-pages/list
GET    /api/dashboard-pages/deployed
POST   /api/dashboard-pages/deploy
POST   /api/dashboard-pages/rollback
GET    /api/dashboard-pages/templates
GET    /api/dashboard-pages/template
POST   /api/dashboard-pages/template
```

운영 모드에서는 같은 Express 서버가 React build 결과물인 `dist/`도 같이 서빙한다.

## 6. 데이터 저장소 역할

이 프로젝트는 데이터 저장소가 하나가 아니다. 역할을 분리해서 봐야 한다.

### 6.1 Microsoft Fabric SQL

실제 업무 데이터 원천이다.

관련 파일:

```text
server/fabricClient.js
```

판매, 계약, 출고, 재고, KPI, 리드, 활동 등 실제 수치 데이터는 Fabric에서 조회한다.

중요 환경변수:

```text
Fabric_ID
Fabric_PW
FABRIC_SQL_CLIENT_ID
FABRIC_SQL_TENANT_ID
```

백엔드에서는 기본적으로 조회성 SQL만 허용하는 방향이다. 이 경로로 INSERT/UPDATE/DELETE 같은 변경 쿼리를 날리는 구조가 아니다.

### 6.2 Postgres

Postgres는 앱 메타데이터와 RAG 지식 원본 저장소다.

주요 테이블:

```text
dashboard_scopes
dashboard_saved_pages
sql_sources
business_rules
sql_fragments
query_patterns
```

초기화 관련 파일:

```text
server/db-init/001_app_schema.sql
server/db-init/002_rag_poc.sql
server/db-init/003_dashboard_templates.sql
server/db-init/applyAppSchema.js
```

역할:

- 본사/딜러 scope 저장
- 커스텀 대시보드 저장/배포 정보 저장
- RAG용 SQL 소스, 패턴, 조각, 비즈니스 룰 저장

### 6.3 Chroma

Chroma는 벡터 검색 인덱스다.

주요 컬렉션:

```text
ktws_tables
ktws_patterns
ktws_fragments
ktws_rules
ktws_glossary
```

중요한 점:

```text
Postgres = 원본 지식 저장소
Chroma   = 그 지식을 임베딩한 검색 인덱스
```

그래서 PG와 Chroma에 비슷한 내용이 보이는 것은 정상이다.

예를 들어 PG에 `query_patterns`가 있고 Chroma에 `ktws_patterns`가 있는 식이다. PG는 구조화된 원본이고, Chroma는 질문과 가까운 패턴을 찾기 위한 벡터 인덱스다.

## 7. RAG/Text2SQL 파이프라인

RAG 파이프라인 위치:

```text
service/server/rag-poc
```

폴더명은 `poc`지만, 현재 RAG/Text2SQL 흐름에서 실제로 중요한 코드가 들어 있다.

중요 파일:

```text
server/rag-poc/pipeline.js
server/rag-poc/seedKnowledgeBase.js
server/rag-poc/buildEmbeddings.js
server/rag-poc/checkDataStores.js
server/rag-poc/peekChroma.js
server/rag-poc/chromaBrowser.js
server/rag-poc/stages/
server/rag-poc/knowledgeBase/
```

파이프라인 흐름:

```text
사용자 질문
  |
  v
질문 구조화
  |
  v
Chroma에서 관련 테이블 검색
  |
  v
Chroma에서 관련 쿼리 패턴 검색
  |
  v
사용할 패턴 선택
  |
  v
SQL fragment 해석
  |
  v
부족한 테이블/룰/용어 보강
  |
  v
단계별 SQL 생성
  |
  v
최종 SQL 조립
  |
  v
SQL 검증 및 필요 시 보정
  |
  v
Fabric SQL 실행
  |
  v
응답/차트/위젯 생성
```

RAG 관련 지식을 바꿨다면 보통 아래를 다시 돌려야 한다.

```bash
docker compose run --rm rag-seed
docker compose run --rm rag-embeddings
docker compose run --rm rag-check
```

주의:

`rag-embeddings`는 Azure OpenAI embedding API를 호출한다. 즉 schema/KB 텍스트가 Azure OpenAI embedding endpoint로 전송된다.

## 8. Agentic BI 정리

이 프로젝트에서 가장 헷갈리는 부분이다.

비슷한 이름의 폴더가 여러 개 있다.

```text
agentic_bi_design
service/server/agentic_bi_design
service/server/agentic-bi
```

### 8.1 현재 실제로 쓰는 Agentic BI

실제 웹 앱에서 쓰는 코드는 아래다.

```text
service/server/agentic-bi
```

이 코드가 연결되는 파일:

```text
server/agenticBiPipeline.js
server/agenticBiHandler.js
src/pages/ktws/AgenticBi.jsx
```

접속 경로:

```text
/ktws/agentic-bi
```

사이드바에서는 실험 기능으로 표시된다.

### 8.2 Agentic BI와 RAG의 차이

RAG/Text2SQL:

```text
질문 -> 관련 지식 벡터 검색 -> SQL 패턴/조각 조립 -> SQL 생성 -> Fabric 실행
```

Agentic BI:

```text
질문 -> 등록된 metric/dimension/filter 중 선택 -> Semantic Query IR 생성 -> deterministic compiler가 SQL 생성 -> Fabric 실행
```

즉 RAG는 검색 기반이고, Agentic BI는 semantic model 기반으로 더 통제된 SQL 생성을 하려는 구조다.

### 8.3 `server/agentic-bi` 내부 주요 파일

```text
server/agentic-bi/app/semantic/registry.js
server/agentic-bi/app/semantic/ir_schema.js
server/agentic-bi/app/semantic/validator.js
server/agentic-bi/app/semantic/compiler.js
server/agentic-bi/app/dashboard/planner.js
server/agentic-bi/app/dashboard/schemas.js
server/agentic-bi/tools.js
```

semantic 정의:

```text
server/agentic-bi/semantic/semantic_model.yaml
server/agentic-bi/semantic/dimensions.yaml
server/agentic-bi/semantic/filters.yaml
server/agentic-bi/semantic/joins.yaml
server/agentic-bi/semantic/time_semantics.yaml
server/agentic-bi/semantic/metrics/
server/agentic-bi/ontology/
```

### 8.4 `agentic_bi_design`은 쓰는 건가?

결론:

```text
현재 웹 앱의 주 런타임으로 직접 쓰는 것은 아니다.
```

용도:

- Agentic BI 설계 기록
- ontology/semantic model 초안
- SQL inventory
- metric contract
- 테스트 케이스
- migration 분석
- Python/LangGraph 계열 실험
- 최종 보고서

따라서 새 개발자가 Agentic BI 화면 버그를 고쳐야 한다면 아래를 봐야 한다.

```text
src/pages/ktws/AgenticBi.jsx
server/agenticBiHandler.js
server/agenticBiPipeline.js
server/agentic-bi/
```

반대로 Agentic BI 설계 의도, 과거 검증 결과, metric migration 근거를 확인해야 한다면 아래를 참고하면 된다.

```text
agentic_bi_design
service/server/agentic_bi_design
```

## 9. 커스텀 대시보드 저장/배포 구조

커스텀 대시보드는 Postgres에 저장된다.

관련 테이블:

```text
dashboard_saved_pages
```

백엔드:

```text
server/dashboardPagesHandler.js
```

프론트 상태:

```text
src/context/DashboardStateContext.jsx
```

주요 개념:

- 본사와 딜러 scope가 분리된다.
- scope별로 저장된 대시보드가 다르다.
- 저장된 페이지를 배포할 수 있다.
- 배포된 페이지가 있으면 `DeployableTab`이 기존 페이지 대신 배포본을 보여준다.
- 저장 개수 제한이 있다.
- 템플릿 플래그를 줄 수 있다.

주의할 점:

저장된 대시보드는 렌더링된 props 전체를 그대로 저장하는 방식이 아니다. SQL/spec 중심으로 저장하고, 다시 로드할 때 Fabric을 조회해 위젯 데이터를 복원하는 흐름이 있다.

그래서 Fabric 접속 정보가 없거나 저장된 SQL이 더 이상 유효하지 않으면 저장된 대시보드가 비어 보일 수 있다.

## 10. Docker local stack

The current local Docker entry point is the repository root. Do not run Compose from `service/` or `admin/`.

Canonical Docker files:

```text
docker-compose.yml
docker/service.Dockerfile
docker/admin-backend.Dockerfile
docker/admin-frontend.Dockerfile
.dockerignore
```

Local helper scripts:

```text
scripts/setup-local.ps1
scripts/setup-local.cmd
scripts/update-local.ps1
scripts/update-local.cmd
scripts/generate_jwt_certs.py
scripts/local-env.ps1
```

Default services:

```text
service          React build + Express backend
admin-backend    Admin API
admin-frontend   Admin UI
postgres         Shared Postgres DB
redis            Shared Redis cache/locks
chroma           Chroma vector DB
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

First local setup from a fresh clone:

```powershell
cd C:\codex\toyota-dashboard-web
.\scripts\setup-local.ps1
```

Clean local setup, deleting Postgres/Chroma volumes first:

```powershell
.\scripts\setup-local.ps1 -ResetVolumes
```

Rebuild/restart after code updates:

```powershell
.\scripts\update-local.ps1
```

Rebuild/restart after code updates and reset local volumes:

```powershell
.\scripts\update-local.ps1 -ResetVolumes
```

Useful checks:

```powershell
docker compose ps
Invoke-WebRequest http://localhost:3000/healthz
Invoke-WebRequest http://localhost:8090/ping
Invoke-WebRequest http://localhost:8088/api/health
```

Tool examples:

```powershell
docker compose --profile tools run --rm db-seed
docker compose --profile tools run --rm rag-seed
docker compose --profile tools run --rm rag-embeddings
docker compose --profile tools run --rm rag-check
docker compose --profile tools up -d chroma-browser
```

The generated root `.env` and `admin/backend/certs/` are local-only and ignored by Git. Root `.env.example` is the canonical Docker env template.
## 11. npm 스크립트

`service/package.json` 기준:

```bash
npm run dev                 # Vite 개발 서버
npm run build               # 프론트엔드 production build
npm run preview             # Vite preview
npm run start               # Express production 서버 실행
npm run db:seed             # 앱용 Postgres schema 적용
npm run rag:seed            # RAG 원본 지식 PG 적재
npm run rag:embeddings      # Chroma vector collection 생성
npm run rag:check           # PG/Chroma 적재 상태 확인
npm run rag:chroma:peek     # Chroma collection 내용 출력
npm run chroma:browser      # Chroma 확인용 간단 GUI 실행
```

## 12. 환경변수

`.env`는 `service` 아래에 둔다.

중요 변수:

```text
PORT
APP_PORT

PG_HOST
PG_PORT
PG_USER
PG_PASSWORD
PG_DATABASE
PG_SSL

CHROMA_URL
CHROMA_PORT
CHROMA_BROWSER_PORT

AZURE_OPENAI_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT
AZURE_OPENAI_EMBEDDING_DEPLOYMENT
AZURE_OPENAI_API_VERSION

Fabric_ID
Fabric_PW
FABRIC_SQL_CLIENT_ID
FABRIC_SQL_TENANT_ID

VITE_AZURE_AD_CLIENT_ID
VITE_AZURE_AD_TENANT_ID
VITE_AI365_LOGIN_URL
VITE_POWERBI_REPORT_ID
VITE_POWERBI_GROUP_ID
```

주의:

`VITE_*` 환경변수는 프론트엔드 빌드 시점에 박힌다. 값을 바꾸면 프론트엔드 또는 Docker 이미지를 다시 빌드해야 한다.

## 13. 개발 작업별로 봐야 할 위치

### 13.1 새 페이지를 추가하거나 기존 페이지 수정

주로 볼 파일:

```text
src/App.jsx
src/components/Sidebar.jsx
src/pages/
src/components/DeployableTab.jsx
```

배포 가능한 커스텀 페이지로 만들려면 `DeployableTab`으로 감싼다.

```jsx
<DeployableTab pageKey="some-page-key">
  <YourPage />
</DeployableTab>
```

### 13.2 위젯 타입 추가/수정

주로 볼 파일:

```text
src/components/widgets/
server/widgetSchema.js
server/dashboardValidation.js
src/utils/gridLayout.js
```

프론트 렌더러와 백엔드 widget props 생성 로직이 서로 맞아야 한다.

### 13.3 RAG 지식 추가/수정

주로 볼 파일:

```text
server/rag-poc/knowledgeBase/
server/schema/
server/rag-poc/corpus.js
server/rag-poc/seedKnowledgeBase.js
```

수정 후:

```bash
docker compose run --rm rag-seed
docker compose run --rm rag-embeddings
docker compose run --rm rag-check
```

### 13.4 Agentic BI metric 추가/수정

주로 볼 파일:

```text
server/agentic-bi/semantic/metrics/*.yaml
server/agentic-bi/semantic/dimensions.yaml
server/agentic-bi/semantic/filters.yaml
server/agentic-bi/semantic/joins.yaml
server/agentic-bi/app/semantic/compiler.js
server/agenticBiPipeline.js
```

일반 compiler로 표현 가능한 metric이면 YAML 쪽을 수정한다.

특수한 SQL 로직이 필요한 metric이면 `server/agenticBiPipeline.js`의 controlled compiler 경로를 봐야 한다.

### 13.5 Fabric 쿼리 문제

주로 볼 파일:

```text
server/fabricClient.js
server/warehousePipeline.js
server/rag-poc/stages/generate.js
server/rag-poc/stages/validate.js
server/agentic-bi/app/semantic/compiler.js
server/agenticBiPipeline.js
```

### 13.6 저장/배포된 대시보드 문제

주로 볼 파일:

```text
src/context/DashboardStateContext.jsx
src/components/DeployableTab.jsx
server/dashboardPagesHandler.js
server/db-init/001_app_schema.sql
```

관련 테이블:

```text
dashboard_saved_pages
dashboard_scopes
```

## 14. New developer first-day checklist

For the Docker path, start at the repository root:

```powershell
cd C:\codex\toyota-dashboard-web
.\scripts\setup-local.ps1
```

Then verify:

```powershell
docker compose ps
Invoke-WebRequest http://localhost:3000/healthz
Invoke-WebRequest http://localhost:8090/ping
Invoke-WebRequest http://localhost:8088/api/health
```

Main areas to read after the stack is healthy:

```text
service/package.json
service/backend/server.js
service/frontend/src/pages/ktws/AgenticBi.jsx
service/backend/agenticBiHandler.js
service/backend/agenticBiPipeline.js
service/backend/agentic-bi/
admin/backend/
admin/frontend/
docker-compose.yml
README.md
```

## 15. Common local troubleshooting

### 15.1 Stack does not start

```powershell
.\scripts\update-local.ps1
docker compose ps
docker compose logs service
docker compose logs admin-backend
docker compose logs admin-frontend
```

### 15.2 Missing or empty ADMIN_SECRET_KEY

Run either setup or update again. Both scripts create `.env` when missing and fill `ADMIN_SECRET_KEY` when it is blank.

```powershell
.\scripts\setup-local.ps1
```

### 15.3 Missing JWT cert files

The same setup/update scripts generate local certs under `admin/backend/certs/`. To force regeneration:

```powershell
docker compose build admin-backend
docker run --rm -v "${PWD}:/workspace" -w /workspace toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs --force
```

### 15.4 Rebuild after code changes

```powershell
.\scripts\update-local.ps1
```

### 15.5 Reset local Postgres/Chroma volumes

```powershell
.\scripts\update-local.ps1 -ResetVolumes
```

This removes local Docker volumes and deletes local Postgres/Chroma data.

### 15.6 Check RAG data

```powershell
docker compose --profile tools run --rm rag-check
```

### 15.7 Start Chroma browser

```powershell
docker compose --profile tools up -d chroma-browser
```

Open:

```text
http://localhost:3002
```
## 16. 현재 기준 주의사항

### 16.1 한글 인코딩 깨짐

일부 소스 파일의 한글 주석/문자열이 깨져 있다.

특히 오래된 README, 주석, 복사본 파일은 그대로 믿기보다 실제 코드 흐름을 기준으로 판단하는 것이 좋다.

### 16.2 `deploy` 폴더는 메인 작업 위치가 아니다

`deploy`, `deploy_backup`에는 현재 코드와 비슷한 파일이 많이 있지만, 과거 배포 산출물 또는 백업 성격이다.

일반 개발은 `service/src`, `service/server`에서 한다.

### 16.3 PG와 Chroma는 같이 관리해야 한다

RAG 지식을 바꿨다면 PG만 바꾸거나 Chroma만 바꾸면 안 된다.

```text
PG seed -> Chroma embedding -> rag-check
```

순서로 확인해야 한다.

### 16.4 Agentic BI는 아직 실험 기능이다

라우트와 백엔드 연결은 되어 있지만, 일반 RAG/Text2SQL보다 실험적이다.

운영 안정성 기준으로는 RAG/Text2SQL 쪽이 더 메인 흐름이고, Agentic BI는 semantic model 기반 BI 엔진을 붙여보는 별도 실험 흐름으로 보는 것이 맞다.

### 16.5 Power BI SSO는 별도 확인 필요

`/ktws/bi`는 Power BI iframe 중심이다.

`BiSso.jsx` 같은 파일은 있지만, 완성된 SSO 플로우라고 단정하면 안 된다. Power BI 인증/임베딩을 건드릴 때는 별도 검증이 필요하다.

## 17. 한눈에 보는 담당 영역

```text
화면 UI 문제:
  src/

라우팅 문제:
  src/App.jsx
  src/components/Sidebar.jsx

AI 채팅 문제:
  src/components/ChatPanel.jsx
  server/chatHandler.js
  server/dashboardCustomizeHandler.js

커스텀 대시보드 문제:
  src/context/DashboardStateContext.jsx
  src/components/DeployableTab.jsx
  server/dashboardPagesHandler.js
  dashboard_saved_pages

RAG/Text2SQL 문제:
  server/rag-poc/
  server/schema/
  Postgres
  Chroma

Chroma 적재/조회 문제:
  server/rag-poc/buildEmbeddings.js
  server/rag-poc/checkDataStores.js
  server/rag-poc/peekChroma.js
  server/rag-poc/chromaBrowser.js

Fabric SQL 문제:
  server/fabricClient.js
  server/warehousePipeline.js
  server/rag-poc/stages/
  server/agentic-bi/app/semantic/compiler.js

Agentic BI 실제 런타임 문제:
  src/pages/ktws/AgenticBi.jsx
  server/agenticBiHandler.js
  server/agenticBiPipeline.js
  server/agentic-bi/

Agentic BI 설계/참고자료 확인:
  agentic_bi_design/
  service/server/agentic_bi_design/

Docker 실행 문제:
  Dockerfile
  docker-compose.yml
  scripts/docker-seed-data.sh
  scripts/docker-up-web.sh
  scripts/docker-bootstrap-rag.sh
  scripts/docker-seed-data.ps1
  scripts/docker-up-web.ps1
  scripts/docker-bootstrap-rag.ps1
  scripts/docker-seed-data.cmd
  scripts/docker-up-web.cmd
  scripts/docker-bootstrap-rag.cmd
```

## 18. 최종 정리

이 프로젝트를 개발할 때의 기준점은 명확하다.

```text
메인 앱:
  service

프론트:
  service/src

백엔드:
  service/server

RAG/Text2SQL:
  service/server/rag-poc
  service/server/schema
  Postgres + Chroma

Agentic BI 실제 런타임:
  service/server/agentic-bi
  service/server/agenticBiPipeline.js
  service/src/pages/ktws/AgenticBi.jsx

Agentic BI 설계 참고자료:
  agentic_bi_design
  service/server/agentic_bi_design
```

처음 개발자는 `agentic_bi_design`에 먼저 들어가서 헤매지 말고, `service`를 기준으로 앱의 실제 실행 흐름을 잡는 것이 맞다.
