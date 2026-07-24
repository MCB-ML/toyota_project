# Test Report — 2026-07-23 세션

## 실제로 실행하고 확인한 것

| 영역 | 방법 | 결과 |
|---|---|---|
| `registry.js` YAML 로드 | 실행 (`loadRegistry()`) | 37 metrics / 12 dimensions / 14 joins / 14 filters / 24 entities, 중복 ID 없음 |
| `ir_schema.js` 구조 검증 | 실행 (정상/비정상 IR 각각) | 정상 IR 통과, 8종 오류 케이스 전부 정확히 잡음 |
| `validator.js` 의미 검증 | 실행 (registry 대상 실제 조회) | unknown metric/dimension, grain 불일치, result too large 등 정상 탐지 |
| `compiler.js` 단일 metric 컴파일 | 실행, 11개 이상 실제 metric×dimension 조합 | 아래 "발견하고 수정한 버그" 참고 — 최종적으로 전부 유효한 T-SQL 문자열로 컴파일 확인(실제 Fabric 실행까지는 안 함) |
| `planner.js` / `schemas.js` Dashboard IR | 실행 (가짜 executionResults) | kpi_card/bar_chart 자동 배정, 검증 통과 확인 |
| `graph.js` 16-노드 파이프라인 | 실행 (가짜 fabricClient) | end-to-end로 SQL 컴파일→실행→검증→인사이트→대시보드IR→최종답변까지 정상 흐름 확인 |
| `run_compiler_checks.js` (golden question 발췌 6건) | 실행 | 6/6 통과 |

## 실행 중 발견하고 그 자리에서 수정한 실제 버그 (7건)

1. **`metric.expression`에 WHERE절이 섞여 있었음** — `SUM(F.cnt) WHERE ...`을 그대로 SELECT 리스트에 넣으면 SQL 문법 오류. `metric_filter` 필드를 분리해서 해결.
2. **필터 규칙(`filters.yaml`)이 원본 GOLD SQL의 별칭(D/C/A 등)을 그대로 복사해 왔음** — 원본 쿼리마다 같은 알파벳이 다른 테이블을 가리켜서(예: 어떤 쿼리는 D=DIM_MNG_USER, 다른 쿼리는 D=DIM_MNG_DEALER) 그대로 재사용하면 즉시 깨짐. 전부 완전한 테이블명으로 정규화.
3. **SC 스코프 필터가 무조건 주입되어, 실제로 `DIM_MNG_USER`를 조인하지 않는 쿼리에서도 존재하지 않는 별칭을 참조**했음 — 컴파일러에 `ensureJoined()` 기반 BFS 조인 해석기를 추가해 필요한 테이블을 그때그때 자동으로 끌어오도록 수정.
4. **`br_mtd_asof_cap`이 캘린더 조인을 요구하는데 컴파일러는 캘린더 조인을 안 함** — 사실 컴파일러가 팩트 자체 날짜 컬럼에 직접 BETWEEN을 걸어 이미 같은 효과를 내고 있어 중복/불필요했음. 해당 rule을 required_filters에서 제거하고 문서화.
5. **`br_pma_three_way`가 DAX 의사코드(`CALCULATE(...)`)를 SQL 조각인 것처럼 등록**되어 있어 그대로 주입하면 컴파일 에러. 문서 전용 규칙으로 재분류하고, 컴파일러가 `sql_fragment: null`인 규칙을 만나면 명시적으로 거부하도록 가드 추가.
6. **BFS 조인 탐색기가 fact 테이블→dimension→다른 fact 테이블 경로를 허용**해서(`FCT_LEAD`→`DIM_MNG_USER`→`FCT_ACTIVITY_v2`) 팬아웃 위험이 있는 조인을 조용히 만들어냄. "출발 fact 테이블이 아닌 fact 테이블에서는 더 이상 뻗어나가지 않는다"는 제약을 추가해 해결하고, 원래 있어야 했던 직접 조인(`FCT_LEAD.tp_key = DIM_CRM_ACT_TYPE.tp_key`)을 `joins.yaml`에 추가.
7. **`lead_mtd_actual`의 진짜 자격 조건은 `FCT_ACTIVITY_v2`에 대한 EXISTS 상관 서브쿼리인데, v1 컴파일러는 flat JOIN+WHERE만 조립 가능** — 두 방향 다(서브쿼리 조건을 flat JOIN으로 흉내 내거나, 아예 빼거나) 조용히 틀린 값을 냄. `not_directly_compilable: true`로 표시해 컴파일 자체를 거부하도록 변경(golden question `gq_17`로 회귀 고정).

이 7건은 전부 "설계 문서만 쓰고 실행은 안 해봄"이었다면 발견되지 못했을 것들 — `agentic_bi_design`의 모든 코드 산출물(`app/`)은 최소 1회 이상 실제로 `node`로 실행해서 결과를 확인했다.

## 아직 실행하지 못한 것 (unresolved / required_input)

- Fabric 웨어하우스 대상 실제 실행 비교(`sql_regression_tests.yaml`) — 이번 세션은 로컬 문자열 컴파일까지만 확인했고, GOLD SQL과의 실측 값 대조는 웨어하우스 연결이 필요.
- LLM 연결 지점(`llmClient`, `fabricClient`) 전부 스텁 — `QuestionNormalizer`/`IntentClassifier`/`MetricDimensionResolver`/`InsightGenerator`/`FinalReviewAgent`의 실제 LLM 프롬프트는 기존 `server/rag-poc/stages/`의 클라이언트 설정을 재사용해 연결해야 함(P4 다음 단계).
- 권한 스코프(`security_policies.yaml` row_level_dealer_access) — 정책 자체가 미확정이라 `authz_03`은 테스트 불가.
- Dashboard IR의 실제 React 렌더링(`frontend/dashboard-renderer/`) — 이번 세션은 스키마/검증기까지만, 실제 컴포넌트 구현은 하지 않음.
