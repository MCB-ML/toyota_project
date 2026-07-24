# Ontology/Semantic Layer 기반 Agentic BI 플랫폼 — 설계 및 구현 보고서

**대상 워크북**: `server/schema/ktws_측정값_쿼리화.xlsx` (13 sheets, 99 visual rows, 67개 distinct GOLD SQL)
**원본 엑셀은 수정하지 않았음** — 모든 산출물은 `agentic_bi_design/` 아래 신규 생성.
**작업일**: 2026-07-23

---

## 1. 엑셀 분석 요약

`extract_workbook.py`로 13개 시트 전체를 기계적으로 파싱했다. 헤더 레이아웃이 시트마다 다르고(컬럼 라벨 기반 매칭 필요), 여러 시트가 "GOLD 쿼리 / GOLD 쿼리 합본 / 최종 GOLD 쿼리 v1 / v2 / 최종 통합 GOLD 쿼리"처럼 초안-병합-최종 버전을 나란히 갖고 있어, 단순히 "가장 오른쪽 컬럼"이나 "GOLD로 시작하는 첫 컬럼"을 집으면 틀린 쿼리(중간 초안)를 GOLD로 오인하는 문제가 있었다. 헤더 텍스트에 우선순위 점수(최종통합 > 최종v2 > 최종v1 > 최종 > 합본 > GOLD)를 매겨 항상 진짜 최종본만 채택하도록 했다. 또한 여러 행이 병합 셀로 하나의 쿼리를 공유하는 경우(예: 시트 1-2의 11개 시각적 개체가 통합 쿼리 1개를 공유) openpyxl이 병합 영역의 non-anchor 셀을 `None`으로 반환하는 문제가 있어, 병합 범위를 앵커 셀로 forward-fill하는 로직을 추가했다.

- 총 99개 visual row, 148개 원문 측정값 문자열, **67개 distinct GOLD SQL**(중복 제거 후)
- `sqlglot`(tsql dialect) AST 분석: 54개 완전 파싱, 13개는 T-SQL `IF/BEGIN/END` 분기가 있어 부분 파싱(해당 분기 안의 로직은 텍스트 스캔으로 보완)
- CTE·로컬 `#temp` 테이블을 걸러낸 뒤 실제 스키마 테이블은 **19개**로 수렴 — 기존에 알려진 14개(DIM_MNG_USER/DEALER, DIM_CRM_ACT_TYPE(_ORDER), DIM_CALENDAR_KTWS, FCT_ACTIVITY_v2, FCT_CONTRACT_KTWS, FCT_LEAD, FCT_CRM_TARGET_M/D, DIM_VEHIC_SPEC/VAR/MDL, DIM_REPURC_SALES_TYPE) 외에 **5개 신규 발견**: `FCT_CRM_TARGET_STS`, `FCT_SC_GROUP_RULE`, `FCT_MNG_CUST_LIST`, `FCT_NPS`, `FCT_HBOARD_MEETING`
- 산출물: `inventory/{workbook_inventory,visual_catalog,measure_inventory,sql_inventory,sql_metadata,table_column_usage,unresolved_items}.json`

가장 중요한 발견: **시트 1-2의 "최종 GOLD 쿼리"는 이미 11개 시각적 개체를 위한 단일 파라미터화 통합 쿼리**였다(`@Year/@MonthNumber/@Brand/@DealerNm/.../@metric` 파라미터, CTE별로 활동/기회/계약 각 지표를 분리). 즉 이 워크북을 만든 분석가는 우리가 지금 설계하려는 "Semantic Query IR + 결정론적 컴파일" 패턴을 SQL 레벨에서 이미 손으로 구현해 두고 있었다 — 이 사실이 Ontology/Semantic Layer 설계 전반의 1차 근거가 됐다.

## 2. 현재 방식(Text2SQL/Text2Chart)의 구조적 문제

기존 RAG 파이프라인(`server/rag-poc/`)은 GOLD SQL 텍스트를 fragment 단위로 잘라 임베딩하고 유사도로 골라 붙이는 방식이다. 이번 분석으로 확인된 한계:

