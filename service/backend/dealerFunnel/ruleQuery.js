// 딜러 계약퍼널 — 정의서 규칙 + 스키마를 주고 LLM이 SQL을 쓰게 한다.
//
// 인증 리포트(등록 SQL 실행)와 반대 방향의 선택이다. 축·지표를 미리 정해 두지 않으므로
// 무엇이든 물어볼 수 있는 대신, **SQL이 맞는지 대조할 정답이 없다.** 틀린 SQL은 오류를
// 내지 않고 그럴듯한 숫자를 낸다.
//
// 그래서 막을 수 있는 것은 코드로 막는다:
//   읽기 전용   queryFabricWithTimeout의 assertReadOnly — SELECT/WITH만 통과
//   테이블 제한 퍼널이 읽는 10개 밖의 이름이 나오면 실행하지 않는다
//   행 수 상한  문서에 실을 수 있는 양을 넘으면 자르고 그 사실을 알린다
//   시간 상한   느린 쿼리는 취소한다
//
// 막을 수 없는 것은 **드러낸다** — 실행한 SQL을 결과와 함께 돌려줘서, 숫자가 이상하면
// 사람이 SQL을 보고 판단할 수 있게 한다. 문서에도 조회 근거를 적게 한다.
import { queryFabricWithTimeout } from '../fabricClient.js'
import { loadTableSchema, listTableIndex } from '../schemaLoader.js'
import { streamAssistantTurn } from '../azureStream.js'
import { createLlmClient } from '../llm/index.js'
import { ALLOWED_TABLES, FUNNEL_SQL_RULES, SQL_OUTPUT_RULES } from './rules.js'
import { CHANNEL_ORDER } from './channelMap.js'

const DB = 'KPI_W'
export const MAX_ROWS = 200
const TIMEOUT_MS = 60_000
const NEWLINE = String.fromCharCode(10)
const SEP = NEWLINE + NEWLINE

let schemaBlock = null
let valuesBlock = null

/**
 * 축의 **실제 값**을 알려준다.
 *
 * 규칙과 스키마는 구조를 알려주지만 값은 안 알려준다. 2026-08-11 실측: "렉서스 강남
 * 딜러의 활동 건수"에 모델이 dealer_nm = '강남'으로 썼다(실제 값은 '렉서스 강남').
 * SQL은 규칙을 다 지켰는데 0행이 나왔고, 오류가 아니라서 "그 달에 활동이 없었나 보다"로
 * 읽힌다 — 틀린 값보다 나쁜 실패다.
 *
 * 딜러 16개·브랜드 2개·채널 4개는 셀 수 있어 통째로 넣는다. 모델명은 수가 많아 넣지
 * 않는다 — 대신 규칙 3-3이 조인 경로를 알려준다. 하루 한 번꼴로 바뀌므로 캐시한다.
 */
/**
 * 값 사전 본문. Fabric 없이 검증할 수 있게 조회와 분리했다.
 *
 * **값과 설명을 섞지 않는다.** 전에는 "렉서스 강남(LEXUS)"처럼 브랜드를 괄호로 덧붙였는데,
 * "이 값을 그대로 쓰라"고 해 놓아서 모델이 괄호까지 붙여 조건을 걸었다 —
 * dealer_nm IN ('렉서스 강남(LEXUS)', …) 로 나가 0행이 됐다(2026-08-12 실측).
 * 오류가 아니라 빈 결과라서 "12월엔 계약이 없었나 보다"로 읽힌다.
 */
export function buildValuesBlockFrom(dealerRows, pmaRows) {
  const byBrand = new Map()
  for (const r of dealerRows || []) {
    if (!byBrand.has(r.BRAND)) byBrand.set(r.BRAND, [])
    byBrand.get(r.BRAND).push(r.dealer_nm)
  }
  const dealerLines = [...byBrand.entries()]
    .map(([brand, names]) => `    ${brand}: ${names.join(' · ')}`)
    .join(NEWLINE)
  const codes = (pmaRows || []).map((r) => `'${r.pma_cd}'(${r.pma_type})`)

  return `[축의 실제 값] 조건에는 **아래 값만 그대로** 씁니다. 괄호 안 설명은 값이 아닙니다.
  BRAND (DIM_MNG_DEALER.BRAND)  'LEXUS' · 'TOYOTA'
  dealer_nm (DIM_MNG_DEALER)  ${byBrand.size ? '브랜드별로 아래와 같습니다. 값에 브랜드가 이미 들어 있습니다.' : '(조회 실패 — 딜러 조건은 걸지 마세요)'}
${dealerLines}
  pma_yn (FCT_CONTRACT_KTWS)  ${codes.length ? codes.join(' · ') : '(조회 실패)'}
     → **Y/N 둘뿐이 아닙니다.** 비율을 낼 때 분모에서 'etc'를 빼먹지 마세요.
  채널 (3-1 매핑 결과)  ${CHANNEL_ORDER.join(' · ')}
  카테고리  기존고객 · 신규유입`
}

