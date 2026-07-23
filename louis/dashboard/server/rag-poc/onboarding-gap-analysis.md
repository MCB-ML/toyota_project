# 제안된 시맨틱 레이어 vs 기존 구현 — 매핑 및 갭 분석

배경: "긴 SQL이 매 topic마다 슬라이서·SC 제외조건·조인·MTD/YTD·STRING_SPLIT·NULL=전체
조건을 반복해서 학습/RAG 문서에 그대로 들어가는 게 문제"라는 제안이 있었다. 확인 결과
이 문제의식대로 설계된 시스템이 `server/rag-poc/`에 **이미 구현되어 프로덕션에서
동작 중**이다(`README.md` 참고). 이 문서는 (1) 제안된 개념과 기존 구현을 1:1로
매핑하고, (2) 실제로 비어있는 부분만 gap으로 정리한다. 처음부터 새 아키텍처를
설계할 필요는 없다.

## 1. 개념 매핑

| 제안된 개념 | 기존 구현 | 위치 |
|---|---|---|
| 메트릭 정의(metric card) | `business_rules` 낱개는 아니고, **Pattern Card + Fragment 조합**이 사실상 메트릭 정의 역할 (예: `pat_activity_count_mtd` → `frag_activity_count_scalar`) | `knowledgeBase/queryPatterns.js`, `sqlFragments.js` |
| 파생 측정값(진행률/전환율, formula+의존성) | 공식 dependency graph는 없음 — `*_progress_ratio_select`/`*_ratio_select` 같은 **개별 fragment**가 분자/분모 CTE를 참조해서 SQL로 직접 계산 (예: `pat_activity_progress_rate`의 `fragment_ids` 체인) | `sqlFragments.js`의 `*_ratio_select` 계열 |
| 공통 필터 정책(SC 제외 등) | `business_rules` — `condition_expression` 필드에 SQL 조건, `related_tables`/`related_columns`로 스코프 지정. Fragment는 `business_rule_ids`로 참조만 하고 SQL은 각자 구현 | `knowledgeBase/businessRules.js` (14개: `br_exclude_front_sc`, `br_exclude_staff_names`, `br_exclude_test_users`, `br_active_staff`, `br_qualified_lead_def` 등) |
| 차원·조인 그래프 | 별도 조인 그래프 객체는 없음 — 조인은 각 fragment의 `sql_template`/`input_tables`에 이미 박혀 있고, `queryPatterns.js`의 `dimensions` 필드가 어떤 축으로 그룹핑 가능한지만 선언 | `sqlFragments.js` (`input_tables`), `queryPatterns.js` (`dimensions`) |
| 시간 범위 규칙(MTD/YTD 매크로) | `br_yearmonth_scope` 룰 + **Stage 0.5가 결정적 JS로 계산**(연월/월초/월말) 해서 전체 fragment에 동일 값을 배포 — LLM이 날짜 계산을 하지 않음 | `stages/structure.js` (파라미터 확정), `businessRules.js`의 `br_yearmonth_scope` |
| NULL=전체 처리 | SQL `IS NULL OR` 형태로 남기지 않고, **미지정 엔티티는 WHERE 절 자체를 생성 단계에서 제거** — 조건부 SQL 분기 자체가 안 만들어짐 | `stages/structure.js`의 `resolveParameters` |
| Query Shape(단일 KPI/차원별 집계/시계열/퍼널/목표대비/상세목록/순위) | `queryPatterns.js`의 `intent` 필드(`count`/`breakdown`/`ratio` 등)가 유사 역할, 다만 제안만큼 명시적 shape 분류 체계는 아님 | `queryPatterns.js` |
| QuerySpec(구조화 중간표현) | `Pattern Card 선택(Stage 3) + fragment_ids(Stage 4)` 조합이 사실상 QuerySpec 역할 — "어떤 메트릭·어떤 조각 체인" 자체가 구조화된 계획 | `pipeline.js` Stage 0~4 |
| SQL 조립기(컴파일러) | `composeSql` — Fragment별로 독립 생성된 SQL 본문을 결정적으로 `WITH ...`로 조립. LLM 아님 | `stages/generate.js:90-106` |
| SQL 검증기 | 구조 lint(참고용) + Fabric 실제 실행 검증(권위 있음) + 실패 시 원인 fragment만 재생성(최대 2회) | `pipeline.js` Stage 9~10 |
| GOLD 쿼리의 역할(정답 데이터/회귀테스트) | 이미 그렇게 쓰이고 있음 — `sql_sources`는 LLM에 전달되지 않고 감사·평가용으로만 보관, `test-report.md`가 GOLD 15개 기준 회귀 결과를 기록 | `knowledgeBase/sqlSources.js`, `test-report.md` |

