// 조회 결과를 화면으로 만든다 — **LLM이 HTML을 직접 쓴다.**
//
// 왜 툴을 걷어냈나: 전에는 chart_type / label_key / value_key / y_keys / orientation …
// 같은 스키마에 차트를 가둬 놨다. 그러면 모델이 표현할 수 있는 그림이 스키마가 미리
// 예상한 것뿐이라, 조금만 벗어난 요청("이 두 개를 겹쳐서", "비중을 옆에 띄워줘")마다
// 스키마를 늘려야 했고 그때마다 축 매핑이 어긋나 빈 차트·뒤바뀐 축이 났다.
// HTML 작성 탭(dealerFunnel/htmlEdit.js)은 같은 문제를 재량을 열어서 풀었다 —
// 모델이 인라인 SVG를 직접 그린다. 여기도 같은 방식을 쓴다.
//
// 대신 재량을 열어도 무너지면 안 되는 것 둘은 코드가 지킨다:
//   숫자   모델에게 넘기는 행 말고는 쓸 값이 없다. 지어낸 수를 못 쓰게 검사한다.
//   격리   외부 요청이 하나라도 있으면 문서를 버린다(사내망에서 빈 차트가 되는 사고).
//
// 문서가 작아서(차트 하나 + 표) 매번 통째로 다시 쓴다. HTML 작성 탭의 블록 패치는
// 48KB 문서라 필요했던 것이고, 여기서는 그 기계장치가 오히려 버그 표면이 된다.
import { createLlmClient, missingConfigMessage } from '../../llm/index.js'
import { extractEdit, findExternalRefs, findUnthemedColors, findThemeGaps } from '../../dealerFunnel/htmlEdit.js'

/** 모델에 넘길 행 상한. 넘으면 잘라서 넘기고 잘랐다는 사실을 문서에 적게 한다. */
export const MAX_ROWS_TO_MODEL = 300

export const RENDER_SYSTEM_PROMPT = `당신은 조회 결과 하나를 보여주는 **완결된 HTML 문서**를 쓰는 사람입니다.

이 문서는 파일 하나로 열립니다. 차트 종류·배치·구성은 당신이 정합니다 — 막대든 선이든
도넛이든, 표만 두든, 큰 숫자 하나만 두든 데이터에 맞는 모습을 고르세요.

지켜야 할 것

1. **외부 요청을 만들지 않습니다.** CDN 스크립트·외부 스타일시트·웹폰트·원격 이미지 모두
   금지입니다. 차트는 인라인 <svg>로 직접 그리고, 필요하면 문서 안 <style>·<script>만 씁니다.
   외부 참조가 하나라도 있으면 이 문서는 버려집니다.

2. **숫자를 지어내지 않습니다.** 쓸 수 있는 값은 [조회 결과]로 받은 행이 전부입니다.
   합계·비율·차이는 그 행에서 계산해도 되지만, 받지 않은 기간·항목·항목값을 만들어
   넣지 마세요. 축 눈금과 0은 예외입니다.

3. **색은 토큰으로 씁니다.** 아래 블록을 <style> 맨 앞에 **그대로 붙여넣고**, 문서의 모든
   색을 이 토큰으로만 쓰세요. #2a78d6처럼 값을 직접 박으면 다크모드에서 안 바뀝니다
   (만든 사람 화면에서는 멀쩡해 보이고 남의 화면에서만 깨집니다).
   색이 더 필요하면 같은 방식으로 세 곳 모두에 토큰을 추가합니다.

:root{--bg:#ffffff;--fg:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--surface:#f9fafb;
--s0:#2a78d6;--s1:#e8833a;--s2:#3aa76d;--s3:#8b5cf6}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16181d;--fg:#e8eaed;
--muted:#9aa0a6;--line:#2d3138;--surface:#1e2128;--s0:#5c9ee8;--s1:#f0a05e;--s2:#5bc48c;--s3:#a78bfa}}
:root[data-theme="dark"]{--bg:#16181d;--fg:#e8eaed;--muted:#9aa0a6;--line:#2d3138;--surface:#1e2128;
--s0:#5c9ee8;--s1:#f0a05e;--s2:#5bc48c;--s3:#a78bfa}
body{background:var(--bg);color:var(--fg)}

4. **계열 이름을 그림 안에 직접 답니다.** 범례만 두지 마세요 — 색만으로는 구분이 안 되는
   경우가 있습니다. 값도 눈에 보이게 적습니다.

5. **가로로 넘치지 않게 합니다.** 표가 넓으면 그 표만 overflow-x:auto 안에 넣습니다.
   문서 본문이 좌우로 밀리면 안 됩니다.

6. 한국어 문서입니다. 실무 보고서 말투로 씁니다.

7. **근거를 문서 아래에 한 줄 남깁니다.** [이 숫자가 나온 경로]로 받은 내용을 그대로
   요약해 적으세요(어느 리포트/지표에서 나왔는지, 무엇을 한 건으로 셌는지).
   유보(caveat)를 받았다면 반드시 그 문장을 적습니다 — 숫자만 크게 띄우고 유보를 빼면
   읽는 사람은 그것을 업무상의 확정된 건수로 읽습니다.

8. 행이 잘렸다고 알려주면 문서에 "상위 N행만 표시" 같은 표시를 남깁니다.

출력 형식 — 아래만 내보냅니다. 코드펜스(\`\`\`)도, 인사말도, 설명도 붙이지 않습니다.

<!--SUMMARY: 무엇을 그렸는지 한국어 한 문장-->
<!doctype html>
<html lang="ko">
…문서 전체…
</html>`