export async function buildValuesBlock() {
  if (valuesBlock) return valuesBlock
  const fetch = async (sql, label) => {
    try { return await queryFabricWithTimeout(DB, sql, 30000) } catch (error) {
      // 값 사전을 못 만들어도 조회 자체는 막지 않는다 — 조건 없는 질문은 그대로 답할 수 있다.
      console.warn(`[dealer-funnel] ${label} 조회 실패:`, error.message)
      return []
    }
  }
  const dealerRows = await fetch(
    'SELECT DISTINCT LTRIM(RTRIM(dealer_nm)) AS dealer_nm, BRAND FROM ktws.DIM_MNG_DEALER'
    + " WHERE dealer_nm IS NOT NULL AND LTRIM(RTRIM(dealer_nm)) <> '' ORDER BY BRAND, dealer_nm", '딜러 목록')
  const pmaRows = await fetch('SELECT pma_cd, pma_type FROM ktws.DIM_PMA_ORDER ORDER BY pma_order', 'PMA 코드')

  valuesBlock = buildValuesBlockFrom(dealerRows, pmaRows)
  return valuesBlock
}

export function resetValuesCache() { valuesBlock = null }

/** 퍼널이 읽는 테이블만, 컬럼 이름과 뜻 한 줄씩. 전체 23개를 던지면 라우팅 부담만 커진다. */
export function buildSchemaBlock() {
  if (schemaBlock) return schemaBlock
  const parts = []
  for (const table of ALLOWED_TABLES) {
    const file = listTableIndex().find((t) => t.id === table)?.file
    const schema = file ? loadTableSchema(file) : null
    if (!schema) continue
    const cols = (schema.columns || [])
      .map((c) => `    ${c.name} (${c.type}) — ${String(c.description ?? '').split(/\.\s|다\.\s/)[0].trim().replace(/\.$/, '')}`)
      .join('\n')
    parts.push(`  ktws.${table} — ${schema.description ?? ''}\n${cols}`)
  }
  schemaBlock = `[스키마] 모두 KPI_W 데이터베이스의 ktws 스키마입니다.\n${parts.join('\n\n')}`
  return schemaBlock
}

export function resetSchemaCache() { schemaBlock = null }

const SQL_FENCE = /```(?:sql)?\s*([\s\S]*?)```/i

/** 모델 응답에서 SQL만 뽑는다. 코드펜스를 안 쓰는 판도 있어서 SELECT/WITH부터 잘라 본다. */
export function extractSql(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null
  const fenced = text.match(SQL_FENCE)
  const body = (fenced ? fenced[1] : text).trim()
  const start = body.search(/\b(SELECT|WITH)\b/i)
  return start >= 0 ? body.slice(start).replace(/;\s*$/, '').trim() : null
}

/**
 * SQL이 허용된 테이블만 건드리는지 본다.
 *
 * 읽기 전용 검사는 fabricClient가 하지만, 그것만으로는 퍼널과 무관한 테이블을 훑는 걸
 * 못 막는다. 이 화면은 딜러 계약퍼널 문서를 만드는 자리라, 여기서 인사·재고 테이블을
 * 조회할 이유가 없다.
 *
 * @returns {string[]} 허용되지 않은 테이블 이름
 */
export function findDisallowedTables(sql) {
  const allowed = new Set(ALLOWED_TABLES.map((t) => t.toLowerCase()))
  const seen = new Set()
  // FROM/JOIN 뒤에 오는 이름만 본다. 별칭·CTE 이름은 스키마 접두사가 없어 걸러진다.
  for (const m of String(sql ?? '').matchAll(/\b(?:FROM|JOIN)\s+([A-Za-z_][\w]*)\s*\.\s*\[?([A-Za-z_][\w]*)\]?/gi)) {
    const [, schema, table] = m
    if (schema.toLowerCase() !== 'ktws') { seen.add(`${schema}.${table}`); continue }
    if (!allowed.has(table.toLowerCase())) seen.add(table)
  }
  return [...seen]
}

