// 딜러 계약퍼널 — 요구사항정의서 3장을 **SQL 작성 규칙**으로 옮긴 것.
//
// LLM에게 스키마만 주면 정의서가 "특히 주의"라고 적은 함정을 그대로 밟는다.
// 함정은 스키마 YAML에 안 적혀 있고 코드 주석에만 있어서, 모델은 볼 방법이 없다.
// 그래서 규칙으로 명시한다 — 아래 넷은 전부 **실측으로 확인된** 실패다.
//
//   ① 테이블 이름     "KPI_W.FCT_CONTRACT_KTWS"로 써서 실패. KPI_W는 DB, 스키마는 ktws.
//                    2026-08-11 실측: 스키마 YAML을 다 줬는데도 3모델 중 2모델이 틀렸다.
//   ② tp_grp_1 매핑   그룹으로 나누면 관계형성소개가 SC활동으로 샌다(2026-01~07 2,508건).
//   ③ tp_cd 조인      DIM_CRM_ACT_TYPE은 82행인데 tp_cd는 39종 — 접지 않으면 최대 6배.
//                    실측: 시승 귀속 실패가 1,109 → 5,802로 찍혔다.
//   ④ 활동의 모집단   채널 매핑 대상만 세야 한다. 전부 세면 151,079가 191,892가 된다.
//
// 규칙을 고칠 일이 생기면 여기만 고친다 — 프롬프트에 흩어 놓으면 어디를 고쳐야 하는지
// 찾는 데만 시간이 든다. 정의서 7장도 "담당자가 지속적으로 수정할 수 있는 구조"를 요청했다.
import { CHANNEL_MAP, CHANNEL_ORDER, PROGRESS_TYPES } from './channelMap.js'

/** 이 경로가 건드릴 수 있는 테이블. 여기 없는 이름이 SQL에 나오면 실행하지 않는다. */
export const ALLOWED_TABLES = [
  'FCT_ACTIVITY_v2', 'FCT_LEAD', 'FCT_CONTRACT_KTWS',
  'DIM_CRM_ACT_TYPE', 'DIM_MNG_USER', 'DIM_MNG_DEALER',
  'DIM_VEHIC_SPEC', 'DIM_VEHIC_SPEC_MDL', 'DIM_VEHIC_SPEC_VAR',
  'DIM_CALENDAR_KTWS', 'DIM_PMA_ORDER', 'DIM_REPURC_SALES_TYPE',
]

const channelTable = () => CHANNEL_ORDER
  .map((ch) => {
    const types = Object.entries(CHANNEL_MAP).filter(([, v]) => v.channel === ch)
    return `  ${ch} (${types[0][1].category}): ${types.map(([t]) => `'${t}'`).join(', ')}`
  })
  .join('\n')

