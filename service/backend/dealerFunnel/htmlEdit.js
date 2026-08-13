// 딜러 계약퍼널 — 생성된 단일 HTML을 자연어 지시로 고친다.
//
// buildHtmlReport()가 만든 문서를 사람이 말한 대로 다시 쓴다. 이 기능의 성패는
// 값의 정확도가 아니라 **"말한 대로 나왔는가"**다. 그래서 모델의 재량을 좁히지
// 않는다 — 요청이 문서를 크게 뜯어고치는 것이어도 그대로 하게 둔다.
//
// 대신 되돌릴 수 있게 만든다. 재량을 넓히면 요청하지 않은 부분까지 사라지는 일이
// 생기는데, 그걸 막으려고 프롬프트로 조이면 정작 원하는 변경도 안 된다.
// 그래서 막지 않고 **드러낸다** — 섹션·표·차트가 몇 개 사라졌는지 세어서 돌려주고,
// 버전 이력은 화면이 들고 있다가 한 번에 되돌린다.
//
// 문서 전체를 다시 받는다(부분 패치가 아니다). 부분 패치는 모델이 찍어준 위치가
// 원문과 한 글자만 달라도 조용히 빗나가는데, 그러면 "말한 대로"가 깨진다.
import { createLlmClient, missingConfigMessage } from '../llm/index.js'
import { CHANNEL_ORDER } from './channelMap.js'
import { PRINCIPLES_BLOCK } from './principles.js'
import { buildVocabularyBlock } from './vocabulary.js'
import { buildRuleQueryBlock, runRuleQuery } from './ruleQuery.js'

