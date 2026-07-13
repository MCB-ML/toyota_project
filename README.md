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
- **Fabric 데이터 웨어하우스 실시간 연결**: Agora/Karete/BP_KTWS 3개 엔드포인트에 Azure AD 인증으로
  접속, LLM이 자연어 질문을 실제 SQL로 변환해 라이브 조회하는 백엔드 파이프라인 완성 —
  KTWS 대시보드 커스텀 페이지와 별도의 `/api/warehouse-query`(백엔드만, UI 미연결) 둘 다에서 사용
- **KTWS Power BI 리포트 임베드**: 현재는 iframe 방식이라 별도 로그인 필요 (SSO 전환은 IT팀의
  Azure AD 앱 등록 필요 — 코드는 준비됨, 상세는 `dashboard/README.md`)

### 진행 중 / 남은 것
- AI 대시보드 커스터마이징 기능은 KTWS 1개 페이지에만 적용 — 나머지 12개 페이지는 정적 하드코딩 JSX
- `/api/warehouse-query`(자유 질문형 라이브 쿼리)는 백엔드까지만 완성 — 채팅 UI에는 아직 연결 안 됨
  (KTWS 대시보드 커스텀 페이지의 위젯 생성 파이프라인과는 별개 엔드포인트)
- Power BI SSO는 IT팀의 Azure AD 앱 등록·admin consent 대기 중

## 대시보드 생성 챗봇 아키텍처

서로 다른 데이터 소스를 쓰는 **3개의 독립된 파이프라인**이 있다:

| 엔드포인트 | 용도 | 데이터 소스 | UI 연결 |
|---|---|---|---|
| `/api/chat` | AI 어시스턴트 전체 페이지 — 일반 Q&A + 차트 자동 생성 | `public/data/*.json` (사전 집계) | 연결됨 |
| `/api/dashboard-customize` | KTWS 대시보드 커스텀 페이지 — 위젯 추가/삭제/수정 | **Fabric SQL 엔드포인트 (실시간)** | 연결됨 |
| `/api/warehouse-query` | 자유 질문형 라이브 쿼리 (챗봇 화면 없음) | **Fabric SQL 엔드포인트 (실시간)** | 미연결 (백엔드만) |

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
