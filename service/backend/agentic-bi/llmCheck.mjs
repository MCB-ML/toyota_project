#!/usr/bin/env node
// LLM 처리 검증 하네스 — 라이브 실행이라 `node --test`에 넣지 않는다.
//
//   node server/agentic-bi/llmCheck.mjs               # 인-프로세스, 각 2회
//   node server/agentic-bi/llmCheck.mjs --http        # 실행 중인 dev 서버(5173)로
//   node server/agentic-bi/llmCheck.mjs --repeat 3    # 반복 횟수
//   node server/agentic-bi/llmCheck.mjs --set hard    # basic | hard | all
//
// 왜 반복하나: LLM이 끼어 있어 한 번 통과는 근거가 약하다. 실행마다 경로가 갈리면
// 사용자는 같은 질문에 다른 형태의 답을 받는다 — 그것 자체가 결함이라 함께 본다.
//
// 왜 --http 가 있나: vite 미들웨어가 import한 서버 모듈은 프로세스가 사는 동안
// 캐시된다. 그래서 "테스트는 통과하는데 브라우저는 옛 코드"인 상태가 실제로 있었다.
// --http 는 사용자가 쓰는 그 엔드포인트를 그대로 친다.
import 'dotenv/config'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const USE_HTTP = args.includes('--http')
const REPEAT = Number(flag('repeat', 2))
const SET = flag('set', 'all')
const ENDPOINT = flag('endpoint', 'http://localhost:5173/api/agentic-bi-ask')

// path      : 허용 경로. 'GOLD 파생' | '리포트 파생' | '기존' | '(리포트)'
// report    : 인증 리포트로 갈 때 기대하는 report_id
// value     : 응답 텍스트에 있어야 할 문자열(라이브 값이라 자주 바뀌는 건 넣지 않는다)
// grain     : 시간축 단위 'month' | 'day' — GROUP BY 로 판정
// reask     : true 면 되묻는 것이 정답인 질문(대상이 빠진 '목표/실적' 등)
const BASIC = [
  { tag: '계약목표', q: '2026년 4월 계약 목표 알려줘', path: ['리포트 파생'], value: '3,165' },
  { tag: '출고목표', q: '2026년 4월 출고 목표 알려줘', path: ['리포트 파생'], value: '2,143' },
  { tag: '연누적계약', q: '2026년 4월까지 연누적 계약 목표 알려줘', path: ['리포트 파생'], value: '12,338' },
  { tag: '활동실적', q: '2026년 4월 활동실적 알려줘', path: ['GOLD 파생'] },
  { tag: '기회실적', q: '2026년 4월 기회 실적 알려줘', path: ['GOLD 파생'] },
  { tag: '계약실적', q: '2026년 4월 계약 건수 알려줘', path: ['GOLD 파생'] },
  { tag: '월별추이', q: '2026년 월별 활동실적 추이를 선 그래프로 보여줘', grain: 'month' },
  { tag: '일별추이', q: '2026년 4월 일별 활동실적 추이 보여줘', grain: 'day' },
  { tag: '딜러별', q: '2026년 4월 계약 실적을 딜러별로 보여줘', path: ['GOLD 파생'] },
  { tag: '퍼널표', q: '2026년 4월 퍼널 전체 지표를 딜러별로 묶어서 보여줘', report: 'funnel_full_structure' },
  { tag: '명세목록', q: '2026년 4월에 등록된 영업기회 명세 목록을 뽑아줘', report: 'lead_list' },
  { tag: '퍼널차트', q: '2026년 4월 퍼널 구조 차트로 보여줘', report: 'funnel_full_structure' },
]

// 툴 설명과 문구가 가까운 질문은 대부분 통과한다. 실제 결함은 애매한 구어체에서 나왔다.
const HARD = [
  { tag: '구어체-계약', q: '4월에 계약 얼마나 했어?', path: ['GOLD 파생'] },
  { tag: '구어체-시승', q: '4월 시승 얼마나 나왔어', path: ['GOLD 파생', '기존'] },
  // 무엇의 실적인지 빠졌다 — 되묻는 것이 정답이다.
  { tag: '애매-실적현황', q: '2026년 4월 실적 현황 보여줘', reask: true },
  // 계약/출고/활동 중 무엇인지 질문만으로 정할 수 없다 — 임의로 고르지 않고 되묻는다.
  { tag: '애매-목표', q: '2026년 4월 목표 알려줘', reask: true },
  // 되묻기 선택지를 그대로 다시 물으면 통과해야 한다(무한 되묻기 방지).
  { tag: '되묻기-응답', q: '2026년 4월 계약 목표 알려줘', path: ['리포트 파생'], value: '3,165' },
  { tag: '딜러필터', q: '렉서스 강남 2026년 4월 계약 실적 알려줘', path: ['GOLD 파생'] },
  { tag: '브랜드필터', q: '토요타만 2026년 4월 계약 실적 알려줘', path: ['GOLD 파생'] },
  { tag: '다중지표', q: '2026년 4월 활동 목표랑 실적 같이 보여줘', path: ['GOLD 파생', '기존', '(리포트)'] },
  { tag: '상대기간', q: '지난달 활동실적 알려줘', path: ['GOLD 파생', '기존'] },
  { tag: '전환율', q: '2026년 4월 기회에서 계약 전환율 알려줘', path: ['(리포트)', '기존', 'GOLD 파생'] },
  // "변화"가 아니라 "변했는지" — 명사형만 보면 시간축이 안 붙어 누적값 하나만 답했다.
  { tag: '변했는지', q: '올해 활동실적 어떻게 변했는지 보여줘', grain: 'month' },
  { tag: '흐름', q: '올해 활동실적 흐름 보여줘', grain: 'month' },
]