/** 결과 행을 프롬프트 블록으로. 값은 그대로, 날짜는 저장된 그대로의 ISO 10자로. */
export function buildResultBlock({ question, columns, rows, value, title, provenance, level }) {
  const shown = (rows || []).slice(0, MAX_ROWS_TO_MODEL)
  const truncated = (rows || []).length > shown.length

  const cell = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)
  const compact = shown.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cell(v)])))

  const lines = [`[질문]\n${question}`, '']
  lines.push('[조회 결과]')
  if (title) lines.push(`제목: ${title}`)
  if (value != null && !compact.length) {
    lines.push(`단일 값: ${value}`)
  } else {
    lines.push(`컬럼: ${(columns || Object.keys(compact[0] || {})).join(', ')}`)
    lines.push(`행 수: ${(rows || []).length}${truncated ? ` (아래에는 상위 ${shown.length}행만 실었습니다 — 문서에 그 사실을 적으세요)` : ''}`)
    lines.push(JSON.stringify(compact))
  }
  lines.push('')
  lines.push('[이 숫자가 나온 경로]')
  lines.push(`해결 계층: ${level}`)
  for (const [k, v] of Object.entries(provenanceLines(provenance))) lines.push(`${k}: ${v}`)
  return lines.join('\n')
}

function provenanceLines(p) {
  if (!p) return {}
  const out = {}
  if (p.report_id) out['등록 리포트'] = p.report_id
  if (p.metric_id) out['등록 지표'] = p.metric_id
  if (p.root_table) out['root 테이블'] = p.root_table
  const grain = p.row_grain || p.grain
  if (grain) {
    out['셈 단위'] = `${grain.entity} 1건 = ${grain.unique_key || '표의 한 행'}`
    if (grain.caveat) out['⚠ 유보'] = grain.caveat
  }
  if (p.pushdown && Object.keys(p.pushdown).length) {
    out['리포트에 내려보낸 조건'] = Object.entries(p.pushdown).map(([k, v]) => `${k}=${v}`).join(', ')
  }
  if (p.residual?.length) out['실행 후 행에서 건 조건'] = p.residual.join(' · ')
  if (p.fetched != null) out['행 수'] = `${p.fetched} → ${p.after_filter}`
  return out
}

// 문서가 쓴 숫자가 데이터에서 왔는지 본다.
//
// 완벽한 검사는 불가능하고 그럴 필요도 없다 — 축 눈금·백분율·합계는 정상적으로
// 데이터에 없는 수다. 잡으려는 것은 **사람이 읽는 자리에 있는 낯선 수**다.
//
// ── 마크업을 통째로 걷어내는 이유 ─────────────────────────────
// 차트를 인라인 SVG로 그리면 x="100" y="400" width="260" 같은 좌표가 수십 개 나온다.
// 이걸 세면 경고가 **매번** 뜨고, 매번 뜨는 경고는 아무도 안 본다 — 정작 진짜
// 지어낸 수가 섞였을 때 묻힌다. 2026-08-12 실측: 막대 차트 하나에 오탐 21개.
// 사람이 읽는 것은 태그 사이의 글자다. 그것만 본다.
// ────────────────────────────────────────────────────────────
const NUMBER_RE = /\d[\d,]*\.?\d*/g

/** 눈금처럼 보이는 수인가. 축 눈금은 둥근 수이고 데이터 최대치를 크게 넘지 않는다. */
function looksLikeAxisTick(n, maxKnown) {
  if (n % 10 !== 0) return false
  return maxKnown > 0 && n <= maxKnown * 2
}

