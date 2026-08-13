// 딜러 계약퍼널 — HTML 편집 챗봇에 넘길 **이름풀이**.
//
// ── 왜 지표 정의는 안 가져오는가 (중요) ──────────────────────────────
// 이 저장소에는 KTWS 시맨틱 레지스트리가 있고, 거기에는 지표 59개의 수식·필수필터·
// 제외규칙(br_exclude_front_sc "창구SC 제외" 같은)이 다 들어 있다. 그걸 그대로
// 끌어오고 싶어지지만 **안 된다** — channelMap.js 머리말이 못박은 대로 딜러퍼널은
// KTWS와 별개 규칙이다. 계약을 Gross로 세고, 자격 SC 필터를 걸지 않는다.
//
// 화면 숫자는 그 필터 없이 집계된 값인데 설명만 필터가 걸린 것처럼 나가면,
// 숫자와 말이 어긋나는데 둘 다 그럴듯해 보인다. 지금 잘 돌아가는 게 더 나쁜
// 형태로 깨진다.
//
// 그래서 **정의와 무관하게 참인 것만** 가져온다: 컬럼 이름의 뜻, 약어 풀이.
// "ca_act_tp는 활동유형코드"는 어느 집계 규칙을 쓰든 사실이다.
// 챗봇은 계산하지 않는다 — 이미 집계된 값을 문서에 옮길 뿐이라, 필요한 건
// "값을 어떻게 구하는가"가 아니라 "이 값이 무엇인가"다.
// ────────────────────────────────────────────────────────────────
import { glossary } from '../schema/glossary.js'
import { loadTableSchema, listTableIndex } from '../schemaLoader.js'

/** 이 파이프라인이 실제로 읽는 테이블과, 문서·정의에 이름이 드러나는 컬럼만. */
const COLUMNS_BY_TABLE = {
  FCT_ACTIVITY_v2: ['act_dt_fr', 'act_result', 'tp_key', 'lead_key', 'cnt'],
  FCT_LEAD: ['lead_reg_dt', 'ca_act_tp', 'cl_sc_key', 'lead_key', 'cnt'],
  FCT_CONTRACT_KTWS: ['contract_dt', 'cn_sc_key', 'lead_key', 'cancel_dt', 'cnt'],
  DIM_CRM_ACT_TYPE: ['tp_nm', 'tp_cd', 'tp_grp_1'],
  DIM_MNG_USER: ['sc_key', 'dealer_key'],
  DIM_MNG_DEALER: ['dealer_nm', 'BRAND'],
}

/**
 * 퍼널과 상관있는 용어만. 나머지(NPS·PMA·해피보드·목표·차량사양 키)는 이 문서에
 * 나오지 않아서, 넣으면 챗봇이 없는 얘기를 끌어다 쓸 여지만 만든다.
 *
 * g03(cnt vs actual_cnt)은 일부러 넣는다 — 이 문서는 actual_cnt가 아니라 전체를
 * 세는데(정의서 3-2 "판매 목적 여부와 무관하게 전부 포함"), 그 구분을 모르면
 * 챗봇이 "실적 건수"라고 잘못 부른다.
 */
const GLOSSARY_IDS = ['g01', 'g02', 'g03', 'g05', 'g06', 'g13', 'g15']

let cached = null

const fileFor = (table) => listTableIndex().find((t) => t.id === table)?.file

/** 컬럼 설명은 한 줄로 줄인다 — 원문은 두세 문장짜리도 있어서 그대로 넣으면 블록이 배가 된다. */
const firstSentence = (text) => String(text ?? '').split(/(?<=다)\.\s|\.\s/)[0].trim().replace(/\.$/, '')

export function buildVocabularyBlock() {
  if (cached) return cached

  const lines = []
  for (const [table, wanted] of Object.entries(COLUMNS_BY_TABLE)) {
    const file = fileFor(table)
    const schema = file ? loadTableSchema(file) : null
    if (!schema) continue
    const picked = wanted
      .map((name) => schema.columns?.find((c) => c.name === name))
      .filter(Boolean)
      .map((c) => `    ${c.name} — ${firstSentence(c.description)}`)
    if (picked.length) lines.push(`  ${table}\n${picked.join('\n')}`)
  }

  const terms = GLOSSARY_IDS
    .map((id) => glossary.find((g) => g.id === id))
    .filter(Boolean)
    .map((g) => `  ${g.term} — ${firstSentence(g.definition)}`)

  cached = `[용어] — 이름의 뜻입니다. 값을 어떻게 집계했는지는 위 [쓸 수 있는 데이터]의 정의를 따르세요.
이 문서의 지표는 다른 화면(KTWS)과 집계 규칙이 다릅니다 — 여기 컬럼 설명을 근거로
"이 숫자는 이렇게 계산됐다"고 새로 지어 쓰지 마세요.

원천 컬럼
${lines.join('\n')}

약어·용어
${terms.join('\n')}`
  return cached
}

/** 테스트에서 파일을 바꿔 가며 확인할 수 있게 열어 둔다. */
export function resetVocabularyCache() {
  cached = null
}