/** 정의서 3장 규칙 본문. 스키마와 함께 프롬프트에 실린다. */
export const FUNNEL_SQL_RULES = `[요구사항정의서 규칙 — SQL을 쓸 때 반드시 지킵니다]

0. 테이블 이름
   **반드시 ktws.<테이블> 로 씁니다.** 예: ktws.FCT_ACTIVITY_v2
   KPI_W는 데이터베이스 이름이지 스키마가 아닙니다 — KPI_W.FCT_... 로 쓰면 실행이 실패합니다.
   아래 [스키마]에 없는 테이블은 쓰지 않습니다.

3-1. 활동유형 → 채널/카테고리 매핑
   **활동유형명(DIM_CRM_ACT_TYPE.tp_nm)으로 매핑합니다. tp_grp_1(그룹)으로 나누지 마세요.**
   그룹으로 나누면 '관계형성-생일 연락'·'관계형성-출고 기념일 연락'(그룹=연락)과
   '기회창출-관계형성 소개'(그룹=기회창출)가 관계형성활동에서 빠집니다.
   정의서가 "초기 설계 오류가 있었던 부분이므로 특히 주의"라고 적은 자리입니다.

${channelTable()}

   위 표에 없는 활동유형은 "기회진행"으로 별도 처리하며 채널을 임의로 주지 않습니다:
   ${[...PROGRESS_TYPES].map((t) => `'${t}'`).join(', ')}

3-2. 지표 정의
   활동  = 위 매핑에 해당하는 활동 행. **매핑 대상만 셉니다** — 기회진행·미매핑을 넣으면 안 됩니다.
           건수는 COUNT(*). FCT_ACTIVITY_v2.actual_cnt(KPI 실적)와 다릅니다.
   기회  = ktws.FCT_LEAD. 건수는 SUM(cnt).
   시승  = 3-4의 별도 파이프라인. 활동 집계와 다른 로직입니다.
   계약  = ktws.FCT_CONTRACT_KTWS, **Gross 기준** — 취소·반려된 건도 그대로 포함합니다.
           cancel_dt로 거르지 마세요. 건수는 SUM(cnt).

3-3. 관심모델(차종) 판별 — 우선순위대로 백필
   ① ktws.FCT_LEAD.int_vehic_key1 (→ ktws.DIM_VEHIC_SPEC_MDL.mdl_key, model_nm)
   ② 없으면 ktws.FCT_CONTRACT_KTWS.cn_vehic_key (→ ktws.DIM_VEHIC_SPEC)
   ③ 없으면 ktws.FCT_ACTIVITY_v2.sr_var_key1 (→ ktws.DIM_VEHIC_SPEC_VAR.var_key, model_nm)
   ④ 그래도 없으면, 같은 기회번호(lead_key)로 연결된 시승 기록들의 모델이 **전부 동일할 때만** 그 모델
   ⑤ 그래도 없으면 '관심모델없음'
   코스(통합) 분류는 모델(mdl/model_nm), 파인(세분) 분류는 차종(var/variant_nm)을 씁니다.
   두 분류의 합계는 1% 미만 어긋날 수 있으며 정상입니다.

3-4. 시승 파이프라인 — 이 순서를 지킵니다
   ① 원본     DIM_CRM_ACT_TYPE.tp_nm = '기회진행-시승결과'
   ② 취소 제외 (act_result IS NULL OR act_result <> '시승취소')
   ③ 중복제거 **lead_key가 같으면 1건만** — ROW_NUMBER() OVER (PARTITION BY lead_key ORDER BY act_dt_fr, act_pk) = 1
              빼먹으면 시승이 약 35% 부풀려지고 시승→계약 전환율이 그만큼 낮게 나옵니다.
   ④ 채널 귀속 lead_key로 ktws.FCT_LEAD에 연결해 그 행의 ca_act_tp로 채널을 정합니다.

   **tp_cd로 조인할 때 주의**: ktws.DIM_CRM_ACT_TYPE은 82행인데 tp_cd는 39종뿐입니다
   (브랜드·이력이 갈립니다). 그냥 조인하면 1건이 최대 6건으로 불어납니다.
   반드시 먼저 접으세요:
     WITH type_by_cd AS (
       SELECT CAST(tp_cd AS nvarchar(60)) AS tp_cd, MIN(tp_nm) AS tp_nm
       FROM ktws.DIM_CRM_ACT_TYPE GROUP BY CAST(tp_cd AS nvarchar(60))
     )

3-5. 채널을 못 정한 건
   임의로 채널을 주지 말고 따로 셉니다. 채널별 합이 총계보다 작아질 수 있으며,
   그 사실을 결과에 함께 담으세요(예: '채널미상' 행).

3-6. 부분월
   진행 중인 달의 실적을 전월과 그대로 비교하면 항상 "감소"로 나옵니다.
   조회는 그대로 하되, 마지막 달이 부분월이면 결과에 그 사실이 드러나게 하세요.

3-7. 날짜 기준 — 지표마다 다릅니다
   활동  ktws.FCT_ACTIVITY_v2.act_dt_fr   (활동일자)
   기회  ktws.FCT_LEAD.lead_reg_dt        (기회생성일자)
   시승  ktws.FCT_ACTIVITY_v2.act_dt_fr   (시승 활동일자)
   계약  ktws.FCT_CONTRACT_KTWS.contract_dt (계약일자)
   기간 필터는 >= 시작 AND < 끝(다음 날/다음 달 1일)으로 씁니다.

코드 컬럼 — **Y/N 둘뿐이라고 가정하지 마세요**
   *_yn 으로 끝나도 값이 셋 이상인 컬럼이 있습니다. 2026-08-12 실측:
     FCT_CONTRACT_KTWS.pma_yn = 'Y'(관내) · 'N'(관외) · 'etc'  ← 2025-12 계약의 21.6%가 etc
   "pma_yn = 'Y'"만 세고 나머지를 전부 분모에 넣으면 비율이 틀립니다. 값이 무엇인지
   [축의 실제 값]에서 확인하고, 없으면 차원 테이블(예: ktws.DIM_PMA_ORDER)을 조인해
   분류명을 함께 내보내세요 — 'etc'를 조용히 "관외"로 취급하면 안 됩니다.

조인 경로 — **이 키로만** 조인합니다
   활동 → 활동유형   A.tp_key = T.tp_key  (ktws.DIM_CRM_ACT_TYPE)
     **act_tp를 tp_cd에 조인하지 마세요.** tp_cd는 브랜드·이력이 갈려 같은 코드가 여러 행이고,
     접어서(GROUP BY) 조인해도 tp_key 조인과 결과가 다릅니다 — 2026-08-11 실측으로
     렉서스 강남 4월 활동이 7,553(tp_key) 대 7,684(tp_cd)로 갈렸습니다. 둘 다 오류 없이
     그럴듯한 숫자를 냅니다. 선언된 외래키는 tp_key입니다.
     tp_cd는 **기회 행의 ca_act_tp를 활동유형명으로 바꿀 때만** 쓰고, 그때는 반드시 접습니다.
   기회 → 활동유형   L.ca_act_tp(코드) → 접은 type_by_cd.tp_cd → tp_nm  (3-4 ④의 경로)

조직 조인 (딜러·브랜드가 필요할 때)
   활동  A.sc_key      → ktws.DIM_MNG_USER U → ktws.DIM_MNG_DEALER D
   기회  L.cl_sc_key   → 같은 경로
   계약  C.cn_sc_key   → 같은 경로
   브랜드는 D.BRAND('LEXUS'/'TOYOTA'), 딜러명은 LTRIM(RTRIM(D.dealer_nm)).`