export function findInventedNumbers(html, rows, extraValues = []) {
  const known = new Set()
  const remember = (v) => {
    if (v == null) return
    const n = Number(String(v).replace(/,/g, ''))
    if (!Number.isFinite(n)) return
    known.add(n)
    // 합·차·비율까지 다 계산할 수는 없으므로 반올림 변형만 같은 값으로 본다.
    known.add(Math.round(n))
  }
  for (const row of rows || []) for (const v of Object.values(row)) remember(v)
  for (const v of extraValues) remember(v)

  // 데이터에 있는 값들의 합계도 정상적인 수다(모델이 합을 적는 것은 요청된 일이다).
  const sums = new Set()
  for (const key of new Set((rows || []).flatMap((r) => Object.keys(r)))) {
    let s = 0
    let any = false
    for (const row of rows || []) {
      const n = Number(String(row[key] ?? '').replace(/,/g, ''))
      if (Number.isFinite(n)) { s += n; any = true }
    }
    if (any) sums.add(Math.round(s))
  }

  const maxKnown = known.size ? Math.max(...known) : 0

  const text = String(html ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')                   // 태그와 속성(=SVG 좌표)을 통째로 뺀다
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')

  const suspects = []
  for (const m of text.matchAll(NUMBER_RE)) {
    const raw = m[0]
    const n = Number(raw.replace(/,/g, ''))
    if (!Number.isFinite(n)) continue
    if (n < 100) continue                       // 순번·백분율은 작은 수다
    if (known.has(n) || known.has(Math.round(n))) continue
    if (sums.has(Math.round(n))) continue
    if (/^20\d\d$/.test(raw)) continue          // 연도
    if (looksLikeAxisTick(n, maxKnown)) continue
    suspects.push(raw)
  }
  return [...new Set(suspects)]
}

/**
 * 결과를 HTML 문서로 만든다. instruction이 있으면 지금 문서를 그 지시대로 다시 쓴다.
 *
 * @returns {Promise<{html, summary, warnings}|{error: string}>}
 */
export async function renderResultHtml({
  question, columns, rows, value, title, provenance, level,
  instruction = null, html: previousHtml = null, history = [], modelId = null,
  llm = null,
}) {
  const resultBlock = buildResultBlock({ question, columns, rows, value, title, provenance, level })

  // 순서가 곧 캐시 적중률이다 — 턴마다 안 바뀌는 것(시스템 프롬프트·조회 결과)을 앞에,
  // 바뀌는 것(지금 문서·이번 지시)을 뒤에 둔다. dealerFunnel/htmlEdit.js와 같은 이유.
  const messages = [
    { role: 'system', content: RENDER_SYSTEM_PROMPT },
    { role: 'user', content: resultBlock },
  ]
  if (previousHtml) {
    messages.push({ role: 'user', content: `[지금 문서]\n${previousHtml}` })
  }
  for (const h of history.slice(-4)) {
    if (h?.role && h?.content) messages.push({ role: h.role, content: String(h.content).slice(0, 2000) })
  }
  messages.push({
    role: 'user',
    content: instruction
      ? `[이번 지시]\n${instruction}\n\n지시대로 고친 문서 전체를 다시 내보내세요.`
      : '이 결과를 보여주는 문서를 만들어 주세요.',
  })

  let content
  if (llm) {
    content = await llm(messages)
  } else {
    const made = createLlmClient(modelId)
    if (!made) return { error: missingConfigMessage(modelId) }
    let res
    try {
      // 0으로 두면 "좀 더 보기 좋게" 같은 여지 있는 지시에 매번 같은 답이 나와
      // 다시 시켜도 화면이 그대로다. htmlEdit.js와 같은 값을 쓴다.
      res = await made.client.chat.completions.create({ model: made.model, messages, temperature: 0.3 })
    } catch (error) {
      return { error: error.message || '화면 생성 호출에 실패했습니다.' }
    }
    const choice = res.choices?.[0]
    if (choice?.finish_reason === 'length') {
      return { error: '출력이 중간에 끊겼습니다. 표시할 행을 줄이거나 지시 범위를 좁혀 주세요.' }
    }
    content = choice?.message?.content
  }

  const parsed = extractEdit(content)
  if (parsed.error) return parsed

  // 외부 참조는 경고가 아니라 실패다. 만든 사람 자리에서는 캐시 때문에 멀쩡히 보이고
  // 사내망에서만 빈 차트가 된다 — 통과시키면 아무도 못 잡는다.
  const external = findExternalRefs(parsed.html)
  if (external.length) {
    return { error: `문서가 외부 자원을 참조합니다(${external.slice(0, 3).join(', ')}). 파일 하나로 열려야 합니다.` }
  }

  const warnings = []
  // 근거(몇 행을 조회해 몇 행이 남았는지)를 문서에 적으라고 시켜 놓았으므로 그 수들도
  // "아는 값"이다. 안 넣으면 시킨 대로 적은 문서가 매번 경고를 받고, 정작 잘못 옮겨
  // 적은 경우(2026-08-12 실측: 3081을 3085로)를 구분할 수 없다.
  const invented = findInventedNumbers(parsed.html, rows, [value, provenance?.fetched, provenance?.after_filter])
  if (invented.length) {
    warnings.push(`데이터에 없는 숫자가 문서에 있습니다: ${invented.slice(0, 8).join(', ')}`)
  }
  const unthemed = findUnthemedColors(parsed.html)
  if (unthemed.length) warnings.push(`토큰이 아닌 색 ${unthemed.length}개 — 다크모드에서 안 바뀝니다.`)
  const gaps = findThemeGaps(parsed.html)
  if (gaps.length) warnings.push(...gaps)

  return { html: parsed.html, summary: parsed.summary || '결과 화면을 만들었습니다.', warnings }
}
