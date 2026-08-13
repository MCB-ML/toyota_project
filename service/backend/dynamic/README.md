# Dynamic Semantic Query Planner

RAG 테스트 탭(`/ktws/custom`)이 쓰던 Pattern Card Text2SQL(`rag-poc/`)을 대체한다.
기존 실행 경로(Certified Report · GOLD Derived · Semantic Compiler)는 **하나도 바꾸지 않았다** —
그 위에 "질문 자유도"를 담당하는 계획 계층을 얹었다.

```
질문
 → Semantic Requirement        개념만. 테이블·컬럼·지표 ID가 들어오지 않는다.
 → Resolution Router           어느 지식 계층이 답할지 정한다
 → 계층별 실행
 → Semantic Fidelity Gate      질문과 계획을 다시 대조. 어긋나면 숫자를 내보내지 않는다
 → 결과 + Trace
```

## 지식 계층과 신뢰 순서

| 계층 | 무엇 | 어디 |
|---|---|---|
| 1 · Certified | GOLD SQL, 인증 리포트, 인증 지표 | `reports/`, `agentic-bi/semantic/` |
| 2 · Report-local | 리포트가 아는 컬럼·값·row grain | 계약 YAML의 `report_semantics:` |
| 3 · Global Semantic Core | 등록 Dimension / Metric / Ontology | `agentic-bi/semantic/` |
| 4 · Discovered Schema | Raw 테이블·컬럼·표본값·관계 후보 | `cache/metadata-index.json` |

**핵심 규칙 두 가지.**

1. **글로벌 카탈로그에 없다고 곧바로 Schema RAG로 내려가지 않는다.**
   `접수 유형`이 그 예다. 글로벌 Dimension엔 없지만 `lead_list` 리포트는 이미 안다 —
   물리 컬럼(`FCT_ACTIVITY_v2.visit_type`)뿐 아니라 `act_tp IN ('P107','P108')` 한정과
   리드당 `MAX` 축약까지가 그 개념의 정의다. 컬럼만 글로벌로 올리면 그 규칙이 떨어져 나간다.

2. **등록 지표로 풀리는 질문은 등록 지표가 답한다.**
   "월별 계약실적"을 리포트 행에서 새로 세면 기존과 다른 숫자가 나올 수 있다.
   개념이 전부 등록 차원이고 요구를 만족하는 등록 지표가 있으면 LEVEL 3이 먼저다.

## Resolution Level

| Level | 뜻 |
|---|---|
| `CERTIFIED_REPORT` | 등록 리포트를 그대로 실행 |
| `REPORT_COMPOSED` | 등록 리포트의 **검증된 행집합** 위에서 새 집계 |
| `CERTIFIED_METRIC` | 등록 지표 + 기존 Semantic Compiler |
| `DISCOVERED` | 스키마에서 찾아 런타임 검증 후 실행 |
| `UNRESOLVED` | 개념·값이 모호 — 되묻는다 |
| `UNSUPPORTED` | 안전한 계획을 못 만든다 — 실행하지 않는다 |

## REPORT_COMPOSED가 필요한 이유

`lead_list`에는 **출고일 기간 파라미터가 없다.** 날짜 파라미터는 등록일(`reg_from`/`reg_to`)뿐이고
`retail_yn`은 Y/N뿐이다. 그래서 "2026년 7월 출고"는 리포트에 내려보낼 방법이 없다.

등록 SQL은 한 글자도 고치지 않는다. 대신 조건을 둘로 나눈다.

```
푸시다운   리포트가 파라미터로 받아주는 것   dealer_nm='렉서스 강남', retail_yn='Y'
잔여 조건  실행 후 행에서 거는 것            [출고일] between, [접수 유형] eq
```

실측(2026-08-12): 무필터 88,144행 → 딜러 12,394행 → `retail_yn='Y'`까지 12,394→3,081행.
한도(`composition_limits.max_rows_fetched`)를 넘으면 조용히 자르지 않고 되묻는다.

## 안전장치

- **값으로 확정한다.** 값이 주어진 개념은 그 값이 실제로 존재하는 컬럼에만 붙는다.
  이름 유사도 1·2등이 붙어 있으면(`< 0.15`) 고르지 않고 AMBIGUOUS로 올린다.
- **COUNT(\*)를 근거 없이 쓰지 않는다.** 리포트는 계약이 선언한 `row_grain.counting`을 따르고,
  발견 경로는 유일 키가 있어야 센다. 유일 키가 없으면 **조인이 하나도 없을 때만** 행을 세고,
  무엇을 셌는지 결과에 밝힌다.
- **팬아웃을 DISTINCT로 숨기지 않는다.** 프로브로 실제 배수를 재고, 조건으로만 쓰는 조인이면
  EXISTS로 바꾼다. 값을 꺼내 써야 하는데 팬아웃이 나면 막는다.
- **연/월별과 연/월누적을 섞지 않는다.** 표는 같은 행 수로 나오고 값만 달라서 눈으로 못 거른다.
  단위(`output_grain`)와 누적(`cumulative`)은 서로 독립한 축이다.
  누적은 **시작점**이 정의다 — 연누적은 1월 1일부터, 월누적은 그 달 1일부터.
  "7월 연누적"이면 기간을 1~7월로 잡고, 시작점이 틀린 계획은 실행 직전에 막는다.

