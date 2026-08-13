# rag-poc — Pattern Card / SQL Fragment 기반 Text2SQL 파이프라인

KTWS 대시보드 챗봇의 Text2SQL을 **TOPIC 분류 방식**(`schemaLoader.js` + `warehouseTools.js`)과
비교 평가하기 위해 시작한 RAG POC. GOLD 검증된 15개 측정값 기준 RAG 14~15/15(93%) vs TOPIC
8~9/15(53~60%)로 정확도 차이가 크게 확인돼([test-report.md](test-report.md)),
**지금은 프로덕션에 "RAG 우선 → TOPIC 폴백" 하이브리드로 적용돼 있다**:

- `server/warehousePipeline.js`의 `runWarehouseQuery`
- `server/chatHandler.js`의 `fetchLiveTopicData`

두 곳 다 이 디렉터리의 `runPipeline()`(`pipeline.js`)을 먼저 시도하고, Pattern Card가
매칭되지 않거나(`error`) Stage9b 실행 검증에 실패하면(`liveCheckPassed:false`) 기존 TOPIC
분류 로직(각 파일의 `*ViaTopic` 함수)으로 폴백한다 — RAG는 51개 Pattern Card(2026-07-21
기준, `ktws_측정값_쿼리화.xlsx` 갱신분 25건 추가 반영)로 커버되는 범위만 다루므로, TOPIC을
완전히 대체하면 그 밖의 질문에 대한 기존 커버리지가 퇴보하기 때문이다.

## 파이프라인 구성 배경

초기 버전은 "질문과 가장 비슷한 완성된 GOLD SQL 예시를 통째로 검색해서 프롬프트에 넣고
한 번에 SQL을 생성"하는 4단계 구조였다. 실측 결과, few-shot 저장소가 26개를 넘어가자
백필 로직이 관련성 제한 없이 거의 전체를 프롬프트에 욱여넣었고, 그 결과 "계약 건수"처럼
`qualified_lead` CTE가 필요한 질의에서 LLM이 정답 예시를 검색은 해왔음에도 CTE를 통째로
빼먹고 틀린 값(469, 정답 280)을 내는 사고가 재현됐다.

지금 구조는 긴 SQL을 통째로 검색·전달하는 대신 **Pattern Card(짧은 의도 설명) → Query Plan
(단계 목록) → SQL Fragment(CTE 단위 조각) → 조각별 독립 생성 → 결정적 조립(Composer) →
실행 검증·부분 재수정**으로 쪼갠 10-Stage 파이프라인이다. 재설계 후 같은 "계약 건수" 질의가
`repairAttempts: 0`으로 첫 시도에 정답(280)을 낸다 — 조각을 독립된 프롬프트로 생성하면
경쟁하는 예시들 사이에서 구조를 놓치는 일이 구조적으로 줄어든다.

## 10-Stage 파이프라인

```
사용자 질문
  → Stage 0  질문 구조화 (intent/metrics/dimensions/time_range/entities)
  → Stage 0.5 파라미터 확정 (결정적 JS — 오늘 날짜 기준 연월/월초/월말 계산, 전체 조각에 동일 값 배포)
  → Stage 1  스키마(테이블) 후보 검색 (Chroma)
  → Stage 2  Pattern Card 검색 (Chroma, 설명/의도/측정값/연산만 임베딩 — SQL 없음)
  → Stage 3  Pattern Card 선택 (LLM 분류 호출 1회 — 이미 검증된 fragment 체인 중 하나를 고름)
  → Stage 4  선택된 Pattern의 fragment_ids를 Postgres ID로 직접 조회 (검색 아님)
  → Stage 5  누락 테이블 백필 (Stage1이 못 찾은, fragment가 참조하는 테이블)
  → Stage 6  참조된 Business Rule + 용어 사전 검색
  → Stage 7  Fragment별 SQL 본문을 독립된 LLM 호출로 생성 (다른 fragment 텍스트는 프롬프트에 없음)
  → Stage 8  Composer가 결정적으로 WITH ... 조립 (LLM 아님)
  → Stage 9  구조 lint(참고용) + Fabric 실행 검증(권위 있음)
  → Stage 10 실패 시 원인 fragment만 식별해 재생성 (최대 2회)
```

## 핵심 데이터 모델