/**
 * 실행 전에 막는 규칙.
 *
 * 셋 다 **오류를 내지 않고 조용히 다른 답을 만드는** 패턴이다. 문서에 실리면
 * 그럴듯해 보여서 사람이 못 잡는다 — 프롬프트로만 부탁하고 검사하지 않으면
 * 지켜지는 판과 안 지켜지는 판이 섞인다(실행마다 SQL이 달라지는 경로다).
 *
 * @param {string} sql
 * @param {string} instruction 사용자가 "상위 N개"를 명시했는지 보려고 함께 받는다
 * @returns {string[]} 위반 사유. 비어 있으면 통과.
 */
export function checkSqlRules(sql, instruction = '') {
  const s = String(sql ?? '')
  const out = []

  // 사용자가 상위 N개를 달라고 했으면 자르는 게 맞다. 그때만 허용한다.
  const wantsTop = /상위|최상위|top\s*\d|많은\s*순|\d+\s*(개|건)만|가장\s*(많|높|큰)/i.test(String(instruction ?? ''))
  if (!wantsTop && /\bSELECT\s+(?:DISTINCT\s+)?TOP\s*\(?\s*\d/i.test(s)) {
    out.push('TOP을 썼습니다 — "상위 N개"를 요청받지 않았으면 쓰지 않습니다. 잘린 결과가 전체인 양 문서에 실립니다.')
  }
  if (!wantsTop && /\bOFFSET\s+\d+\s+ROWS?\b|\bFETCH\s+(?:FIRST|NEXT)\b/i.test(s)) {
    out.push('OFFSET/FETCH로 결과를 잘랐습니다 — 요청받지 않은 자르기입니다.')
  }

  // EXISTS (SELECT * ...) / EXISTS (SELECT 1 ...)은 관용구라 뺀다.
  const starless = s.replace(/EXISTS\s*\(\s*SELECT\s+[*1]/gi, 'EXISTS (SELECT 1')
  if (/\bSELECT\s+(?:DISTINCT\s+)?(?:[A-Za-z_]\w*\s*\.\s*)?\*/i.test(starless)) {
    out.push('SELECT *를 썼습니다 — 문서에 실릴 열을 사람이 정할 수 없습니다. 필요한 컬럼만 별칭을 붙여 고르세요.')
  }

  if (/\bBETWEEN\s+'?\d{4}-\d{2}-\d{2}/i.test(s)) {
    out.push("날짜에 BETWEEN을 썼습니다 — 끝날에 시간이 붙은 행이 통째로 빠집니다. >= 시작 AND < 끝 으로 쓰세요.")
  }

  return out
}

const SYSTEM_PROMPT = `당신은 렉서스·토요타 딜러 계약퍼널 데이터를 조회하는 SQL을 씁니다.
아래 규칙과 스키마만으로 조회문을 작성하세요. 규칙은 실제 운영에서 틀렸던 자리를 모은 것이라,
어겨도 오류가 안 나고 **그럴듯한 틀린 숫자**가 나옵니다.

조회가 필요 없는 지시(색·레이아웃·글꼴 변경, 이미 문서에 있는 값으로 요약)에는
**아무 SQL도 쓰지 말고 정확히 "NO_QUERY"라고만 답하세요.**`

/**
 * 편집 지시에 필요한 데이터를 조회한다.
 *
 * @returns {Promise<{sql, rows, columns, truncated, elapsedMs}|null>}
 *          조회가 필요 없거나 실패하면 null — 조달 실패로 편집까지 막지 않는다.
 */
export async function runRuleQuery({ instruction, modelId = null } = {}) {
  const made = createLlmClient(modelId)
  if (!made) return null
  const { client, model } = made

  const system = [SYSTEM_PROMPT, FUNNEL_SQL_RULES, await buildValuesBlock(), SQL_OUTPUT_RULES, buildSchemaBlock()].join(SEP)
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: instruction },
  ]

  const ask = async () => {
    let text = ''
    await streamAssistantTurn(client, {
      model, messages, temperature: 0, onText: (t) => { text += t }, agentType: 'html-report-sql',
    })
    return text
  }

  // 규칙을 어기면 **이유를 되먹여 한 번 다시 짜게 한다.** 그냥 실패로 끝내면 사용자는
  // 무엇이 문제인지 모른 채 다시 물어야 하고, 그대로 실행하면 조용히 틀린 답이 나간다.
  let sql = null
  let violations = []
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let text
    try {
      text = await ask()
    } catch (error) {
      console.warn('[dealer-funnel] SQL 생성 실패:', error.message)
      return null
    }
    if (/NO_QUERY/.test(text)) return null
    sql = extractSql(text)
    if (!sql) return null

    const bad = findDisallowedTables(sql)
    violations = [
      ...(bad.length ? ['허용되지 않은 테이블을 조회하려 했습니다: ' + bad.join(', ')] : []),
      ...checkSqlRules(sql, instruction),
    ]
    if (!violations.length) break

    if (attempt === 0) {
      console.warn('[dealer-funnel] SQL 규칙 위반 — 다시 요청합니다: ' + violations.join(' / '))
      messages.push(
        { role: 'assistant', content: sql },
        { role: 'user', content: '방금 SQL이 규칙을 어겼습니다:' + SEP + violations.map((v) => '- ' + v).join(NEWLINE) + SEP + '고쳐서 다시 쓰세요. 설명 없이 SQL만.' },
      )
    }
  }

  if (violations.length) {
    // 두 번 시도해도 안 고쳐지면 실행하지 않는다 — 조용히 틀린 답보다 못 가져온 게 낫다.
    return { sql, error: 'SQL 규칙을 어겨 실행하지 않았습니다: ' + violations.join(' / '), rows: [] }
  }


  const startedAt = Date.now()
  try {
    const rows = await queryFabricWithTimeout(DB, sql, TIMEOUT_MS)
    return {
      sql,
      rows: rows.slice(0, MAX_ROWS),
      columns: rows.length ? Object.keys(rows[0]) : [],
      truncated: rows.length > MAX_ROWS ? rows.length : 0,
      elapsedMs: Date.now() - startedAt,
    }
  } catch (error) {
    // SQL을 함께 돌려준다 — 무엇이 실패했는지 사람이 보고 판단할 수 있어야 한다.
    console.warn('[dealer-funnel] 생성된 SQL 실행 실패:', error.message)
    return { sql, error: error.message, rows: [], elapsedMs: Date.now() - startedAt }
  }
}