/** SQL이 지켜야 하는 형태. 프롬프트 뒤에 붙고, 아래 금지 항목은 실행 전에 검사한다. */
export const SQL_OUTPUT_RULES = `[SQL 작성 형식]
- SELECT 또는 WITH로 시작하는 **조회문 하나만** 씁니다. INSERT/UPDATE/DELETE/DDL은 실행되지 않습니다.
- 결과는 문서의 표·차트가 될 값입니다. 행이 200개를 넘지 않게 집계하세요 —
  원본 행을 그대로 뽑지 말고 GROUP BY로 접습니다.
- 컬럼 이름은 한국어로 별칭을 붙입니다(예: AS [계약건수]). 그대로 표 머리글이 됩니다.
- 값이 없을 수 있는 축은 COALESCE로 '미상' 같은 명시적 라벨을 넣습니다 — NULL을 그대로 두면
  표에 빈 칸이 생기고 그게 0인지 모르는 건지 구분되지 않습니다.

[금지 — 아래를 쓰면 실행되지 않고 되돌려집니다]
이 셋은 공통점이 있습니다: **오류를 내지 않고 조용히 다른 답을 만듭니다.**

- **TOP / OFFSET-FETCH 금지.** 사용자가 "상위 N개"라고 **명시적으로 말했을 때만** 씁니다.
  안 그러면 잘린 결과가 전체인 양 문서에 실립니다. 양이 많으면 자르지 말고 GROUP BY로 접으세요.
- **SELECT * 금지.** 필요한 컬럼만 별칭을 붙여 고릅니다. *는 스키마가 바뀌면 표 모양이
  같이 바뀌고, 문서에 실릴 열을 사람이 정할 수 없습니다. (EXISTS 안의 SELECT 1은 괜찮습니다.)
- **날짜에 BETWEEN 금지.** \`>= 시작 AND < 끝\` 으로 씁니다.
  BETWEEN '2026-04-01' AND '2026-04-30' 은 4월 30일에 시간이 붙은 행을 통째로 빠뜨립니다 —
  한 달치가 하루 모자라게 집계되는데 오류는 안 납니다.`
