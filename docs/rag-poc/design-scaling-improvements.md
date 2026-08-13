# 설계 문서: 결과 크기 안전장치 + Dimension 파라미터화

배경: 브랜드별 출고 평균대수 파일럿에서 두 가지 구조적 한계가 드러났다.
(1) 모든 쿼리에 무조건 `TOP 100`을 박아넣는 방식이 불필요하거나(작은 집계) 위험하다(진짜
큰 목록을 조용히 잘라냄). (2) SC 단위로 이미 존재하던 "출고평균대수" measure를 브랜드
단위로 쓰려고 fragment를 통째로 새로 썼다 — dimension마다 fragment를 손으로 새로 짜는
구조라 조합이 늘어날수록 지속 불가능하다. 두 문제 다 구현 전 설계를 먼저 정리한다
(코드 변경 없음, 이 문서는 계획만).

## 1. 결과 크기/속도 안전장치

> **구현 완료 (2026-07-22)** — 아래 설계 중 "실행시간 30초 초과 시 재질문" 부분만 먼저
> 구현했다. `fabricClient.js`에 `queryFabricWithTimeout(db, sql, timeoutMs=30000)`을
> 추가(내부적으로 `Request#cancel()`로 취소하고 `QueryTimeoutError`(`isTimeout:true`)를
> 던짐), `chatHandler.js`/`dashboardPipeline.js`의 RAG·TOPIC 실행 지점 4곳 전부를
> 이걸로 교체했다. 타임아웃이 나면 **TOPIC으로 조용히 폴백하지 않고**(같은 이유로 TOPIC도
> 오래 걸릴 가능성이 높음) 바로 `{type:'text', text: <재질문 문구>}`를 보내고 그 턴을
> 정상 종료 — 새 인터랙션 프리미티브 없이, 채팅이 원래 매번 history를 다시 보내는 구조를
> 그대로 활용한다(§ 아래 설계 문단 그대로). 1초 타임아웃으로 인위적으로 트리거해
> 취소·에러 처리 메커니즘 자체는 검증함(`request.cancel()` 정상 동작, 5초 걸리는 쿼리를
> 약 2초 만에 취소).
>
> **후속 구현 완료 (2026-07-22, 같은 날 후속)** — 실제 쿼리 결과에 `TOP 100`이 여전히
> 걸려 있는 걸 발견해 나머지(TOP N 제거 + 행 수 기반 감지)까지 마저 구현했다:
> - `stages/generate.js`의 `composeSql`/`injectTopN`과 `stages/rollup.js`의
>   `applyRollup`을 `topN` 기본값 `null`(무제한)로 변경 — 넘기지 않으면 `TOP` 절
>   자체가 안 붙는다. `pipeline.js`의 `const topN = opts.topN ?? 100`도 `?? null`로
>   변경. Stage 9b의 검증용 저비용 프로브(`topN: 1`)는 별개 관심사라 그대로 둠.
> - TOPIC 경로(`dashboardTools.js`) 프롬프트도 "무조건 TOP N"에서 "kpi만 TOP 1 강제,
>   나머지는 사용자가 개수를 직접 요청하지 않는 한 임의로 자르지 말 것"으로 수정.
> - `fabricClient.js`에 `MAX_ROWS_BEFORE_REASK = 500` + `tooManyRowsMessage()` 추가 —
>   실행은 빨랐지만(타임아웃 안 걸림) 결과가 500행을 넘으면 차트를 그리는 대신 같은
>   방식(정상 종료 + assistant 메시지로 되묻기)으로 처리. 4개 실행 지점 전부에 적용.
> - **검증**: `composeSql` 출력에서 `TOP` 절이 사라진 것 직접 확인(판매목표_일별의
>   "모델별 일일 계약 목표 추이" — 이전엔 100행으로 잘렸던 게 이제 무제한 실행됨).
>   `queryFabricWithTimeout`으로 이 쿼리를 직접 실행해 실제 96,632행이 반환되고,
>   500행 임계값을 넘겨 `tooManyRowsMessage()`가 정확히 트리거되는 것 확인.

### 현재 상태 (조사 결과)