- **같은 "실적"이 쿼리마다 다른 카운팅 규칙을 쓴다** — 예: 계약 "실적"(취소 제외)과 "달성률의 분자"(취소 포함)가 같은 팩트 테이블의 다른 CASE 분기인데, 이름만 보고 SQL을 복사하면 뒤섞인다.
- **분모=0 처리 정책이 도메인마다 다르다** — 활동 진척률은 분모 0→1.0, 기회 진척률은 분모 0→0.0. 하나의 "safe_divide 헬퍼"로 통일하면 원본과 값이 달라진다(`semantic/metrics/activity_metrics.yaml` vs `lead_metrics.yaml` 비교).
- **SC 조직 스코프 필터(창구SC 제외/특정 이름 제외/테스트 계정 제외/딜러 유효성)가 67개 쿼리 중 62~65개에 반복 등장**하는데, 이게 "쿼리마다 복붙된 상수 텍스트"로 존재해서 신규 테스트 계정이 생기면 67곳을 찾아 고쳐야 한다.
- **PMA IN/OUT처럼 이미 알려진 결함**(2-way 축약이 실제 3-way 데이터의 30%를 잘못 분류)이 재발할 여지 — SQL 텍스트 유사도 검색은 "이 조건이 원래 3-way여야 한다"는 지식을 갖고 있지 않다.
- **긴 SQL 전체를 매번 프롬프트/임베딩 대상으로 쓰면 비즈니스 규칙이 SQL 문법에 파묻혀** 재사용도, 검증도 안 된다.

## 3. Ontology 후보와 관계

`ontology/entities.yaml`(24 entities), `ontology/relationships.yaml`(14 registered + 4 unresolved), `ontology/ontology_diagram.mmd` 참고. 후보 구조 대비 확정된 구조의 핵심 차이(`ontology/ontology.yaml`의 `deviations_from_candidate_structure`):

- Customer는 독립 엔터티로 승격하지 못함(`FCT_MNG_CUST_LIST` 컬럼 정의서 없음, unresolved)
- SFX는 별도 엔터티가 아니라 Grade(DIM_VEHIC_SPEC)의 컬럼임을 확인
- Contract/Cancellation/Delivery는 서로 다른 엔터티처럼 보이지만 실제로는 **`FCT_CONTRACT_KTWS` 한 테이블의 상태(cancel_dt/last_retail_sales_dt)** — 이 사실이 Semantic Layer 설계에 직접 반영됨
- ActivityTypeTaxonomy(DIM_CRM_ACT_TYPE + DIM_CRM_ACT_TYPE_ORDER)는 후보 구조에 없었지만 사실상 모든 퍼널 지표의 공통 축이라 승격
- `type_to_type_order` 관계가 **대리키가 아니라 자연키 텍스트(common_tp_nm)로 조인**된다는 위험 발견 — 표기 불일치 시 조용히 매칭 실패할 수 있음

## 4. Semantic Metric 목록

`semantic/metrics/*.yaml` 6개 파일, **총 37개 metric**(고신뢰 25 / 중간신뢰 6 / 낮음·unresolved 6 — `semantic/semantic_model.yaml` `metric_count_by_status` 참고, `registry.js` 실행으로 실측한 값). 전환율/진행률/달성률은 전부 `numerator_metric`/`denominator_metric`을 별도 metric id로 명시했다(값을 expression에 인라인하지 않음 — 완료 기준 준수).

대표 사례:
- `contract_mtd_achievement_rate`의 분자는 `contract_mtd_total_including_cancelled`(취소 포함)이고 `contract_mtd_actual`(취소 제외, 사용자에게 보이는 "실적")과는 다른 metric — 혼동 방지를 위해 아예 별도 id로 분리하고 `display_only_measure: true`로 표시.
- `delivery_ytd_pma_in`/`delivery_ytd_pma_out`은 `pma_yn = 'Y'`/`'N'`만 명시적으로 쓰고, `<> 'N'` 같은 2-way 축약을 코드 리뷰 관례(`br_pma_three_way` 문서 규칙)로 금지.

## 5. 중복 업무 규칙 목록