export const EDIT_SYSTEM_PROMPT = `당신은 단일 HTML 대시보드 문서를 사용자의 지시대로 고치는 편집기입니다.

지켜야 할 것

1. **바뀐 블록만** 내보냅니다. 문서에는 id가 붙은 블록들이 있고, 고칠 블록만 통째로 다시 씁니다.
   블록 안은 반드시 완결된 마크업이어야 하고 "…(이하 동일)" 같은 생략 표시를 쓰지 않습니다 —
   블록은 통째로 교체되므로 생략한 부분은 사라집니다. 건드리지 않을 블록은 아예 내보내지 않습니다.

1-1. **가장 적게 내보내는 방법을 고릅니다.** 출력량이 곧 응답 시간입니다.
   (i) 블록 안 일부만 바뀌면 PATCH(아래 형식)를 씁니다 — 제목·문구·색 한 줄이면 거의 항상 이쪽입니다.
   (ii) 블록을 통째로 다시 짜야 하면 BLOCK을 쓰되, 겹친 블록 중 **가장 작은 것**을 고릅니다.
        b-trend 안에는 차트마다 b-trend-활동·b-trend-계약이 따로 있습니다. 계약 차트만
        고치면 되는데 b-trend를 통째로 내보내면 출력이 10배가 되고 그만큼 느려집니다.
        블록 목록의 크기(B)를 보고 고르세요.
   여러 블록에 걸친 변경이면 해당 블록들을 각각 내보냅니다.
2. 외부 요청을 만들지 않습니다. CDN 스크립트·외부 스타일시트·웹폰트·원격 이미지 모두 금지입니다.
   차트는 인라인 SVG로 직접 그리고, 동작이 필요하면 문서 안의 <script>·<style>만 씁니다.
   이 문서는 파일 하나로 사내망·오프라인에서 열려야 합니다.

2-1. **차트를 새로 그리거나 고칠 때 지킬 것** — 차트 종류·배치·구성은 마음대로 바꿔도 되지만
   아래 넷은 유지합니다. 셋 다 밝은 화면에서는 멀쩡해 보여서 사람이 못 잡는 것들입니다.

   (a) 색은 반드시 var(--s0)~var(--s3)로 씁니다. #2a78d6 같은 값을 직접 박지 마세요 —
       다크모드는 :root의 토큰 값만 갈아끼워 만들어지므로, 직접 박으면 다크모드에서 안 바뀝니다.
       새 색이 필요하면 :root · @media(prefers-color-scheme: dark) · :root[data-theme="dark"]
       **세 곳 모두에** 토큰을 정의하고 그 토큰을 씁니다.
   (b) <style>의 :root 토큰 정의와 두 다크모드 블록을 지웁니다 — 지우지 마세요. 그대로 둡니다.
   (c) 채널은 정해진 색 슬롯을 씁니다: ${CHANNEL_ORDER.map((c, i) => `${c}=--s${i}`).join(' · ')}.
       행 순번으로 색을 주면 필터로 채널 하나가 빠졌을 때 남은 채널의 색이 밀려서,
       "온라인유입은 노랑"으로 읽던 사람이 다음 화면에서 초록을 봅니다.
   (d) 계열 이름을 그림 안에 직접 답니다(class="direct") — 범례만 두지 마세요.
       라이트 모드에서 일부 색이 표면 대비 3:1 미만이라 색만으로는 구분되지 않습니다.
3. 지시하지 않은 부분은 그대로 둡니다. 요청과 무관한 섹션을 지우거나 다시 쓰지 않습니다.
4. 숫자는 지어내지 않습니다. 쓸 수 있는 값은 두 곳에서 옵니다 —
   (a) 지금 문서에 이미 있는 값, (b) [쓸 수 있는 데이터]로 함께 받은 집계 결과.
   문서에 없는 지표·축을 요청받으면 (b)에서 찾아 씁니다. 문서에 없다는 이유로 거절하지 마세요.
   (b)에도 없으면 그때는 값을 채우지 말고, 어떤 데이터가 없어서 못 채웠는지 문서에 적습니다.
   다만 사용자가 예시·더미 값을 분명히 요청하면 만들어 주되 문서에 "예시"라고 표시합니다.
   [쓸 수 있는 데이터]의 지표 정의(기간 기준·채널 귀속 근거)와 다르게 이름 붙이지 않습니다.
5. **요청을 축소하지 않습니다.** 구조를 크게 바꾸거나 기존 표현을 버리는 요청이어도 그대로 해냅니다.
   "이렇게 하는 편이 낫다"는 판단으로 지시를 부분만 반영하지 않습니다.
   지시가 데이터 정의와 충돌하면(예: Gross 계약을 순계약처럼 부르기) 요청대로 고치되
   문서 안에 한 줄로 그 사실을 남깁니다.
6. 한국어 문서입니다. 새로 쓰는 문구도 한국어로, 실무 보고서 말투로 씁니다.
7. **문구를 새로 쓰거나 고칠 때는 [문구를 쓸 때 지킬 판단 원칙]을 따릅니다.** 요약·해설·제목처럼
   숫자를 말로 옮기는 자리에 적용되며, 레이아웃·색·차트 종류를 바꾸는 일에는 해당하지 않습니다.
   특히 진행 중인 달을 전월과 그냥 비교하지 말고(원칙 5), 채널 비중을 100% 기준으로 말하지
   마세요(원칙 7-2) — 이 문서의 계약은 일부가 채널 미상입니다.

출력 형식 — 아래 형식만 내보냅니다. 코드펜스(\`\`\`)도, 인사말도, 설명도 붙이지 않습니다.

<!--SUMMARY: 무엇을 어떻게 바꿨는지 한국어 한 문장-->
<!--BLOCK id="b-trend"-->
<section class="block" id="b-trend">…이 블록의 새 내용 전부…</section>
<!--/BLOCK-->

블록을 **새로 만들** 때는 어디 뒤에 넣을지 함께 적습니다(id는 새로 짓습니다):
<!--BLOCK id="b-exec-summary" after="b-notice"-->
<section class="block" id="b-exec-summary">…</section>
<!--/BLOCK-->

블록 안에서 **일부만** 바꾸면 되는데 블록이 클 때(차트 SVG 등)는 이 형식이 훨씬 낫습니다.
FIND는 그 블록 안에 **정확히 한 번만** 나오는 문자열을 원문 그대로 적습니다(한 글자도 다르면 실패):
<!--PATCH id="b-trend-계약"-->
<!--FIND--><figcaption>계약 — 채널별</figcaption><!--/FIND-->
<!--TO--><figcaption>계약 추이 (Gross)</figcaption><!--/TO-->
<!--/PATCH-->

블록을 **지울** 때:
<!--REMOVE id="b-spread"-->

블록의 여는 태그에 원래 id를 그대로 유지하세요. id가 없어지면 다음 턴에 그 블록을 못 고칩니다.
CSS를 고쳐야 하면 <style id="doc-style"> 블록을 같은 방식으로 다시 씁니다.

**문서 전체를 다시 써야 하는 요청**(전체 레이아웃 개편, 인쇄용 재구성 등)일 때만 아래를 씁니다.
느리고 비싸니 정말 전역일 때만 쓰고, 한 블록으로 되는 일에는 쓰지 마세요.
<!--DOCUMENT-->
<!doctype html>
…문서 전체…
</html>
<!--/DOCUMENT-->`

// ─── 블록 단위 편집 ────────────────────────────────────────────────
// 문서 전체를 매번 다시 받으면 출력이 48KB(≈2만 토큰)씩 나온다. 지연의 대부분이 출력이라
// 한 턴에 1~2분씩 걸렸고 비용도 그만큼 들었다 — "제목 한 줄 바꿔줘"에도 똑같이.
//
// 그래서 문서에 고정 id를 박고(htmlReport.js), 모델은 **바뀐 블록만** 돌려준다.
// 이어붙이는 건 코드가 한다. 입력은 여전히 문서 전체지만(구조를 봐야 어디를 고칠지 안다)
// 입력은 캐시되고 값도 싸다. 전체를 다시 써야 하는 요청은 DOCUMENT로 열어 둔다 —
// "A4 한 장에 맞춰줘" 같은 건 실제로 전역이라 막으면 그 요청이 안 된다.