- RAG 경로: `runPipeline`의 `opts.topN`이 `composeSql`/`injectTopN`(`stages/generate.js`)까지
  이미 전달 가능한 파라미터인데, 호출부(`chatHandler.js`, `dashboardPipeline.js`) 둘 다
  안 넘겨서 기본값 100이 항상 적용된다(`pipeline.js:90`).
- TOPIC 경로: `TOP N`은 코드가 아니라 LLM에게 주는 프롬프트 지시일 뿐이다
  (`dashboardTools.js:162,204` — "기본 50, kpi는 TOP 1").
- `injectTopN`은 TOP 절을 못 찾으면 그냥 원본을 그대로 반환한다(`generate.js:122`) — 즉
  "TOP 없이 실행"은 이미 구조적으로 지원되는 경로다. Stage 9(구조 lint/실행 검증)도
  Stage 10(재수정)도 TOP N의 존재 여부에 의존하지 않는다(Stage 9b는 검증 비용을 줄이려고
  자체적으로 `topN:1`을 씀 — `validate.js:30` — 별개 관심사).
- `fabricClient.js`의 `queryFabric(db, sql)`은 timeout/취소/진행률 콜백을 받지 않는
  단순 await 1회 호출이고, `pool`의 `requestTimeout: 60000`(`fabricClient.js:62`)이
  DB 커넥션 전체에 적용되는 전역 설정이다(쿼리별 개별 조정 불가).
- **채팅 흐름은 요청 1개당 SSE 스트림 1개로 끝난다(`chatHandler.js`) — 서버가 실행을
  멈추고 "다음 사용자 메시지"를 기다렸다가 같은 파이프라인을 이어서 재개하는 기능은
  지금 코드베이스 어디에도 없다.** 가장 가까운 선례(`patch_ready` → `PatchPreviewCard`의
  적용/취소 버튼)도 서버 재개가 아니라 클라이언트에서 이미 받은 데이터를 그대로
  적용/취소하는 것뿐이다.

### 설계 방향

**진짜 "일시정지 후 재개"는 만들지 않는다.** 대신 채팅은 원래 매 메시지가 이전 대화
history를 통째로 다시 보내는 구조이므로(`ChatPanel.jsx`), "사용자에게 되묻기"는 **이번
턴을 정상 종료하면서 확인을 요청하는 assistant 메시지로 끝내고, 사용자의 다음 메시지가
새 파이프라인 실행에서 그 확인 답변으로 자연스럽게 해석되게** 한다 — 새 인터랙션
프리미티브를 만들 필요가 없다.

```
1. TOP N 없이 쿼리 실행 시도
2. 실행을 타이머와 경합(Promise.race) — 임계값(예: 15초, fabricClient의 60초
   requestTimeout보다 훨씬 짧게 — mssql 자체 타임아웃까지 기다리면 사용자 체감 대기가
   너무 김) 안에 끝나면 그대로 결과 반환
3. 임계값을 넘기면:
   a. 진행 중인 요청을 취소(mssql Request의 cancel() — queryFabric을 수정해 Request
      객체를 반환/보관하도록 확장 필요)
   b. 에러가 아니라 정상 응답으로 assistant 메시지를 보낸다: "이 조회는 결과가 많거나
      오래 걸릴 수 있습니다. 상위 N개만 볼까요, 아니면 조건을 좁혀드릴까요?"
   c. 이번 SSE 스트림을 'done'으로 정상 종료(에러 아님 — 재시도 로직/에러 UI를 타면 안 됨)
4. 사용자가 다음 메시지로 "상위 50개만" 또는 "지난달로 좁혀줘"라고 답하면, 그 메시지 +
   history가 다음 파이프라인 실행에 그대로 들어가고, Stage 0(질문 구조화)가 이미 문맥을
   읽고 topN/추가 필터를 채운다 — 기존 구조 그대로 동작, 별도 처리 불필요.
```

느린 것과 큰 것은 다른 신호라 병행 감지가 필요하다 — 실행 자체는 빠른데 결과가
수만 행이면(예: `dateby` 무제한 필터인 판매목표_일별 파일럿의 `모델별 일일 계약 목표
추이` 케이스, 96,632행) 5번 항목처럼 실행 후 `rows.length`로도 걸러야 한다.

### 남은 설계 결정 (구현 전 확인 필요)