`semantic/filters.yaml`에 14개 rule_id로 정리(GOLD SQL 정적 분석으로 자동 집계한 출현 빈도 포함, `br_pma_three_way`는 문서 전용 원칙 규칙이라 출현 빈도 집계 대상은 13개). 상위 4개(`br_exclude_front_sc`/`br_exclude_staff_names`/`br_exclude_test_users`/`br_dealer_scope`)는 62~65/67 쿼리에서 반복 — `global_default_filter_bundle`(`sc_scope_default`)로 승격해 컴파일러가 자동 주입하도록 구현했다(`app/semantic/compiler.js`).

## 6. 정의가 충돌하는 측정값 목록

- **"실적" vs "달성률 분자"**(계약) — 4절 참고
- **활동 진척률 vs 기회 진척률**의 분모 0 처리 정책 상이 (1.0 vs 0.0)
- **PMA IN/OUT** — 기존 DAX 측정값이 2-way로 잘못 정의, 이번에 3-way로 교정(`delivery_ytd_pma_in/out`에 `status: corrected_from_known_bug` 표시)
- **`td_funnel_(mtd_preOp)_form`(신청폼 기준) vs `td_funnel_(mtd_preOp)_leadMatch`(리드매칭 기준)** — 둘 다 "시승 실적"이라 불리지만 분자가 다름(`testdrive_metrics.yaml`)
- **`cntrct_mtd_(target)_cond`처럼 `_cond` 접미사가 붙은 측정값**은 DAX 슬라이서 컨텍스트에 따라 값이 갈라지는 조건부 게이지라, 단일 정의로 통일 불가 — 마이그레이션 C 등급 후보

## 7. GOLD 쿼리 마이그레이션 분류

`scripts/build_catalog.py` 실행 결과(`migration/migration_classification.json`, 자동 규칙 기반 1차 분류 — 전량 수작업 리뷰 대체 아님):

| 등급 | 개수 | 기준 |
|---|---|---|
| A (semantic_metric) | 38 | 표준 집계/조직·기간 필터, 이미 metric으로 매핑됨(13개는 실제 source_evidence로 metric id 연결 확인) |
| B (controlled_template) | 16 | 다단계 CTE 통합쿼리(참조 시각적 개체 5개 이상), correlated subquery, window function |
| C (redesign) | 13 | `IF/BEGIN/END` 숨은 분기(정적 분석으로 전체를 못 봄), 하드코딩된 날짜 |

## 8. Agentic BI 목표 아키텍처 (및 기술 스택 결정)

```
자연어 질문 → QuestionNormalizer → IntentClassifier → OntologyResolver
→ MetricDimensionResolver → AmbiguityDetector → AnalysisPlanner → ToolRouter
→ SemanticQueryValidator → SQLCompiler → SQLSafetyValidator → QueryExecutor
→ ResultValidator → InsightGenerator → DashboardPlanner → DashboardIRValidator
→ FinalReviewAgent
```

**스택 결정**: 요청서는 "신규 구현이 필요하면 Python/FastAPI/LangGraph/Pydantic"을 제시했지만, 동시에 "기존 프로젝트 구조가 있으면 기존 기술 스택을 우선 유지"라고 명시했다. 이 저장소는 이미 살아있는 Node.js/Express 기반 Text2SQL RAG 파이프라인(`server/rag-poc/`, 프로덕션 반영됨)을 갖고 있으므로 후자를 따랐다:

- App 런타임: **Node.js**(`app/agents/*.js`, `app/semantic/*.js`, `app/dashboard/*.js`) — 기존 `server/rag-poc/stages/` 패턴과 동일한 모듈 구조
- LangGraph 대신 **명시적 State Machine**(`app/agents/graph.js`) — 요청서가 명시적으로 허용한 대안
- Pydantic 대신 **JSON Schema + 손수 작성한 JS 검증기**(`app/semantic/ir_schema.js`) — 이 저장소에 zod/ajv 의존성이 없고, `dashboardValidation.js`가 이미 같은 스타일을 쓰고 있어 일관성 유지
- 분석 스크립트(`scripts/*.py`)는 요청서가 명시한 대로 **Python**(openpyxl/sqlglot/pandas) — 빌드타임 도구는 런타임 스택과 분리해도 무방하고, sqlglot이 Python 전용이라 다른 선택지가 없었음
- YAML 파서는 신규 의존성을 추가하지 않고 `louis/dashboard/package.json`에 이미 있는 `js-yaml` 재사용