const BLOCK_RE = /<!--\s*BLOCK\s+([^>]*?)-->([\s\S]*?)<!--\s*\/BLOCK\s*-->/gi
const REMOVE_RE = /<!--\s*REMOVE\s+([^>]*?)-->/gi
// 블록 안의 한 조각만 바꾸는 경로. 차트 블록은 SVG라 7~8KB인데, 제목 한 줄 바꾸려고
// 전체를 다시 쓰면 출력이 3,000토큰이고 1분이 넘는다(2026-08-11 실측 65.5초).
// 찾을 문자열이 그 블록 안에 **정확히 한 번** 나올 때만 적용한다 — 여러 번 나오면
// 어느 쪽인지 알 수 없으므로 조용히 첫 번째를 고치지 않고 실패로 알린다.
const PATCH_RE = /<!--\s*PATCH\s+([^>]*?)-->\s*<!--\s*FIND\s*-->([\s\S]*?)<!--\s*\/FIND\s*-->\s*<!--\s*TO\s*-->([\s\S]*?)<!--\s*\/TO\s*-->\s*<!--\s*\/PATCH\s*-->/gi
const DOCUMENT_RE = /<!--\s*DOCUMENT\s*-->([\s\S]*?)<!--\s*\/DOCUMENT\s*-->/i
const ATTR_RE = /([\w-]+)\s*=\s*"([^"]*)"/g

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * id로 지목된 요소의 시작·끝을 찾는다. 같은 태그가 안에 중첩돼도 짝을 맞춘다 —
 * `<section id="x">…<section>…</section>…</section>` 에서 첫 `</section>`으로 끊으면
 * 뒷부분이 통째로 잘려 나간다.
 */
export function findElementById(html, id) {
  const s = String(html ?? '')
  const open = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\bid\\s*=\\s*["']${escapeRe(id)}["'][^>]*>`, 'i')
  const m = open.exec(s)
  if (!m) return null
  const tag = m[1]
  if (m[0].endsWith('/>')) return { start: m.index, end: m.index + m[0].length, tag }

  const pair = new RegExp(`<(/?)${escapeRe(tag)}\\b[^>]*>`, 'gi')
  pair.lastIndex = m.index + m[0].length
  let depth = 1
  let t = pair.exec(s)
  while (t) {
    depth += t[1] ? -1 : 1
    if (depth === 0) return { start: m.index, end: t.index + t[0].length, tag }
    t = pair.exec(s)
  }
  return null   // 닫히지 않은 요소 — 손대지 않는다
}

/** 문서가 가진 블록 목록. 모델에게 "고칠 수 있는 자리"를 알려주는 데 쓴다. */
export function listBlocks(html) {
  const s = String(html ?? '')
  const out = []
  for (const m of s.matchAll(/<[a-zA-Z][\w-]*\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/g)) {
    const id = m[1]
    if (out.some((b) => b.id === id)) continue
    const el = findElementById(s, id)
    if (!el) continue
    const inner = s.slice(el.start, el.end)
    const title = inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/)?.[1]
      ?.replace(/<[^>]+>/g, '').trim().slice(0, 40) || null
    out.push({ id, tag: el.tag, title, bytes: Buffer.byteLength(inner, 'utf8') })
  }
  return out
}

const parseAttrs = (raw) => Object.fromEntries([...String(raw).matchAll(ATTR_RE)].map((m) => [m[1], m[2]]))

/**
 * 모델 응답을 편집 목록으로 읽는다.
 *
 * 블록 형식이 하나도 없으면 문서 전체 응답으로 되돌아간다 — 모델이 형식을 지키지 못한
 * 턴에 통째로 실패시키면 사용자는 이유도 모른 채 다시 시켜야 한다.
 *
 * @returns {{summary, mode:'blocks', edits}|{summary, mode:'document', html}|{error}}
 */
export function parseEditResponse(raw) {
  const text = stripFence(raw)
  if (!text) return { error: '모델이 빈 응답을 돌려줬습니다.' }
  const summary = text.match(SUMMARY)?.[1]?.trim() || null

  const full = text.match(DOCUMENT_RE)
  if (full) {
    const doc = extractEdit(full[1])
    return doc.error ? doc : { summary: summary || doc.summary, mode: 'document', html: doc.html }
  }

  const edits = []
  for (const m of text.matchAll(PATCH_RE)) {
    const attrs = parseAttrs(m[1])
    if (attrs.id) edits.push({ id: attrs.id, op: 'patch', find: m[2], to: m[3] })
  }
  for (const m of text.matchAll(BLOCK_RE)) {
    const attrs = parseAttrs(m[1])
    if (!attrs.id) continue
    edits.push({ id: attrs.id, after: attrs.after || null, op: 'replace', html: m[2].trim() })
  }
  for (const m of text.matchAll(REMOVE_RE)) {
    const attrs = parseAttrs(m[1])
    if (attrs.id) edits.push({ id: attrs.id, op: 'remove' })
  }
  if (edits.length) return { summary, mode: 'blocks', edits }

  // 형식은 안 지켰지만 문서 전체를 보낸 경우.
  const doc = extractEdit(text)
  if (!doc.error) return { summary: summary || doc.summary, mode: 'document', html: doc.html }
  return { error: '모델 응답에서 고칠 블록도 문서도 찾지 못했습니다. 지시를 조금 더 구체적으로 적어 주세요.' }
}