| 개념 | 저장소 | 임베딩 대상 |
|---|---|---|
| **Pattern Card** (`query_patterns`) | Postgres + Chroma(`ktws_patterns`) | description/intent/metrics/operations만 — SQL 없음 |
| **SQL Fragment** (`sql_fragments`) | Postgres + Chroma(`ktws_fragments`) | fragment_name/description만 — `sql_template` 본문은 절대 임베딩 안 함 |
| **Business Rule** (`business_rules`) | Postgres + Chroma(`ktws_rules`) | term/description |
| **원본 GOLD SQL** (`sql_sources`) | Postgres만 | 임베딩 안 함, 감사(audit)용 |

같은 업무 규칙(`br_qualified_lead_def` 등)을 여러 Fragment가 서로 다른 SQL로 구현할 수
있다는 게 핵심 — 규칙은 하나, 구현은 다운스트림 요구에 맞게 여러 개(`frag_qualified_lead_full`
vs `frag_qualified_lead_key`).

`server/rag-poc/knowledgeBase/*.js`가 원본 데이터(26 sources → 10 rules + 40 fragments +
26 patterns로 분해), `seedKnowledgeBase.js`가 Postgres에, `buildEmbeddings.js`가 Chroma에
싣는다.

## 실행

```bash
node server/rag-poc/seedKnowledgeBase.js       # Postgres 지식베이스 시딩(멱등)
node server/rag-poc/buildEmbeddings.js --force # Chroma 임베딩 재생성
node server/rag-poc/demoPipeline.js            # 빠른 smoke test (Fabric 미실행)
node server/rag-poc/inspectQuery.mjs "<질문>" --execute  # TOPIC vs RAG 비교, 실제 실행까지
```

`server/rag-poc/compare.ipynb`는 `inspectQuery.mjs`를 서브프로세스로 호출해 각 Stage의
선택 결과를 표로 보여주는 뷰어 노트북이다.

GOLD 쿼리 15개 전체를 대상으로 한 정답률/응답시간 비교는
[test-report.md](test-report.md) 참고 (RAG 14/15 vs TOPIC 8/15).

## 인용한 논문

설계 과정에서 참고한 Text2SQL 연구들. 전부 "긴 SQL을 어떻게 다루기 쉬운 단위로 쪼개고,
실행 결과로 검증할 것인가"라는 같은 문제의식을 다른 각도에서 다룬다.

| 논문 | 이 설계에 반영된 것 |
|---|---|
| **Spider 2.0** | 실제 기업 환경에서 긴 SQL과 대형 스키마가 얼마나 어려운지 보여주는 근거 자료. 이 프로젝트의 22테이블/26패턴 규모에서도 재현된 문제(few-shot 백필이 통제 없이 커지면 생성 품질이 떨어짐)가 훨씬 큰 스케일에서 이미 보고된 현상임을 뒷받침한다. |
| **DIN-SQL** | 난이도 분류 → 분해 생성 → self-correction 흐름. Stage 0의 `estimated_complexity` 분류와 Stage 10의 오류 기반 부분 재생성(self-correction) 설계의 직접적 참고. |
| **MAC-SQL** | Selector–Decomposer–Refiner 멀티 에이전트 구조. Stage 1~2(Selector: 스키마/패턴 후보 선정) → Stage 3~7(Decomposer: 계획 수립 + 조각별 생성) → Stage 9~10(Refiner: 검증 + 재수정)의 3단 역할 분리가 이 구조를 그대로 따른다. |
| **Semantic Decomposition / QPL** | 긴 SQL을 문자열이 아니라 실행 계획(쿼리 플랜)으로 분해한다는 발상. `sql_fragments`의 `dependencies`(순서 있는 CTE 의존성 체인)가 사실상 QPL의 쿼리 플랜을 우리 도메인에 맞게 단순화한 버전이다. |
| **RESDSQL / NatSQL** | SQL skeleton·중간 표현으로 생성 부담을 줄이는 접근. `sql_template`을 "그대로 베낄 참고 골격"으로 제시하고 리터럴 값만 교체하게 한 Stage 7 프롬프트 설계(`generate.js`)가 이 아이디어의 축소판이다 — 우리는 골격 자체를 GOLD 쿼리에서 그대로 가져오므로 완전한 skeleton parser가 필요 없었다. |
| **CHESS** | 대형 스키마 검색 + 후보 생성 + 반복 수정 + 단위 테스트까지 포함한 실서비스형 구조. Stage 9b(Fabric 실행)를 "단위 테스트"처럼 매 실행 시 강제하고, Stage 10에서 실패한 부분만 반복 수정하는 루프가 CHESS의 iterative refinement를 직접 참고했다. |
| **PICARD / Execution-Guided Decoding** | 문법·실행 오류를 디코딩 단계에서 통제하는 검증 계층. 이 프로젝트는 제약 디코딩까지는 안 갔지만, Stage 9a(구조 lint, 참고용) + Stage 9b(Fabric 실제 실행, 권위 있음)의 이중 검증과 Stage 10의 오류 메시지 기반 재생성이 같은 목적(실행 결과로 생성을 통제)을 후처리 루프로 구현한 것이다. |