## 9. Semantic Query IR

`schemas/semantic_query_ir.schema.json`(JSON Schema) + `app/semantic/ir_schema.js`(구조 검증, 실행 테스트 완료) + `app/semantic/validator.js`(registry 대상 의미 검증 9종: metric/dimension 존재·grain 호환·join path·필수 필터·권한·시간범위 명확성·중복 metric·결과 크기, 실행 테스트 완료).

## 10. Dashboard IR

`schemas/dashboard_ir.schema.json` + `frontend/component-registry/component_registry.yaml`(14개 컴포넌트) + `app/dashboard/planner.js`(metric_type 기반 자동 컴포넌트 선택 — ratio/conversion/progress 지표는 도넛 금지) + `app/dashboard/schemas.js`(9종 검증: 등록된 컴포넌트인가/쿼리 참조 존재/비율-도넛 오용/카테고리 수/퍼널 순서/레이아웃 겹침 등, 실행 테스트 완료).

## 11. Agent State와 Node 설계

`app/agents/state.js`(AgentState 팩토리) + `app/agents/nodes/`(16개 파일, 번호순). `current_date`는 요청 시작 시 1회 주입되고 모든 노드가 이 값만 참조 — LLM이 상대 날짜를 임의 추론하지 않도록 `time_semantics.yaml`의 `relative_date_resolution_policy`로 강제. `graph.js`로 end-to-end 스모크 테스트(가짜 fabricClient) 통과 확인.

## 12. SQL 및 결과 검증 정책

- **SQLCompiler**(`app/semantic/compiler.js`): 등록된 metric/dimension/join/filter만 사용해 결정론적으로 T-SQL을 조립. BFS로 join 경로를 자동 해석하되, **fact 테이블→dimension→다른 fact 테이블로 라우팅하는 것을 구조적으로 금지**(스타 스키마에서 이런 경로는 거의 항상 팬아웃/카티전 위험이라는 걸 실제 버그로 발견한 뒤 가드 추가 — 아래 14절 참고)
- **SQLSafetyValidator**(`app/agents/nodes/10_sqlSafetyValidator.js`): SELECT/WITH만 허용, DML/DDL 키워드 차단, 다중 쿼리 차단, 최대 결과 행수(500)
- **ResultValidator**(`app/agents/nodes/12_resultValidator.js`): row count, null 비율, percentage 범위(0~500%), ratio/conversion/progress metric의 300% 초과 이상치 탐지 — "SQL 실행 성공 = 정답"으로 판단하지 않음

## 13. Golden Question 테스트

`tests/golden_questions.yaml` 18건(단일/비교/breakdown/YTD/MTD/전환율/달성률/취소율/랭킹/다중필터/복합분석/모호한 질문/권한범위/데이터없음/잘못된 metric/상세리스트/컴파일러 한계 케이스/SC스코프 예외 케이스). 이 중 **6건은 실제로 `tests/run_compiler_checks.js`로 실행해 6/6 통과 확인**(`tests/test_report.md` 참고) — 나머지는 LLM 연결(`llmClient`) 전이라 구조만 정의된 상태.

## 14. 구현 우선순위 (진행 상황)

| 단계 | 상태 |
|---|---|
| P0 엑셀 추출/Catalog | **완료**, 실행 검증됨 |
| P1 Ontology/Semantic 초안 | **완료** |
| P2 Semantic Query IR/Validator | **완료**, 실행 검증됨 |
| P3 단일 Metric SQL Compiler | **완료**, 실행 검증됨(7개 실제 버그 발견·수정 — 아래) |
| P4 Agent Workflow | **완료**(스켈레톤 + end-to-end 스모크 테스트), LLM 연결은 다음 단계 |
| P5 Dashboard IR | **완료**, 실행 검증됨 |
| P6 검증/회귀 테스트 | **완료**(golden question 18건, 실행 가능 6건) |
| P7 예측·Operations Agent 확장 | 미착수(스펙 범위 밖으로 명시) |