/**
 * 편집 목록을 문서에 적용한다.
 *
 * 적용하지 못한 편집은 조용히 버리지 않고 돌려준다 — "고쳤다"는 요약만 보고 미리보기가
 * 그대로면 사용자는 무엇이 안 됐는지 알 길이 없다.
 *
 * @returns {{html: string, applied: string[], failed: {id, reason}[]}}
 */
export function applyBlockEdits(html, edits) {
  let out = String(html ?? '')
  const applied = []
  const failed = []

  for (const edit of edits) {
    const el = findElementById(out, edit.id)

    if (edit.op === 'remove') {
      if (!el) { failed.push({ id: edit.id, reason: '문서에 없는 블록' }); continue }
      out = out.slice(0, el.start) + out.slice(el.end)
      applied.push(edit.id)
      continue
    }

    if (edit.op === 'patch') {
      if (!el) { failed.push({ id: edit.id, reason: '문서에 없는 블록' }); continue }
      const inner = out.slice(el.start, el.end)
      const find = edit.find.trim()
      const hits = find ? inner.split(find).length - 1 : 0
      if (hits !== 1) {
        failed.push({ id: edit.id, reason: hits === 0 ? '찾는 문자열이 블록에 없음' : `찾는 문자열이 ${hits}번 나와 어느 것인지 모름` })
        continue
      }
      out = out.slice(0, el.start) + inner.replace(find, () => edit.to.trim()) + out.slice(el.end)
      applied.push(edit.id)
      continue
    }

    if (el) {
      out = out.slice(0, el.start) + edit.html + out.slice(el.end)
      applied.push(edit.id)
      continue
    }

    // 새 블록 — 어디에 넣을지 지정돼야 한다. 위치를 모르면 문서 끝에 붙이는 것보다
    // 실패로 알리는 편이 낫다(엉뚱한 자리에 조용히 들어가면 되돌리기 전엔 못 찾는다).
    const anchor = edit.after ? findElementById(out, edit.after) : null
    if (!anchor) {
      failed.push({ id: edit.id, reason: edit.after ? `기준 블록 ${edit.after}을(를) 찾지 못함` : '새 블록인데 after가 없음' })
      continue
    }
    out = `${out.slice(0, anchor.end)}\n${edit.html}\n${out.slice(anchor.end)}`
    applied.push(edit.id)
  }

  return { html: out, applied, failed }
}

const FENCE = /^\s*```(?:html)?\s*\r?\n([\s\S]*?)\r?\n?\s*```\s*$/
const SUMMARY = /<!--\s*SUMMARY:\s*([\s\S]*?)-->/i
const DOC_START = /<!doctype html>|<html[\s>]/i
const DOC_END = '</html>'

/** 모델이 습관적으로 두르는 코드펜스를 벗긴다. 프롬프트로 금지해도 가끔 붙는다. */
export function stripFence(text) {
  const raw = String(text ?? '')
  const m = raw.match(FENCE)
  return (m ? m[1] : raw).trim()
}

/**
 * 모델 응답에서 요약 한 줄과 HTML 문서를 뽑는다.
 *
 * 잘린 응답을 그대로 받아들이지 않는다 — </html>이 없는 문서를 미리보기에 넣으면
 * 브라우저가 알아서 닫아버려서 "왜 뒷부분이 없지?"가 될 뿐 원인이 안 보인다.
 *
 * @returns {{summary: string|null, html: string}|{error: string}}
 */
export function extractEdit(raw) {
  const text = stripFence(raw)
  if (!text) return { error: '모델이 빈 응답을 돌려줬습니다.' }

  const summary = text.match(SUMMARY)?.[1]?.trim() || null
  const start = text.search(DOC_START)
  if (start < 0) return { error: '모델이 HTML 문서를 돌려주지 않았습니다. 지시를 조금 더 구체적으로 적어 주세요.' }

  const end = text.toLowerCase().lastIndexOf(DOC_END)
  if (end < start) {
    return { error: '문서가 </html> 없이 끊겼습니다 — 한 번에 바꾸는 범위를 좁혀 다시 요청해 주세요.' }
  }
  return { summary, html: text.slice(start, end + DOC_END.length) }
}

/**
 * 외부로 나가는 참조를 모은다. 하나라도 있으면 "파일 하나로 열린다"는 전제가 깨진다 —
 * 사내망에서 열면 차트가 빈 칸으로 뜨는데, 만든 사람 자리에서는 캐시 때문에 멀쩡히 보인다.
 */