1. **타이머 임계값**: 15초/20초/30초 중 무엇으로 할지 — 기존 RAG 평균 응답시간이
   8~9초대(`test-report.md`)이므로 15초면 정상 케이스는 거의 안 걸리고 진짜 느린
   케이스만 잡는다.
2. **취소 메커니즘**: `queryFabric`이 `mssql`의 `Request` 객체를 밖으로 노출하도록
   시그니처를 바꿔야 한다(현재는 결과만 반환) — `request.cancel()` 호출 지원 필요.
3. **행 수 임계값**: 실행은 빨랐지만 결과가 예: 1000행을 넘으면 그것도 같은 "되묻기"
   흐름을 태울지, 아니면 그냥 다 보여줄지(채팅 UI가 몇 백 행까지 렌더링 가능한지 확인
   필요 — 프론트엔드 쪽은 이번 조사에서 안 봄).
4. **RAG/TOPIC 공통 적용**: 두 경로 다 `queryFabric` 호출부(`dashboardPipeline.js:49`,
   `:224`)를 감싸는 공통 헬퍼로 뽑아서 중복 없이 적용.

## 2. Dimension 파라미터화 (measure × dimension 조합 문제)

> **구현 완료 (2026-07-22)** — 아래 §2 설계를 그대로 구현했다. `knowledgeBase/dimensions.js`에
> 5개 dimension(SC/딜러/브랜드/전시장/부서) 카탈로그 + `resolveGroupDimension()` 추가,
> `sql_fragments`에 `group_by_placeholder`/`supported_dimensions` 컬럼 추가, `pipeline.js`에
> Stage 3.5(결정론적, LLM 아님)로 `substituteGroupDimensions()` 삽입 — Stage 4가 fragment를
> 확정한 직후, Stage 7이 SQL을 생성하기 전에 `{{GROUP_DIM}}`을 실제 SQL 표현식으로 치환한다.
> 지원 안 하는 dimension이 요청되면(예: "모델별") `{{...}}`가 남은 SQL을 내보내는 대신
> 패턴 자체를 거부하고(`stage3_plan:null`) 기존 "패턴 미매칭" 경로로 정상 흡수된다(TOPIC
> 폴백). `frag_brand_monthly_sales`/`frag_delivery_avg_by_brand_select`(브랜드 전용)를
> `frag_sc_monthly_sales_by_dim`/`frag_delivery_avg_by_dim_select`(범용) 한 쌍으로
> 교체 — fragment 개수는 그대로(2개)인데 커버 범위가 1개 dimension → 5개로 늘었다.
>
> **검증**: `inspectQuery.mjs --execute`로 브랜드별/딜러별/부서별/전시장별/SC별 5개
> 전부 같은 `pat_delivery_avg_by_dimension` 패턴이 선택되고 `liveCheckPassed:true`.
> 브랜드(LEXUS 3.3/TOYOTA 4.4)와 딜러(렉서스 강남 3.4) 두 개는 Fabric에 직접 쿼리한
> 수동 계산값과 정확히 일치 확인. "모델별"(미지원 dimension) 요청 시 의도대로 거부됨.
>
> **선제 확장 (2026-07-22, 같은 날 후속)** — "다른 measure들도 다 해야 하냐"는 질문에
> 감사 결과: 55개 패턴 중 ratio/avg 계열 15개 중 11개는 애초에 dimension이 GROUP BY 축이
> 아니라 특정 딜러 하나로 좁히는 필터라 GROUP_DIM 대상이 아니었고, 4개(기회진척률/전환률,
> 계약진행률/전환률 등)는 이미 다중 dimension을 동시에 출력하고 Stage 8b rollup으로
> 부분집합을 처리하는 다른 구조였다 — **단, 이 rollup이 이미 계산된 비율 컬럼을 그대로
> SUM하는 구조라 브랜드 평균 때와 같은 수학 오류 위험이 있음을 발견**(별도 이슈,
> 아직 미수정, 아래 참고). GROUP_DIM으로 전환할 진짜 후보(단일 dimension에 고정된
> count/sum 측정값)를 찾아 4개 fragment를 추가로 전환:
> `frag_hboard_hot_by_sc`/`frag_mng_cust_by_sc`(SC/딜러/브랜드/전시장/부서 5종,
> DIM_MNG_USER 별칭 u — dimensions.js 기본값 그대로 사용 가능, 겸사겸사 누락됐던
> `ktws.` 스키마 접두사도 같이 고침), `frag_sales_target_by_dealer`/`frag_stock_by_dealer`
> (딜러/브랜드 2종 — 각각 FCT_SALES_TARGET_DAILY/FCT_AVAIL_STOCK 자체에 BRAND 컬럼이
> 있어 추가 조인 없이 지원 가능, 단 별칭이 `u`가 아니라 `d`/`f`/`s`라 다음 항목이 필요했음).
>
> 이 과정에서 **fragment마다 dimension을 다른 SQL 표현식으로 써야 하는 경우**(예: 어떤
> fragment는 딜러를 `u.dealer_nm`으로, 어떤 fragment는 `d.dealer_nm`으로 표현)를 만나서
> `sql_fragments.dimension_expressions`(JSONB, `{dimension_id: 'SQL 표현식'}`) 필드를
> 추가해 `dimensions.js` 전역 카탈로그 값을 fragment 단위로 덮어쓸 수 있게 확장했다.
>
> **검증**: 6개 케이스(딜러별/브랜드별 출고목표 — 브랜드 합계가 딜러별 합과 정확히 일치
> 13530=Σ렉서스딜러, 8195=Σ토요타딜러 확인, 딜러별 재고대수 회귀 없음, 브랜드별 담당고객수)
> 전부 `liveCheckPassed:true`, 올바른 패턴 선택. 총 6개 fragment가 GROUP_DIM 방식으로
> 전환됨(출고평균대수 1쌍 + 이번 4개).
>
> **별도로 남은 이슈**: Stage 8b rollup이 비율/평균 컬럼을 SUM하면 안 되는데 그럴 수 있는
> 구조 — `pat_lead_progress_list_by_org` 등 4개 breakdown+ratio 패턴에서 실제로 터지는지
> 검증 필요(§2와 다른 문제, GROUP_DIM으로 해결 안 됨 — `stages/rollup.js` 수정 필요).