## 알려진 한계

- Stage 7이 계획 단계 수만큼 개별 LLM 호출을 해서(보통 2~5개) 쿼리당 지연시간이 TOPIC
  경로보다 길다(RAG 성공 시 LLM 약 7회 + Fabric 왕복 2회로 평균 8.6초, TOPIC은 LLM 2회 +
  Fabric 1회로 평균 6.7초 — `test-report.md`). 프로덕션 하이브리드 경로(`warehousePipeline.js`,
  `chatHandler.js`)는 이 지연을 그대로 감수하고, RAG가 실패해 TOPIC으로 폴백하는 최악의
  경우 두 지연시간이 합쳐진다(대략 15초 안팎). 매 요청마다 RAG/TOPIC을 병렬로 동시에 돌리는
  방식은 정확도 이득이 없는 요청에도 LLM 비용을 두 배로 내므로 채택하지 않았다(순차 실행).
  `demoPipeline.js`/`runCompare.js` 같은 배치 평가 스크립트는 `liveValidate:false`/
  `runRetrieval()`로 이 비용을 건너뛴다.
- Fragment 생성이 독립적이라, 프롬프트에 명시하지 않은 값(리터럴 외의 세부 로직)은 여전히
  fragment마다 다르게 생성될 수 있다 — Stage 9b + Stage 10이 안전망이지 완전한 방지책은
  아니다.
- Pattern Card 51개는 전부 `ktws_측정값_쿼리화.xlsx`에서 손으로 검증한 GOLD 쿼리 기반이라,
  이 51개 의도를 벗어나는 질문은 가장 비슷한(하지만 부정확할 수 있는) Pattern Card로 강제
  매칭되거나 `reject_plan`으로 거부된다 — 프로덕션에서는 TOPIC 폴백이 이 범위 밖 질문을
  받아주므로 커버리지 자체는 퇴보하지 않지만, 그 51개 밖에서는 RAG의 정확도 이득도 없다.
  Pattern Card 저장소를 늘리는 게 근본적인 커버리지 확장 방법이다.
- Pattern Card가 늘어나면서 서로 다른(하지만 둘 다 GOLD 기반인) 정의가 같은 자연어 질문에
  동시에 매칭될 수 있다 — 예: "영업기회 건수"는 "당월활동실적" 버전과 "당월전체실적(coalesce)"
  버전 둘 다 후보가 되며, Stage3가 그때그때 다른 쪽을 고를 수 있다(`test-report.md`의
  "새로 생긴 애매성" 항목 참고). 둘 다 오답은 아니지만 사용자가 어느 정의를 원하는지
  질문만으로는 모호할 수 있다.
- RAG 경로가 동작하려면 배포 환경에 Postgres(`server/db-init/002_rag_poc.sql` 스키마:
  `sql_sources`/`business_rules`/`sql_fragments`/`query_patterns`)와 Chroma(`ktws_tables`/
  `ktws_patterns`/`ktws_fragments`/`ktws_rules`/`ktws_glossary` 컬렉션)가 로컬
  docker-compose뿐 아니라 실제 배포 대상에도 떠 있어야 한다 — `docker-compose.yml`에 두
  서비스가 이미 정의돼 있으므로 같은 compose 스택을 배포하면 별도 인프라 구성 없이 충족된다.
  둘 중 하나라도 연결이 안 되면 `runPipeline()`이 예외를 던지는데(Stage1/2 검색 실패),
  `warehousePipeline.js`/`chatHandler.js`는 이 호출을 try/catch로 감싸 TOPIC 폴백으로
  흡수하므로 Postgres/Chroma 장애 시에도 요청 자체는 TOPIC 단독 경로로 정상 응답한다(단,
  그 경우 RAG의 정확도 이득은 장애가 풀릴 때까지 없다).