export function findExternalRefs(html) {
  const hits = []
  const ATTR_OR_URL = /(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)"']+)["']?\s*\)|@import\s+["']([^"']+)["']/gi
  for (const m of String(html ?? '').matchAll(ATTR_OR_URL)) {
    const ref = m[1] ?? m[2] ?? m[3]
    if (/^(?:https?:)?\/\//i.test(ref)) hits.push(ref)
  }
  return [...new Set(hits)]
}

/** 문서의 뼈대를 센다. 편집 전후를 비교해 "요청하지 않은 게 사라졌는지"를 본다. */
export function landmarks(html) {
  const s = String(html ?? '')
  const count = (re) => (s.match(re) || []).length
  return {
    bytes: Buffer.byteLength(s, 'utf8'),
    sections: count(/<section\b/gi),
    tables: count(/<table\b/gi),
    charts: count(/<svg\b/gi),
    rows: count(/<tr\b/gi),
    // 라이트 모드에서 aqua·yellow가 표면 대비 3:1 미만이라, 색만으로 계열을 식별하지 않게
    // 하는 완화 규칙으로 직접 라벨과 범례를 함께 단다(htmlReport.js 머리말). 둘 다 세어 둔다.
    labels: count(/class="direct"/g),
    legends: count(/class="legend"/g),
  }
}

const LOSS_LABELS = [
  ['sections', '섹션'], ['tables', '표'], ['charts', '차트'], ['rows', '표 행'],
  ['labels', '계열 직접 라벨'], ['legends', '범례'],
]

// ─── 차트 규약 검사 ────────────────────────────────────────────────
// LLM이 차트를 자유롭게 다시 그리게 두되(그게 이 기능의 목적이다), 눈으로는 못 잡는
// 세 가지는 기계가 본다. 셋 다 **밝은 화면에서는 멀쩡해 보인다** — 그래서 사람이 못 잡는다.

// &#39; 같은 HTML 엔티티를 색으로 오인하지 않게 & 뒤는 뺀다.
const COLOR_LITERAL = /(?<!&)#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g

/** 문서를 <style> 안과 밖으로 가른다. 색이 놓일 수 있는 자리가 둘뿐이라 규칙도 둘이다. */
function splitStyles(html) {
  const s = String(html ?? '')
  const styles = []
  let body = ''
  let last = 0
  for (const m of s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    body += s.slice(last, m.index)
    styles.push(m[1])
    last = m.index + m[0].length
  }
  return { body: body + s.slice(last), styles }
}

/** 테마를 정의하는 자리인가. 여기 있는 색 리터럴은 정상이다 — 토큰 정의 그 자체다. */
// 테마·매체 블록 안의 색 리터럴은 토큰 정의 그 자체라 정상이다.
// @media print도 여기 든다 — 인쇄는 언제나 밝은 바탕이라 토큰을 되돌려야 한다.
const isThemeContext = (prelude) => /:root/.test(prelude)
  || /prefers-color-scheme/.test(prelude)
  || /@media[^{]*\bprint\b/.test(prelude)

/** 테마 블록을 통째로 걷어낸 CSS. 중첩 @media 때문에 정규식이 아니라 중괄호를 센다. */
function stripThemeBlocks(css) {
  let out = ''
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) { out += css.slice(i); break }
    const prelude = css.slice(i, open)
    let depth = 0
    let j = open
    for (; j < css.length; j += 1) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') { depth -= 1; if (depth === 0) break }
    }
    if (!isThemeContext(prelude)) out += `${prelude}{${css.slice(open + 1, j)}}`
    i = j + 1
  }
  return out
}

/**
 * 테마 변수를 거치지 않는 색 리터럴을 찾는다.
 *
 * 원본은 색을 전부 `--s0`~`--s3`·`--surface-*` 토큰으로만 쓴다. 다크모드는 그 토큰 값만
 * 갈아끼워 만들어진다. 그래서 `stroke="#2a78d6"`처럼 직접 박으면 **라이트 모드에서는
 * 똑같이 보이고 다크모드에서만 안 바뀐다** — 만든 사람이 라이트 모드면 끝까지 모른다.
 */
export function findUnthemedColors(html) {
  const { body, styles } = splitStyles(html)
  const hits = [
    ...body.match(COLOR_LITERAL) || [],
    ...styles.flatMap((css) => stripThemeBlocks(css).match(COLOR_LITERAL) || []),
  ]
  return [...new Set(hits)].filter((c) => !isTransparent(c))
}

/**
 * 완전 투명은 테마와 무관하다 — 라이트든 다크든 안 보이는 건 같다.
 * `#0000`(4자리 hex의 알파 0)이 실제로 경고를 띄웠는데, 고칠 수 없는 경고는
 * 그저 진짜 경고를 가릴 뿐이다.
 */