/**
 * 조회 결과를 편집 프롬프트에 실을 블록으로 만든다.
 *
 * 실행한 SQL을 값과 함께 넣는다. 대조할 정답이 없는 경로라, 숫자가 이상할 때
 * 사람이 볼 수 있는 근거는 SQL뿐이다. 문서에도 조회 근거를 적게 한다.
 */
export function buildRuleQueryBlock(result) {
  if (!result) return null
  if (result.error) {
    return `[새로 조회한 데이터] 조회에 실패했습니다 — ${result.error}\n`
      + `값을 지어내지 말고, 문서에 "이 데이터는 조회하지 못했습니다"라고 적으세요.\n\n`
      + `시도한 SQL:\n${result.sql}`
  }
  if (!result.rows.length) {
    return '[새로 조회한 데이터] 조회는 됐지만 결과가 0행입니다.\n'
      + '조건에 맞는 데이터가 없다는 뜻입니다 — 값을 채우지 말고 그 사실을 적으세요.\n\n'
      + `실행한 SQL:\n${result.sql}`
  }
  return `[새로 조회한 데이터] — 정의서 규칙으로 방금 조회했습니다.
행 ${result.rows.length}${result.truncated ? ` (전체 ${result.truncated}행 중 앞 ${result.rows.length}행만)` : ''} · ${result.elapsedMs}ms

**문서에 넣을 때 조회 근거를 함께 적으세요** — 이 값은 등록된 리포트가 아니라 이번에 만든
조회문의 결과라, 나중에 숫자가 의심스러우면 그 SQL을 봐야 합니다. 블록 안에 접어두는
형태(예: <details>)로 넣어도 됩니다.

실행한 SQL:
${result.sql}

${JSON.stringify(result.rows)}`
}