> **범위**: 이번엔 "출고평균대수" measure 하나만 이 방식으로 전환했다. 나머지 fragment
> 카탈로그(딜러/부서/SC별 변형이 반복되는 다른 measure들)에 같은 패턴을 확장하는 건
> 후속 작업으로 남겨둔다(아래 "파일럿 제안" 문단 그대로 유효).

### 현재 상태

`sql_fragments`의 `sql_template`은 `GROUP BY` 대상 컬럼이 SQL 문자열 안에 하드코딩돼
있다. "월평균 출고" 같은 하나의 measure를 SC 단위/브랜드 단위로 보여주려면 `GROUP BY
u.sc_key` 버전과 `GROUP BY u.BRAND` 버전을 **fragment 자체를 통째로 복제**해야 한다
(이번에 만든 `frag_delivery_avg_by_brand_select`가 정확히 이 문제의 증거 — SC 단위
버전과 조인 구조가 100% 동일하고 GROUP BY 컬럼 하나만 다르다).

### 왜 지금 이렇게 됐는가

애초에 처음 이 대화에서 제안됐던 시맨틱 레이어 구조의 "D. 차원과 조인 그래프"
항목(dimension을 독립된 카탈로그로 관리하고 조인 요구사항을 선언)이 아직 구현 안 된
부분이다. `onboarding-gap-analysis.md`의 갭 목록에 이 항목을 이번에 추가한다(파생지표
formula 미선언 항목과는 별개 — 그건 분자/분모 조합 문제, 이건 GROUP BY 축 조합 문제).

### 설계 방향: GROUP BY 치환은 LLM이 아니라 결정론적 치환으로

핵심 통찰: **GROUP BY 대상 컬럼을 바꾸는 건 창의성이 필요 없는 기계적 치환**이다 —
Stage 0.5가 날짜(MTD/YTD)를 LLM 없이 결정론적 JS로 계산해서 모든 fragment에 동일하게
배포하는 것과 정확히 같은 성격의 문제다. 지금처럼 Stage 7의 LLM에게 "이 dimension으로
바꿔서 SQL을 다시 써라"를 시키면 조인 구조를 놓치거나 잘못된 컬럼을 참조할 위험이
매번 생긴다 — 반면 컴파일 타임에 문자열을 치환하면 그 위험이 원천적으로 없다.