function isTransparent(color) {
  const c = String(color).trim().toLowerCase()
  if (/^#[0-9a-f]{4}$/.test(c)) return c[4] === '0'
  if (/^#[0-9a-f]{8}$/.test(c)) return c.slice(7) === '00'
  const alpha = c.match(/^(?:rgba|hsla)\([^)]*[,/]\s*(0|0?\.0+|0%)\s*\)$/)
  return Boolean(alpha)
}

/** 다크모드 색이 정의되는 세 자리 — 하나라도 빠지면 그 모드에서 색이 안 바뀐다. */
export function findThemeGaps(html) {
  const s = String(html ?? '')
  const gaps = []
  if (!/--s0\s*:/.test(s)) gaps.push('계열 색 토큰(--s0~--s3) 정의')
  if (!/prefers-color-scheme\s*:\s*dark/.test(s)) gaps.push('OS 다크모드 대응(prefers-color-scheme)')
  if (!/\[data-theme\s*=\s*["']dark["']\]/.test(s)) gaps.push('수동 다크모드 대응([data-theme="dark"])')
  return gaps
}

// 범례 항목·막대 행·차트 점처럼 "계열 이름과 그 색이 한 덩어리에 있는" 단위로 자른다.
// 두 채널이 한 덩어리에 걸리면 어느 쪽 색인지 못 정하므로 그 덩어리는 아예 건너뛴다 —
// 억지로 판정해 잘못된 경고를 내는 것보다 조용한 편이 낫다.
const CHUNK_BOUNDARY = /<\/(?:li|div|tr|td|text|figure|g|section|p|circle|title|rect|path)>/i

/**
 * 채널이 원래 자기 색 슬롯을 쓰고 있는지 본다.
 *
 * 색은 행 순번이 아니라 **계열 정체성**으로 정해져 있다(htmlReport.js의 slotOf).
 * 순번으로 바뀌면 브랜드 필터로 채널 하나가 빠졌을 때 남은 채널의 색이 밀리고,
 * "온라인유입은 노랑"으로 읽던 사람이 다음 화면에서 초록을 본다.
 */
export function findRecoloredChannels(html) {
  const found = new Map()
  for (const chunk of String(html ?? '').split(CHUNK_BOUNDARY)) {
    const slots = [...chunk.matchAll(/var\(\s*--s(\d)\s*\)/g)].map((m) => Number(m[1]))
    if (!slots.length) continue
    const names = CHANNEL_ORDER.filter((c) => chunk.includes(c))
    if (names.length !== 1) continue
    for (const slot of slots) {
      if (!found.has(names[0])) found.set(names[0], new Set())
      found.get(names[0]).add(slot)
    }
  }

  const wrong = []
  for (const [name, slots] of found) {
    const expected = CHANNEL_ORDER.indexOf(name)
    const used = [...slots].filter((s) => s !== expected)
    if (used.length) wrong.push({ name, expected, used })
  }
  return wrong
}

/**
 * 편집 결과를 훑어 경고를 만든다. **막지 않고 알린다** — 사용자가 정말 지우라고
 * 한 것일 수도 있어서, 판단은 화면에서 사람이 한다(되돌리기 버튼이 옆에 있다).
 */
export function reviewEdit(before, after) {
  const b = landmarks(before)
  const a = landmarks(after)
  const warnings = []

  const ext = findExternalRefs(after)
  if (ext.length) {
    const shown = ext.slice(0, 3).join(', ')
    warnings.push(
      `외부 주소를 참조합니다 — ${shown}${ext.length > 3 ? ` 외 ${ext.length - 3}건` : ''}. `
      + '사내망·오프라인에서는 이 부분이 비어 보입니다.',
    )
  }

  for (const [key, label] of LOSS_LABELS) {
    const lost = b[key] - a[key]
    if (lost > 0) warnings.push(`${label} ${lost}개가 없어졌습니다 (${b[key]} → ${a[key]}).`)
  }

  if (b.bytes > 0 && a.bytes < b.bytes * 0.6) {
    warnings.push(`문서가 ${Math.round((1 - a.bytes / b.bytes) * 100)}% 줄었습니다 — 의도한 게 아니면 되돌리세요.`)
  }

  // 편집으로 **새로 생긴** 것만 알린다. 원본에 이미 있던 색은 사용자가 방금 만든 문제가
  // 아니라서, 매 턴 같은 경고를 반복하면 진짜 새 경고가 묻힌다.
  const hadColors = new Set(findUnthemedColors(before))
  const newColors = findUnthemedColors(after).filter((c) => !hadColors.has(c))
  if (newColors.length) {
    warnings.push(
      `테마 변수를 안 거친 색 ${newColors.length}개가 생겼습니다 — ${newColors.slice(0, 4).join(', ')}`
      + `${newColors.length > 4 ? ' 외' : ''}. 지금 화면에서는 멀쩡해 보이지만 다크모드에서 안 바뀝니다. `
      + '색은 var(--s0)~var(--s3)처럼 토큰으로 쓰세요.',
    )
  }

  const gaps = findThemeGaps(after).filter((g) => !findThemeGaps(before).includes(g))
  if (gaps.length) warnings.push(`다크모드 정의가 없어졌습니다 — ${gaps.join(' · ')}.`)

  const hadWrong = new Set(findRecoloredChannels(before).map((w) => w.name))
  const recolored = findRecoloredChannels(after).filter((w) => !hadWrong.has(w.name))
  if (recolored.length) {
    warnings.push(
      `채널 색이 원래 자리를 벗어났습니다 — ${recolored.map((w) => `${w.name} 슬롯 ${w.used.join('·')}(원래 ${w.expected})`).join(', ')}. `
      + '같은 채널이 화면마다 다른 색으로 보이게 됩니다.',
    )
  }

  return { before: b, after: a, warnings }
}

/** 지난 턴은 "무엇을 시켰는지"만 넘긴다. HTML 전문을 이력에 쌓으면 문서크기×턴수로 커진다. */
function compactHistory(history) {
  return (Array.isArray(history) ? history : [])
    .slice(-8)
    .filter((t) => t && typeof t.content === 'string' && t.content.trim())
    .map((t) => ({
      role: t.role === 'assistant' ? 'assistant' : 'user',
      content: t.content.trim().slice(0, 400),
    }))
}

/**
 * 편집에 쓸 수 있는 데이터를 프롬프트용 블록으로 만든다.
 *
 * **이게 이 기능의 핵심이다.** 문서에 박힌 숫자만 쓸 수 있으면 "기회도 월별 추이에
 * 넣어줘" 같은 요청에 AI가 할 수 있는 게 없다 — 지어내거나 거절하거나 둘 중 하나다.
 * 지표 레지스트리가 만든 집계를 통째로 같이 넘기면 그냥 골라 쓰면 된다.
 *
 * 툴 콜 루프로 그때그때 조회하지 않는 이유: 왕복이 늘어 느려지고, 모델이 조회할 축을
 * 잘못 고르면 값이 조용히 달라진다. 어차피 문서를 만들 때 이미 다 집계한 것들이다.
 */
export function buildDataBlock(data) {
  if (!data || (!data.metrics?.length && !data.series)) return null
  const catalog = (data.metrics || [])
    .map((m) => `- ${m.id}${m.available ? '' : ' (조회 실패 — 쓰지 마세요)'}: ${m.definition}`
      + `\n    원천 ${m.source} · 기간 기준 ${m.dateBasis} · 채널 귀속 ${m.channelBasis}`)
    .join('\n')

  // 월 키를 축으로 한 번만 적고 값은 배열로 편다. 지표 4 × (채널 4 + 딜러 16) × 8개월이면
  // 월 키가 640번 반복되는데, 그게 이 블록에서 제일 큰 낭비였다.
  const series = data.series ?? {}
  const months = [...new Set(Object.values(series).flatMap((s) => Object.keys(s?.month || {})))].sort()
  const along = (byKey) => Object.fromEntries(
    Object.entries(byKey || {}).map(([k, v]) => [k, months.map((mo) => v?.[mo] ?? 0)]),
  )
  // 이름에 기간을 박는다. 전에는 `채널`이었는데, "8월 요약 써줘"에 그 누계값을 그대로
  // 8월 채널 구성인 양 쓴 모델이 셋 중 둘이었다(2026-08-11 실측). 같은 자리에 있는
  // `채널x월`에서 그 달을 뽑아야 하는데, 이름이 안 알려주니 가까운 걸 집었다.
  const compact = Object.fromEntries(Object.entries(series).map(([id, s]) => [id, {
    기간누계: s?.total ?? null,
    월별: months.map((mo) => s?.month?.[mo] ?? 0),
    채널_기간누계: s?.channel ?? {},
    채널x월: along(s?.month_by_channel),
    딜러x월: along(s?.month_by_dealer),
  }]))

  const period = data.period ? `${data.period.from} ~ ${data.period.to}` : null
  const asOf = data.as_of ? ` · 기준일 ${data.as_of}(데이터가 있는 마지막 날)` : ''

  // 지표 정의만으로는 부족하다. "요약 3줄 써줘"처럼 문구를 새로 쓰는 요청이 오면
  // 부분월을 전월과 그냥 비교하거나(원칙 5), 소표본을 결론 근거로 쓰거나(원칙 6),
  // 채널 비중을 100% 기준으로 말한다(원칙 7-2). 화면의 AI 해석은 그 기준을 지키는데
  // 문서 안 문구만 안 지키면, 같은 데이터를 놓고 두 문장이 다른 말을 한다.
  return `${PRINCIPLES_BLOCK}\n\n${buildVocabularyBlock()}\n\n[쓸 수 있는 데이터]\n${catalog}\n\n`
    + `[집계 결과]${period ? ` 조회 기간 ${period}${asOf}` : ''}\n`
    + `이름에 "기간누계"가 붙은 값은 **조회 기간 전체의 합**입니다. 특정 달을 말할 때는\n`
    + `월별·채널x월·딜러x월에서 그 달을 뽑아 쓰세요 — 누계를 한 달 값인 양 쓰면 안 됩니다.\n`
    + `배열은 모두 이 월 순서입니다: ${months.join(',')}\n`
    + JSON.stringify(compact)
}

/**
 * 지시대로 문서를 다시 쓴다.
 *
 * @param {{html: string, instruction: string, data?: object,
 *          history?: Array<{role: string, content: string}>}} input
 * @returns {Promise<{html, summary, before, after, warnings}|{error: string}>}
 */
export async function editHtmlReport({ html, instruction, data = null, history = [], modelId = null, accessContext = null }) {
  const made = createLlmClient(modelId)
  if (!made) return { error: missingConfigMessage(modelId) }
  const { client, model } = made

  // 문서에 없는 지표·축을 요청받으면 정의서 규칙 + 스키마로 SQL을 만들어 먼저 조회한다.
  // 대부분의 편집 지시(색·레이아웃·문구)에서는 NO_QUERY로 지나간다.
  // 조회가 실패해도 편집은 계속한다 — 데이터를 못 가져왔다고 "글씨 키워줘"까지 막을 이유는 없다.
  const fetched = await runRuleQuery({ instruction, modelId })
  const reportBlock = buildRuleQueryBlock(fetched)

  const dataBlock = buildDataBlock(data)
  const blocks = listBlocks(html)

  // 순서가 곧 캐시 적중률이다. 프롬프트 캐시는 **앞에서부터 똑같은 만큼**만 재사용되므로
  // 턴마다 안 바뀌는 것(시스템 프롬프트·집계 데이터)을 앞에, 바뀌는 것(문서·지시)을 뒤에 둔다.
  // 반대로 놓으면 지시 한 글자만 달라져도 뒤의 문서 전체가 캐시에서 빠진다.
  const messages = [
    { role: 'system', content: EDIT_SYSTEM_PROMPT },
    ...(dataBlock ? [{ role: 'user', content: dataBlock }] : []),
    // 조달 데이터는 캐시 프리픽스 뒤에 둔다 — 턴마다 달라지므로 앞에 두면 그 뒤가 전부 캐시에서 빠진다.
    ...(reportBlock ? [{ role: 'user', content: reportBlock }] : []),
    {
      role: 'user',
      content: `[문서의 블록 목록] — 이 id로 지목합니다\n`
        + blocks.map((b) => `- ${b.id}${b.title ? ` (${b.title})` : ''} · ${b.bytes}B`).join('\n')
        + `\n\n[지금 문서 전체]\n${html}`,
    },
    ...compactHistory(history),
    { role: 'user', content: `[이번 지시]\n${instruction}` },
  ]

  let res
  try {
    res = await client.chat.completions.create({
      model,
      messages,
      // 낮게 잡되 0은 아니다. 0으로 두면 "좀 더 보기 좋게"처럼 여지가 있는 지시에
      // 매번 같은 무난한 답만 나와서 다시 시켜도 화면이 그대로다.
      temperature: 0.3,
    })
  } catch (error) {
    return { error: error.message || 'HTML 편집 호출에 실패했습니다.' }
  }

  const choice = res.choices?.[0]
  if (choice?.finish_reason === 'length') {
    return { error: '출력이 중간에 끊겼습니다. 한 번에 바꾸는 범위를 좁혀 주세요.' }
  }

  const parsed = parseEditResponse(choice?.message?.content)
  if (parsed.error) return parsed

  let next = parsed.html
  let applied = null
  let failed = []
  if (parsed.mode === 'blocks') {
    const spliced = applyBlockEdits(html, parsed.edits)
    next = spliced.html
    applied = spliced.applied
    failed = spliced.failed
    if (!applied.length) {
      return { error: `고칠 블록을 찾지 못했습니다 — ${failed.map((f) => `${f.id}(${f.reason})`).join(', ')}` }
    }
  }

  const review = reviewEdit(html, next)
  // 적용 못 한 편집은 경고로 올린다. 요약만 보고 미리보기가 그대로면 뭐가 안 됐는지 모른다.
  if (failed.length) {
    review.warnings.push(`적용하지 못한 편집 ${failed.length}건 — ${failed.map((f) => `${f.id}(${f.reason})`).join(', ')}`)
  }

  const usage = res.usage || {}
  return {
    html: next,
    summary: parsed.summary || '문서를 수정했습니다.',
    mode: parsed.mode,
    applied,
    // 실행한 SQL을 화면까지 올린다 — 대조할 정답이 없는 경로라, 숫자가 의심스러우면
    // 사람이 볼 수 있는 근거는 SQL뿐이다.
    fetched: fetched && {
      sql: fetched.sql, rows: fetched.rows.length,
      truncated: fetched.truncated, elapsedMs: fetched.elapsedMs, error: fetched.error ?? null,
    },
    ...review,
    // 화면이 "블록 2개만 고쳤는데 왜 오래 걸리지"를 스스로 답할 수 있게 사용량을 돌려준다.
    usage: {
      prompt: usage.prompt_tokens ?? null,
      completion: usage.completion_tokens ?? null,
      cached: usage.prompt_tokens_details?.cached_tokens ?? null,
    },
  }
}