- **질문에 있는 값이 조건에서 사라졌는지 본다.** Fidelity 게이트는 요구에 적힌 것만 대조할 수
  있어서, 요구 추출이 조건을 통째로 흘리면 못 잡는다(실측: "RX 모델 … 연누적" 3회 중 2회).
  `valueDictionary.js`가 질문 원문을 등록 차원의 실제 값 목록과 직접 맞춘다.

- **지표 선택에 LLM을 쓰지 않는다.** 후보가 갈리는 자리는 대개 업무적으로 큰 차이다 —
  취소 포함/제외, 실적/목표. 질문의 측정 개념과 기간 모양으로 코드가 좁히고,
  하나로 안 좁혀지면 **고르지 않고 되묻는다.**
  실측(2026-07): 취소 제외 2,488 + 취소 282 = 취소 포함 2,770.

- **LLM은 SQL을 쓰지 않는다.** LLM이 하는 일은 **요구를 개념으로 옮기는 것 하나뿐**이다.
  날짜 해석도, 축 확정도, 지표 선택도 코드가 한다.

## 이어서 묻기

앞 턴이 확정한 요구를 다음 턴에 함께 넘긴다(서버는 대화 상태를 저장하지 않는다 — 화면이 들고 있다).
"그럼 수기 접수는?"이면 딜러·기간을 그대로 이어받고 접수 유형만 바꾼다.
차이만 받지 않고 **매 턴 완성된 요구를 다시 쓴다** — 델타 병합은 어느 쪽이 이겼는지 못 읽는다.

이어받아도 안전한 이유: 기간은 여전히 질문 원문에서 코드가 따로 읽어 계획과 대조한다.
모델이 앞 기간을 잘못 끌고 오면 `TIME_RANGE_MISMATCH`로 걸린다.

## 그림은 LLM이 직접 그린다

숫자와 그림을 **다른 엔드포인트로 분리**했다(`/api/dynamic-query` · `/api/dynamic-query/render`).

차트 종류·배치·구성은 모델 재량이고 인라인 SVG로 직접 쓴다. 전에는 툴 스키마
(`chart_type`/`label_key`/`y_keys`…)에 가둬 놨는데, 스키마가 예상 못 한 요청마다 축 매핑이
어긋나 빈 차트·뒤바뀐 축이 났다. `dealerFunnel/htmlEdit.js`가 같은 문제를 재량을 열어 푼 것과
같은 방식이다.

재량을 열어도 코드가 지키는 것 둘: **외부 참조가 하나라도 있으면 문서를 버리고**(사내망에서
빈 차트가 되는 사고), **사람이 읽는 자리의 낯선 숫자를 검사한다**(SVG 좌표는 세지 않는다 —
좌표를 세면 경고가 매번 떠서 아무도 안 본다).

분리해 두면 그림이 실패해도 숫자는 화면에 남고, "막대로 바꿔줘"에 조회를 다시 하지 않는다.

## 파일

```
index.js               오케스트레이터 + 지표 선택(결정론적)
requirement.js         Semantic Requirement 추출 + 기간·단위·누적 해석
timeGrain.js           연/월/일별 단위 — 축 확정, 칸 수 계산, 기간 넓히기
valueDictionary.js     질문에 있는 값이 조건에서 사라졌는지 대조
reportSemantics.js     LEVEL 2 — 선언된 의미 + 계약에서 자동 추출한 골격
resolutionRouter.js    계층 라우팅 + 등록 지표 후보 추리기
execute/reportComposed 인증 행집합 위의 집계
validate/fidelityGate  실행 직전 질문↔계획 대조
validate/probes        조인 카디널리티/팬아웃 프로브
compile/dynamicCompiler 검증된 계획 → SQL (전부 바인딩)
render/htmlView.js     결과 → HTML 문서 (LLM이 직접 씀)
discover.js            LEVEL 4 오케스트레이션
trace.js               관측 — 어느 계층이 답했는지, 발견 스키마를 썼는지
catalog/, retrieval/, graph/   스키마 메타데이터 인덱스·검색·관계 그래프
```

## 메타데이터 인덱스

```
npm run dynamic:harvest              # ktws 스키마 (기본)
npm run dynamic:harvest -- --schemas ktws,dbo
```

읽기 전용 조회만 한다. 테이블당 집계 쿼리 1번으로 전 컬럼의 distinct/null을 세고,
카디널리티가 작은 문자열 컬럼만 표본값을 담는다(개인정보 컬럼은 제외 — `NEVER_SAMPLE`).
결과는 `cache/metadata-index.json` (gitignore됨 — 파생 데이터라 코드가 아니다).

실측(2026-08-12, KPI_W/ktws): 테이블 39 · 컬럼 500 · 값 색인 165 · 큐레이션 22.

## 다음 리포트를 조합 가능하게 만들려면

계약 YAML에 `report_semantics:` 블록을 추가한다(`contracts/lead_list.yaml` 참고).
`row_grain.unique_key`가 없으면 `composable:false`로 남아 집계에 쓰이지 않는다 —
무엇을 한 건으로 셀지 근거가 없는 채로 세는 것보다 안 세는 게 낫다.
`sql_sha256`은 SQL 파일만 해시하므로 이 블록은 GOLD에 영향을 주지 않는다.
