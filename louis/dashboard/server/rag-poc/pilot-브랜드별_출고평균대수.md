# 브랜드별 출고 평균대수 — 원인 규명 · 버그 수정 · 신규 패턴 추가

**작업 일시**: 2026-07-22 (판매목표_일별 파일럿의 후속)

## 배경

`ktws_측정값_쿼리화.xlsx`의 **"7. SC 출고 현황" 시트**(사용자 확인)에 이미 "SC별
출고평균대수..." GOLD 쿼리가 있고, 지식베이스에도 `pat_sc_delivery_matrix`
(`frag_sc_delivery_matrix_select`, `src_fs51`)로 반영돼 있었다. 하지만 이전 파일럿에서
"브랜드별 출고 평균대수" 질문에 대해 RAG가 이 패턴을 골랐음에도 `Invalid object name
'detail'` 오류로 실행 자체가 실패했었다(`pilot-판매목표_일별.md` ("파일럿 중 발견한
추가 버그" 참고). 이번 작업은 그 버그를 근본 원인까지 고치고, 원 질문("브랜드별")에
정확히 답하는 새 패턴을 추가한 기록이다.

## 1. 근본 원인

`frag_sc_delivery_matrix_select`(그리고 같은 시트의 `frag_sc_group_count_matrix_select`)는
`sql_template` 자체가 이미 완결된 다중 CTE(`;WITH target_vehic AS (...), target_sc AS
(...), ..., detail AS (...), grand AS (...) SELECT ...`) 쿼리다. 그런데 Stage 7(SQL
조각 생성) 프롬프트(`stages/generate.js`)와 도구 스키마(`ragTools.js`)에는 **"새 CTE를
만들거나 WITH를 쓰지 말고 SELECT 하나만 작성하라"는 규칙이 모든 fragment에 예외 없이
적용**되고 있었다 — 이 규칙은 여러 fragment를 체인으로 조립하는 일반적인 경우엔 맞지만,
이 두 fragment처럼 "템플릿 자체가 이미 완결된 다중 CTE"인 예외적인 경우엔 CTE 정의부
전체(`target_vehic`, `target_sc`, ..., `detail`, `grand`)가 통째로 잘려나가고 마지막
SELECT(`FROM detail UNION ALL ... FROM grand`)만 남아, `detail`/`grand`가 정의되지
않은 채 참조돼 실패했다.

`sql_fragments.verified` 필드는 파이프라인 어디에서도 읽히지 않는(grep 0건) 순수
메타데이터라 이 버그는 항상 재현 가능했다 — 이전 세션(`test-report.md`)에서 "정상
실행"으로 기록된 건 LLM이 우연히 규칙을 어기고 전체를 재현했던 경우로 보이며, 구조적으로
보장된 동작이 아니었다.

## 2. 수정

1. **`sql_fragments.self_contained` 플래그 신설** (`db-init/002_rag_poc.sql`,
   `seedKnowledgeBase.js`) — true면 "템플릿 자체가 완결된 다중 CTE"라는 뜻.
   `frag_sc_group_count_matrix_select`, `frag_sc_delivery_matrix_select`에 표시.
2. **`stages/generate.js`(Stage 7 프롬프트) + `ragTools.js`(도구 스키마)**를
   `fragment.self_contained`에 따라 분기 — true면 "CTE를 전부 포함해 템플릿 전체를
   그대로 재현하라"로 규칙을 뒤집는다.
3. **`stages/generate.js`의 `injectTopN`**을 괄호 깊이 추적 방식으로 재작성 —
   `;WITH ...`로 시작하는 self_contained SQL도 진짜 마지막 SELECT(깊이 0)를 정확히
   찾아 `TOP N`을 주입하도록 수정(기존엔 문자열이 `SELECT`로 시작하는 경우만 처리돼
   self_contained SQL엔 TOP이 아예 안 붙었음).
4. **`sql_template`/`original_sql`의 선두 쓰레기 제거** — 두 fragment 모두 원본이
   `DECLARE` 문을 리터럴로 치환하는 과정에서 주석 헤더 6개 + 잘린 `CASE WHEN ... END;`
   + `;WITH`가 그대로 남아 있었다. `fabricClient.js`의 실행 가드(`/^\s*(SELECT|WITH)\b/`)가
   이 선두 텍스트 때문에 "읽기 전용 쿼리만 허용" 오류로 막았다 — `WITH`로 바로 시작하도록
   정리.

### 검증

`node deploy/server/rag-poc/inspectQuery.mjs "SC별 출고평균대수, 누적취소율, 연누적출고,
PMA 상세표를 보여줘" --execute` — 수정 전: `liveCheckPassed:false`, `repairAttempts:2`,
`Invalid object name 'detail'`. 수정 후: **`liveCheckPassed:true`, `repairAttempts:0`,
오류 없음**, 상세 SC 100행 + 합계행까지 정상 반환.

## 3. 신규 패턴: 브랜드별 출고 평균대수

이 GOLD 쿼리 계열이 쓰는 측정값(`sales_period_monthly_avg_scSelected` — SC별 최근
6개월 중 실적 있는 달만 평균한 월별 출고건수)은 원래 SC 단위/전사 합계 단위로만 존재하고
**브랜드 단위 GOLD 쿼리는 원본 엑셀에 없다**. 같은 측정값 정의를 브랜드 단위로 재사용해
새 fragment/pattern을 만들었다(`knowledgeBase/sqlFragments.js`,
`knowledgeBase/queryPatterns.js`, `verified: false`로 표시 — GOLD 미검증 신규 파생):

- `frag_brand_monthly_sales`(cte): 재직 SC(창구SC/특정조직/테스트계정 제외)를 브랜드·SC·월별
  최근 6개월 출고건수로 집계.
- `frag_delivery_avg_by_brand_select`(final_select, `frag_brand_monthly_sales`에 의존):
  브랜드별 월합계의 6개월 평균을 그 브랜드 SC 인원수로 나눔 — `frag_sc_delivery_matrix_select`의
  총계(합계)행과 정확히 같은 계산 방식(SC 1인당 월평균 출고대수)을 브랜드 단위로 적용.
- `pat_delivery_avg_by_brand`: 위 두 fragment를 참조하는 Pattern Card.

### 검증

**수동 GOLD 대조값**: Fabric에 같은 로직으로 직접 쿼리해 확인 — LEXUS 3.346, TOYOTA 4.352
(SC 1인당 월평균 출고대수).

`node deploy/server/rag-poc/inspectQuery.mjs "브랜드별 출고 평균대수" --execute`:

| 경로 | 결과 | 판정 |
|---|---|---|
| 수동 GOLD | LEXUS 3.346 / TOYOTA 4.352 | 기준값 |
| RAG (`pat_delivery_avg_by_brand` 선택, `liveCheckPassed:true`, `repairAttempts:0`) | LEXUS 3.3 / TOYOTA 4.4 | ✅ 일치(반올림 오차만) |
| TOPIC (`계약` topic으로 분류, 즉석 SQL 생성) | LEXUS 58718 / TOYOTA 40179 | ❌ 무의미한 값(AVG 대신 사실상 SUM류 집계로 보임) |

원래 질문("브랜드별 출고 평균대수")에 대해 이제 RAG 경로가 정확한 답을 낸다. TOPIC은
여전히 이 개념에 대한 전용 가이드가 없어 즉석 생성 시 오답을 낸다 — RAG-우선 하이브리드
구조 덕분에 실사용자에게는 RAG의 정답이 먼저 도달한다(TOPIC은 RAG 실패 시에만 쓰이는
폴백이므로).

## 코드 변경 요약

- `db-init/002_rag_poc.sql`: `sql_fragments.self_contained` 컬럼 추가.
- `seedKnowledgeBase.js`: `self_contained` 필드 upsert에 포함.
- `ragTools.js`: `buildFragmentSqlTool(selfContained)` — 플래그에 따라 도구 설명 분기.
- `stages/generate.js`: Stage 7 프롬프트 규칙 분기 + `injectTopN` 괄호-깊이 추적으로 재작성.
- `knowledgeBase/sqlFragments.js`: 두 SC 매트릭스 fragment에 `self_contained: true` +
  선두 쓰레기 텍스트 제거, 신규 fragment 2개 추가.
- `knowledgeBase/sqlSources.js`: 두 SC 매트릭스 소스의 선두 쓰레기 텍스트 제거(감사 기록 일관성).
- `knowledgeBase/queryPatterns.js`: `pat_delivery_avg_by_brand` 신규 추가.
- 반영을 위해 `node deploy/server/rag-poc/seedKnowledgeBase.js` +
  `node deploy/server/rag-poc/buildEmbeddings.js --force` 재실행함.