결론: 제안한 7단계 구조 중 6개는 이름과 세부 구현만 다를 뿐 이미 존재한다. 유일하게
공식화가 안 된 건 "파생 지표 dependency graph"뿐이고, 이것도 fragment 체인이 사실상
같은 일을 하고 있어서 — 없다기보다 "그래프로 명시되지 않고 fragment 안에 암묵적으로
있다" 쪽에 가깝다.

## 2. 실제 갭 (문서화가 아니라 작업이 필요한 부분)

1. ~~신규 topic 미편입~~ **정정(2026-07-22): 틀린 진단이었다.** 처음엔 "판매목표_일별이
   51개 Pattern Card 밖"이라고 썼는데, 실제로는 이미 `pat_sales_target_by_dealer`/
   `pat_sales_target_trend_by_model` 패턴과 `frag_sales_target_by_dealer`/
   `frag_sales_target_trend_by_model` fragment가 존재했다(`src_fs16`/`src_fs17`,
   "GOLD 미검증" 표시). 다만 **이 fragment들의 `sql_template`에도 routing.md와 똑같이
   `ktws.` 스키마 접두사가 빠져 있었다** — `sql_fragments`의 `verified` 필드는
   `pipeline.js`/`stages/*` 어디서도 선택 로직에 쓰이지 않는(grep 0건) 순수 메타데이터라,
   Stage 3가 이 fragment를 정상적으로 고를 수 있고 Stage 7은 `sql_template`을
   "그대로 베낄 골격"으로 취급하므로(README §5 RESDSQL/NatSQL 참고) **RAG 경로도
   TOPIC과 똑같은 스키마 누락 버그를 그대로 재생산할 뻔했다.** `sqlFragments.js`/
   `sqlSources.js`에 `ktws.` 접두사를 추가해 수정 완료.
2. **STRING_SPLIT 다중선택 미지원** — `businessRules.js`/`sqlFragments.js`/
   `stages/structure.js` 어디에도 `STRING_SPLIT` 패턴이 없다(전체 grep 결과 0건).
   딜러/브랜드 다중 선택이 필요한 질문은 현재 RAG 경로가 처리 못 하고 TOPIC으로
   폴백하거나, TOPIC 경로에서 매번 LLM이 즉석으로 SQL을 새로 만든다.
3. **파생 지표가 명시적 formula로 선언되어 있지 않음** — `table/*.yaml`의 `measures`는
   전부 원본 컬럼 1개짜리 flat 집계(sum/avg)뿐, "진행률=실적/목표" 같은 비율은
   fragment SQL 안에 하드코딩돼 있다. 지금 방식(fragment 체인)도 동작은 하지만,
   같은 분자/분모 조합이 여러 fragment에 중복 등장할 가능성이 있다 — 우선순위는
   낮음(당장 깨진 게 없음).
4. **차량재고(`FCT_AVAIL_STOCK`, `src_fs18`, `frag_stock_by_dealer`)도 같은 스키마
   누락 패턴을 갖고 있을 가능성이 높음** — 이번 파일럿 범위 밖이라 손대지 않았지만,
   동일 증상이 재발할 수 있는 후보로 남겨둔다.