**P3 실행 중 발견·수정한 실제 버그 7건**(전부 `tests/test_report.md`에 상세 기록): (1) expression에 WHERE절이 섞여 SQL 문법 오류, (2) filters.yaml이 원본 쿼리별로 의미가 다른 별칭(D/C/A)을 그대로 복사해 즉시 깨짐, (3) SC 스코프 필터가 무조건 주입되어 조인 안 된 테이블 참조, (4) 캘린더 조인이 필요한 규칙을 캘린더 조인 없는 컴파일러에 그대로 등록, (5) DAX 의사코드를 SQL 조각으로 오인, (6) **BFS 조인 탐색기가 fact→dim→fact 경로를 허용해 팬아웃 위험 SQL을 조용히 생성**, (7) `lead_mtd_actual`의 진짜 정의가 EXISTS 상관 서브쿼리라 v1 컴파일러로 표현 불가 — 컴파일 거부로 전환.

## 15. 실제 생성한 파일 목록

63개 파일(이 보고서 포함), `agentic_bi_design/` 아래. 전체 목록은 저장소에서 직접 확인 가능(`find agentic_bi_design -type f`). 요약:

```
agentic_bi_design/
├─ inventory/           7 files  (workbook/visual/measure/sql inventory, sql_metadata, table_column_usage, unresolved)
├─ ontology/             5 files  (ontology.yaml, entities.yaml, relationships.yaml, business_vocabulary.yaml, diagram.mmd)
├─ semantic/            12 files  (metrics/ 6개 + dimensions/joins/filters/time_semantics/security_policies/semantic_model)
├─ schemas/              2 files  (semantic_query_ir, dashboard_ir JSON Schema)
├─ app/                 24 files  (agents/ state+graph+16 nodes, semantic/ registry+compiler+ir_schema+validator, dashboard/ planner+schemas)
├─ frontend/             1 file   (component_registry.yaml)
├─ migration/            1 file   (migration_classification.json, 67건 자동 분류)
├─ tests/                7 files  (golden_questions + 4개 세부 테스트 + 실행 가능 스크립트 + test_report.md)
├─ scripts/              3 files  (extract_workbook.py, parse_gold_sql.py, build_catalog.py)
└─ docs/final_report.md  1 file   (이 보고서)
```

## 16. 해결하지 못한 항목과 추가 필요 자료

- **컬럼 정의서 없이 확정 못한 5개 신규 테이블**: `FCT_MNG_CUST_LIST`, `FCT_HBOARD_MEETING`, `FCT_NPS`, `FCT_SC_GROUP_RULE`, `FCT_CRM_TARGET_STS` — 각각 `ontology/entities.yaml`에 `status: unresolved`로 표시.
- **시승(TestDrive) 유형 코드값**: `DIM_CRM_ACT_TYPE`의 tp_key/common_tp_nm 전체 코드값 목록이 없어 "시승"의 정확한 필터 조건을 100% 확정하지 못함.
- **HOT 리드, 출고 채널(farming/hunting/referral), coalesce 계열 측정값**의 정확한 판정 조건 — DAX 정의만 있고 GOLD SQL 원문 없음.
- **권한 스코프**: 로그인 사용자가 자기 딜러 밖 데이터를 볼 수 있는지 여부를 규정하는 정책 자체가 워크북에 없음(`security_policies.yaml` `row_level_dealer_access` unresolved) — 실제 로그인/권한 체계 정의서 필요.
- **Fabric 웨어하우스 대상 실측 비교**: 이번 세션은 컴파일된 SQL 텍스트까지만 검증했고, GOLD SQL과의 결과값 실측 대조(`sql_regression_tests.yaml`)는 웨어하우스 연결이 필요.
- **LLM 연결**: `QuestionNormalizer`/`IntentClassifier`/`MetricDimensionResolver`/`InsightGenerator`/`FinalReviewAgent`의 실제 프롬프트/모델 호출은 스텁 — 기존 `server/rag-poc/stages/`의 LLM 클라이언트 설정 재사용을 전제로 다음 단계에서 연결 필요.
- **P7(예측/Operations Agent), 실제 React 컴포넌트 구현**: 이번 세션 범위 밖으로 명시적으로 남겨둠.