const CASES = SET === 'basic' ? BASIC : SET === 'hard' ? HARD : [...BASIC, ...HARD]

function summarize(events) {
  const compiled = events.filter((e) => e.type === 'debug' && (e.label || '').includes('Compiled SQL'))
  const labels = compiled.map((e) => e.label)
  const selected = events.find((e) => e.type === 'debug' && e.label === '인증 리포트 선택')

  // 다중 지표는 Compiled SQL 이벤트가 여러 개다 — 첫 이벤트만 보면 오판한다.
  const path = labels.some((l) => l.includes('인증 리포트 파생')) ? '리포트 파생'
    : labels.some((l) => l.includes('GOLD 파생')) ? 'GOLD 파생'
      : labels.length ? '기존' : selected ? '(리포트)' : '?'

  const groupBy = (compiled[0]?.detail?.match(/GROUP BY[^\n]*/) || [''])[0]
  const day = /char\(10\)|,\s*23\)/.test(groupBy)
  const month = /char\(7\)|,\s*126\)/.test(groupBy)

  return {
    path,
    report: selected ? (selected.detail.match(/report_id=(\S+)/) || [])[1] : null,
    grain: day && !month ? 'day' : month && !day ? 'month' : day && month ? 'month+day' : null,
    text: events.filter((e) => e.type === 'text').map((e) => e.text).join(' ').replace(/\n/g, ' '),
    rejected: events.find((e) => e.type === 'rejected')?.reason || null,
    answered: events.some((e) => ['text', 'patch_ready', 'reask'].includes(e.type)),
    reask: events.find((e) => e.type === 'reask')?.text || null,
  }
}

async function askHttp(message) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, dashboardState: { version: 1, widgets: [] }, history: [] }),
  })
  const events = (await res.text()).split('\n\n')
    .map((b) => b.replace(/^data: /, '').trim()).filter(Boolean)
    .map((s) => { try { return JSON.parse(s) } catch { return null } }).filter(Boolean)
  return summarize(events)
}

async function askInProcess(message) {
  const { runAgenticBiQuery } = await import('../agenticBiPipeline.js')
  const events = []
  await runAgenticBiQuery(
    { message, dashboardState: { version: 1, widgets: [] }, history: [] },
    { sendEvent: (e) => events.push(e) },
  )
  return summarize(events)
}

const ask = USE_HTTP ? askHttp : askInProcess

function passes(spec, r) {
  if (r.rejected || !r.answered) return false
  if (spec.reask) return !!r.reask
  if (r.reask && !spec.reask && !spec.path?.includes('(리포트)')) return false
  if (spec.path && !spec.path.includes(r.path)) return false
  if (spec.report && r.report !== spec.report) return false
  if (spec.grain && r.grain !== spec.grain) return false
  if (spec.value && !r.text.includes(spec.value)) return false
  return true
}

console.log(`${USE_HTTP ? `HTTP ${ENDPOINT}` : '인-프로세스'} / ${SET} ${CASES.length}건 / 각 ${REPEAT}회\n`)

let good = 0
const failures = []
for (const spec of CASES) {
  const runs = []
  for (let i = 0; i < REPEAT; i += 1) {
    try { runs.push(await ask(spec.q)) } catch (err) {
      runs.push({ rejected: `요청 실패: ${err.message}`, answered: false, text: '', path: '?' })
    }
  }
  const passed = runs.filter((r) => passes(spec, r)).length
  const stable = new Set(runs.map((r) => r.path)).size === 1
  // 질문이 원래 모호한 경우(unstableOk)는 경로가 갈려도 각 답이 타당하면 통과다.
  const ok = passed === REPEAT && (stable || spec.unstableOk === true)
  if (ok) good += 1
  else failures.push({ spec, runs })

  const seen = [...new Set(runs.map((r) => r.report || r.path))].join(' / ')
  const note = runs[0].rejected ? `거절: ${runs[0].rejected}` : runs[0].text.slice(0, 44)
  console.log(
    `${ok ? 'OK  ' : 'MISS'} ${passed}/${REPEAT} ${stable ? '일관' : spec.unstableOk ? '갈림(허용)' : '갈림'}  ${spec.tag.padEnd(12)}`
    + `[${seen.padEnd(24)}]${spec.grain ? ` grain=${[...new Set(runs.map((r) => r.grain))].join('/')}` : ''} ${note}`,
  )
}

if (failures.length) {
  console.log('\n실패 상세')
  for (const { spec, runs } of failures) {
    console.log(`\n  ${spec.tag}: ${spec.q}`)
    console.log(`    기대 path=${spec.path || '-'} report=${spec.report || '-'} grain=${spec.grain || '-'} value=${spec.value || '-'}`)
    runs.forEach((r, i) => console.log(
      `    #${i + 1} path=${r.path} report=${r.report || '-'} grain=${r.grain || '-'} `
      + `${r.rejected ? `거절: ${r.rejected.slice(0, 60)}` : r.text.slice(0, 60)}`,
    ))
  }
}

console.log(`\n${good}/${CASES.length} 통과(${REPEAT}회 모두 + 경로 일관)`)
process.exit(good === CASES.length ? 0 : 1)