5. ~~SC 출고 매트릭스(`frag_sc_delivery_matrix_select`) 실행 실패~~ **해결됨
   (2026-07-22, 같은 날 후속 세션)** — 원인은 이 fragment의 `sql_template`이 이미
   완결된 다중 CTE 쿼리인데 Stage 7이 모든 fragment에 "WITH 쓰지 말고 SELECT 하나만"
   규칙을 예외 없이 적용해 CTE 정의부를 통째로 잘라냈기 때문. `self_contained` 플래그를
   신설해 이 fragment류만 예외 처리하도록 고쳤다. 상세는
   [pilot-브랜드별_출고평균대수.md](pilot-브랜드별_출고평균대수.md) 참고.
6. ~~Dimension 파라미터화 미구현~~ **1단계 구현 완료 (2026-07-22)** — `{{GROUP_DIM}}`
   자리표시자 + `knowledgeBase/dimensions.js` 카탈로그 + `pipeline.js` Stage 3.5(결정론적
   치환)로 "출고평균대수" measure 하나가 딜러/브랜드/전시장/부서/SC 5개 dimension 요청을
   전부 fragment 하나로 처리하도록 전환·검증 완료. 나머지 fragment 카탈로그로 확장은
   미완 — 설계·구현 상세는 [design-scaling-improvements.md](design-scaling-improvements.md) §2 참고.
7. ~~결과 크기 안전장치 없음~~ **일부 구현 완료 (2026-07-22)** — 실행시간 30초 초과 시
   취소 후 재질문하는 `queryFabricWithTimeout`을 4개 실행 지점(RAG/TOPIC × chat/dashboard)에
   전부 적용. 행 수 기반 감지와 TOP N 자체 제거/재검토는 아직 —
   [design-scaling-improvements.md](design-scaling-improvements.md) §1 참고.
8. **`server/`와 `deploy/server/` 둘 다 실사용 트리 — 한쪽만 고치면 절반만 배포된다.**
   `louis/dashboard/server/`(로컬 dev용)와 `louis/dashboard/deploy/server/`(Azure 배포
   번들, `deploy/startup.sh`가 `/home/site/wwwroot`를 참조 — App Service 관례)가 별도로
   존재한다(심볼릭 링크 아님, git 파일 개수도 다름: 33개 vs 233개). 처음엔 `server/`를
   "오래된 사본"으로 착각해 검증 명령을 `deploy/` 없이 실행했다가 무효한 결과를 낸 적이
   있고(정정: `pilot-판매목표_일별.md` 상단), 이후엔 반대로 새 fix들을 `deploy/server/`에만
   적용하고 `server/`엔 반영을 잊을 뻔했다 — 실제로 `server/`엔 이미 `deploy/`의 예전 기능이
   커밋 안 된 채 부분적으로 수동 이식돼 있는 상태였다(예: `server/fabricClient.js`에
   `deploy/`의 `requestTimeout: 60000` fix만 미리 옮겨져 있었음). **fix를 하나 끝내면
   `deploy/server/`에서 검증한 뒤, 같은 파일을 `server/`의 대응 경로로 복사하고
   `node server/rag-poc/seedKnowledgeBase.js` + `buildEmbeddings.js --force`를 그쪽
   경로로도 한 번 더 실행할 것.** 로컬에서는 두 트리가 같은 `louis/dashboard/.env`(→ 같은
   Postgres/Chroma)를 보므로 재시딩 자체는 멱등이라 두 번 해도 안전하다.

## 3. 파일럿 결과

판매목표_일별에 한해 (1)의 스키마 버그를 고치고, TOPIC vs RAG 실측 비교를
`pilot-판매목표_일별.md`에 별도로 기록했다. 이어서 사용자가 지적한 "7. SC 출고 현황"
시트 기반 SC 매트릭스 실행 버그를 근본 원인까지 고치고, 브랜드별 출고 평균대수 신규
패턴을 추가한 결과는 `pilot-브랜드별_출고평균대수.md`에 기록했다 — 방법론/판정기준/결과는
각 문서 참고.
