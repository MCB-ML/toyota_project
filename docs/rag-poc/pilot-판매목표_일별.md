# 판매목표_일별 파일럿 — TOPIC vs RAG 비교 보고서

> **정정(같은 날 후속 세션)**: 이 보고서의 최초 검증은 `louis/dashboard/server/`(구버전,
> git에 33개 파일만 추적되는 오래된 사본)에서 실행됐다 — 실제 코드 수정은 전부
> `louis/dashboard/deploy/server/`(233개 파일, 실제 운영 트리)에 했는데 `node
> server/rag-poc/...` 명령을 `cd louis/dashboard` 상태에서 실행해 잘못된 사본을 테스트한
> 것. `deploy/server/`를 명시해서(`node deploy/server/rag-poc/...`) 재검증한 결과
> 아래 결과(#1, #2)는 그대로 재현됐다 — 결론은 바뀌지 않는다. 이후 모든 명령은
> `deploy/server/` 경로를 명시한다. 브랜드별 평균(#3)의 후속 조치는
> [pilot-브랜드별_출고평균대수.md](pilot-브랜드별_출고평균대수.md) 참고.

**테스트 일시**: 2026-07-22
**배경**: "브랜드별 출고 평균대수" 질문이 `Invalid object name 'KPI_W.FCT_SALES_TARGET_DAILY'`
오류로 실패한 사건에서 시작. 원인은 TOPIC 경로(`schema/routing/판매목표_일별.md`)의
few-shot SQL이 스키마 접두사(`ktws.`) 없이 `FROM FCT_SALES_TARGET_DAILY`로 적혀 있었기
때문. 조사 중 **RAG 경로(`knowledgeBase/sqlFragments.js`, `sqlSources.js`)의
`frag_sales_target_by_dealer`/`frag_sales_target_trend_by_model`에도 같은 버그가
독립적으로 존재**한다는 걸 발견해 함께 고쳤다 (`onboarding-gap-analysis.md` §2-1 참고).

## 테스트 방법

이 topic은 `ktws_측정값_쿼리화.xlsx` 기준 GOLD 쿼리가 없는("GOLD 미검증") 영역이라
`test-report.md`처럼 엑셀에서 정답을 가져올 수 없다. 대신 라우팅 문서/fragment의
원본 SQL을 직접 Fabric에 실행해 **수동 GOLD 값**을 구하고, 그 값과 TOPIC/RAG 양쪽
결과를 대조했다. `node server/rag-poc/inspectQuery.mjs "<질문>" --execute`로 두 경로를
동시에 실행(TOPIC은 `classify_topic`+`buildWidgetQueryTools`, RAG는 `runPipeline()`).

세 가지 질문으로 커버리지 경계까지 확인:
1. 기존 Pattern Card와 1:1로 대응하는 질문(딜러별 목표)
2. 기존 Pattern Card와 1:1로 대응하는 질문(모델별 일일 추이)
3. **원래 사고를 낸 질문 그대로**("브랜드별 출고 평균대수") — 이 topic의 어떤
   Pattern Card/few-shot에도 없는 "브랜드 단위 평균" 조합이라 커버리지 밖 케이스로 취급

## 결과

| # | 질문 | GOLD(수동 검증) | TOPIC 결과 | TOPIC 시간 | RAG 결과 | RAG 시간 | RAG 재수정 |
|---|---|---|---|---|---|---|---|
| 1 | 2026년 4월 딜러별 출고 목표와 계약 목표를 보여줘 | 16개 딜러, 합계 출고 21,725 / 계약 37,205 (직접 실행) | 16행, 렉서스 강남 3,864/6,868 등 **행 단위로 GOLD와 완전 일치** ✅ | 6,254ms | 16행, **행 단위로 GOLD와 완전 일치** ✅ | 9,201ms | 1 |
| 2 | 모델별 일일 계약 목표 추이를 보여줘 | 전체 96,632행 / co_trgt_daily 합계 48,404(무제한, 두 SQL 모두 TOP 절 제거 후 재실행해 확인) | TOP 100행, 스키마 오류 없음, 컬럼 구조 정상 ✅ | 3,701ms | TOP 100행, 스키마 오류 없음, 컬럼 구조 정상 ✅ | 7,261ms | 1 |
| 3 | 브랜드별 출고 평균대수 (원 사고 질문) | 없음 — 이 topic에 해당 개념의 Pattern Card/예시가 없어 "정답"이 정의 안 됨 | `계약` topic으로 분류(판매목표_일별 아님), `AVG(cnt)`가 항상 1이라 사실상 무의미한 값 반환 — 오류는 없지만 **의미상 오답** ⚠️ | 3,506ms | `pat_sc_delivery_matrix`(SC별 출고 매트릭스) 선택 — **다른 버그로 실행 실패**: `Invalid object name 'detail'` ❌ | 14,465ms | 2(모두 실패) |

## 판정 기준

- **1, 2번**: 스키마 오류(`Invalid object name`) 재발 여부가 1차 기준(이번 버그의 직접
  회귀 테스트) — 통과. 2차로 GOLD와 값 일치 여부(1번은 행 단위, 2번은 TOP 절을 걷어낸
  전체 합계 기준) — 통과.
- **3번**: 정량적 정오답 판정이 불가능해(GOLD 자체가 없음) 구조적 판단만 기록 — SQL이
  실행됐는지, 질문 의도(브랜드×평균×출고대수)에 맞는 topic/pattern을 골랐는지.

## 결론

1. **스키마 버그는 TOPIC/RAG 양쪽 모두에서 해소됨** — 1, 2번 케이스에서 재현되지 않았고
   값도 정확히 일치한다. 이번 수정이 두 경로 모두에 필요했던 이유가 실측으로 확인됐다.
2. **3번(원 사고 질문)은 애초에 이 topic 안에서 답이 안 나오는 질문이었다** — TOPIC은
   전혀 다른 topic(`계약`)으로 새서 의미 없는 값(`AVG(cnt)`=1)을 냈고, RAG는 개념적으로는
   더 가까운 패턴(SC별 출고 매트릭스)을 골랐지만 그 패턴 자체가 별도 버그(`frag_sc_delivery_matrix_select`가
   `dependencies: []`인데 `sql_template`이 정의되지 않은 CTE `detail`/`grand`를 참조)로
   실행 실패했다. 결과적으로 둘 다 이 질문에 쓸모 있는 답을 못 준다 — TOPIC은 조용히
   틀린 값을, RAG는 시끄럽게 실패를 낸다는 차이만 있다. **원 질문이 성립하려면
   "브랜드별 평균 출고대수" 전용 Pattern Card/fragment가 새로 필요하다**(이번 파일럿
   범위 밖).
3. **응답시간**: RAG가 TOPIC보다 1.5~4배 느리다(fragment별 개별 LLM 호출 + 반복 검증
   때문, `test-report.md`에서도 동일 경향 확인됨). 3번처럼 재수정이 반복되면 격차가
   더 벌어진다(14.5초, 2회 재시도 후에도 실패).

## 파일럿 중 발견한 추가 버그 (범위 밖, 후속 과제로 남김)

`frag_sc_delivery_matrix_select`(SC별 출고평균대수 매트릭스, `pat_sc_delivery_matrix`)가
`dependencies: []`(자기 완결형으로 선언)인데 `sql_template`이 `detail`/`grand`라는
이름의 CTE를 참조한다 — Stage 7이 이 fragment의 `sql_body`를 생성할 때 상위 `WITH detail
AS (...), grand AS (...)` 정의부를 포함하지 못해 Composer가 조립한 최종 SQL에 `detail`/
`grand`가 정의되지 않은 채 참조돼 `Invalid object name 'detail'`로 실패한다(재수정 2회
모두 동일 오류로 실패). `sql_fragments.dependencies`가 실제로는 CTE인데 이 한 필드로
표현이 안 되는 "fragment 내부에 자체 다중 CTE를 갖는 단일 final_select" 케이스로 보인다
— `sqlFragments.js`의 해당 항목을 별도 CTE fragment들로 쪼개거나 `sql_template` 자체에
`WITH` 절을 포함시키는 수정이 필요하다.

## 코드 변경 사항

- `knowledgeBase/sqlFragments.js`: `frag_sales_target_by_dealer`, `frag_sales_target_trend_by_model`의
  `sql_template`에 `ktws.` 스키마 접두사 추가.
- `knowledgeBase/sqlSources.js`: `src_fs16`, `src_fs17`의 `original_sql`도 동일하게 수정(감사 기록 일관성).
- `schema/routing/판매목표_일별.md`: few-shot SQL에 `ktws.` 접두사 추가(별도 커밋, 이 파일럿 이전 세션에서 완료).
- 반영을 위해 `node server/rag-poc/seedKnowledgeBase.js` + `node server/rag-poc/buildEmbeddings.js --force` 재실행함.