```
sql_fragments에 새 필드:
  group_by_placeholder: 'GROUP_DIM'   -- sql_template 안의 {{GROUP_DIM}} 자리
  supported_dimensions: ['sc', 'dealer', 'brand', 'group', 'dept']  -- 허용 목록

신규 dimensions 카탈로그(예: knowledgeBase/dimensions.js):
  { id: 'sc',     expression: 'u.sc_key',     label_expression: 'u.name' }
  { id: 'dealer', expression: 'u.dealer_nm' }
  { id: 'brand',  expression: 'u.BRAND' }
  { id: 'group',  expression: 'u.group_name' }
  { id: 'dept',   expression: 'u.dept_nm' }
  -- 컬럼이 없는(추가 조인 필요) dimension은 requires_join으로 별도 표시,
     이번 케이스(SC/딜러/브랜드/전시장/부서)는 전부 DIM_MNG_USER 안에 이미 있어서
     조인 추가가 필요 없다 — 이 range 안에서는 순수 문자열 치환만으로 충분하다.

신규 결정론적 단계(Stage 0.5와 같은 자리, LLM 아님):
  Stage 0이 뽑은 dimensions(예: "브랜드")를 dimensions 카탈로그에서 찾아
  fragment.sql_template의 {{GROUP_DIM}}을 해당 expression으로 치환 후 Stage 7에 전달.
  요청된 dimension이 supported_dimensions에 없으면(예: "모델별" 요청인데 이 measure는
  SC/딜러/브랜드/전시장/부서만 지원) 이 패턴은 후보에서 제외하고 다음 후보로.
```

이렇게 하면 `frag_delivery_avg_by_brand_select`/`frag_brand_monthly_sales` 같은
전용 fragment 한 쌍을 새로 만들 필요 없이, 기존 SC 단위 fragment 하나가
`{{GROUP_DIM}}` 자리만 바꿔서 5개 dimension을 전부 커버했을 것이다.

### 적용 범위와 한계

- **바로 적용 가능한 범위**: 이번 케이스처럼 dimension 후보가 전부 이미 조인된 테이블의
  컬럼인 경우(딜러/브랜드/전시장/부서/SC — 전부 `DIM_MNG_USER`). 이 범위만 해도 지금
  fragment 카탈로그의 상당수 중복(딜러별/전시장별/부서별/SC별 변형이 반복되는 패턴들)을
  줄일 수 있을 것으로 보인다 — 정확한 규모는 fragment 카탈로그 전수 조사가 필요.
- **바로는 안 되는 범위**: dimension이 추가 JOIN을 요구하는 경우(예: "모델별"은
  `DIM_VEHIC_SPEC_MDL` 조인이 필요) — 이건 원래 제안의 "조인 그래프"까지 가야 풀리는
  문제라 1단계 범위에서는 제외하고 "이 measure가 지원하지 않는 dimension" 후보 목록에서
  걸러내는 정도로만 처리(에러 방지, 커버리지 확장은 2단계).
- **기존 fragment와의 공존**: 이미 만들어진 fragment들을 전부 이 방식으로 즉시
  재작성하지 않는다 — 신규/수정 대상 fragment부터 `{{GROUP_DIM}}` 패턴을 적용하고,
  기존 것들은 손댈 일이 생길 때(버그 수정, 신규 dimension 요청 등) 점진적으로 옮긴다.

### 파일럿 제안

1단계로 이번에 만든 `frag_delivery_avg_by_brand_select` + `frag_brand_monthly_sales`를
`{{GROUP_DIM}}` 방식의 단일 fragment 쌍으로 다시 써서, SC/딜러/브랜드/전시장/부서
5개 dimension 요청 전부를 fragment 하나로 커버하는지 검증 — 성공하면 이 패턴을
표준으로 채택하고 다른 반복되는 fragment군(계약 목표 목록, 영업기회 목표 목록 등 이미
"딜러/부서/SC별"처럼 여러 dimension을 한 fragment가 처리하는 것들이 실제로는 SQL 안에서
어떻게 하고 있는지도 함께 조사해서 — 어쩌면 이미 유사한 처리를 하고 있을 수 있음)로 확장.
