// 딜러 계약퍼널 — 단일 HTML 대시보드 생성 (요구사항정의서 2-2 (a)).
//
// 지금까지의 수동 산출물이 "데이터·차트·표를 한 파일에 담은 단일 HTML"이었다.
// 그 형태를 자동 생성한다 — 파일 하나로 열리고 공유되며 외부 요청이 없다.
//
// 차트는 인라인 SVG로 직접 그린다. 라이브러리를 CDN으로 불러오면 파일 하나로
// 열리지 않고(오프라인·사내망에서 깨진다) "단일 HTML"이라는 전제가 무너진다.
//
// ── 색 (dataviz 검증기 통과본) ──────────────────────────────────
// 카테고리 4슬롯: blue/orange/aqua/yellow. 라이트·다크 두 모드 모두
// 명도대·채도·CVD 분리·정상시력 분리를 통과했다(2026-08-10 실행).
//   light: worst adjacent CVD ΔE 9.1 · normal 22.9
//   dark : worst adjacent CVD ΔE 8.4 · normal 19.8
// 라이트 모드에서 aqua·yellow가 표면 대비 3:1 미만이라 **완화 규칙**을 적용한다 —
// 모든 계열에 직접 라벨을 달고 같은 화면에 표를 함께 싣는다(색만으로 식별하지 않는다).
// 색 순서는 고정이다. 필터로 계열이 줄어도 남은 계열의 색이 바뀌지 않는다.
// ──────────────────────────────────────────────────────────
import { CHANNEL_ORDER } from './channelMap.js'

const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100']
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500']

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const nf = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('ko-KR'))

/**
 * 채널 → 색 슬롯. **행 순번이 아니라 계열 정체성으로 색을 정한다.**
 *
 * 순번으로 주면 브랜드 필터로 채널 하나가 비었을 때 남은 채널의 색이 밀린다 —
 * "온라인유입은 노랑"으로 읽던 사람이 다음 화면에서 초록을 본다(recolor-on-filter).
 */
const slotOf = (name) => {
  const i = CHANNEL_ORDER.indexOf(name)
  return i >= 0 ? i : CHANNEL_ORDER.length % 4
}

/**
 * 월별 선형 차트. 값 축은 하나뿐이다 — 단위가 다른 지표를 한 그림에 겹치지 않는다.
 * 활동(만 단위)과 시승(천 단위)은 따로 그린다.
 */
function lineChart({ title, months, series, id }) {
  const W = 720
  const H = 240
  // 오른쪽 여백은 계열 이름이 들어갈 자리다. 좁게 잡으면 직접 라벨이 뷰박스를 넘어
  // 잘린다 — "관계형성활동"이 11px에서 약 70px을 쓴다.
  const PAD = { top: 16, right: 96, bottom: 34, left: 56 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const all = series.flatMap((s) => months.map((m) => Number(s.values[m] ?? 0)))
  const max = Math.max(1, ...all)
  const x = (i) => PAD.left + (months.length === 1 ? plotW / 2 : (i * plotW) / (months.length - 1))
  const y = (v) => PAD.top + plotH - (v / max) * plotH

  // 눈금은 4개면 충분하다. 격자는 뒤로 물린다.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const grid = ticks.map((t) => `
    <line x1="${PAD.left}" y1="${y(t)}" x2="${W - PAD.right}" y2="${y(t)}" class="grid"/>
    <text x="${PAD.left - 8}" y="${y(t) + 4}" class="tick" text-anchor="end">${nf(t)}</text>`).join('')

  const lastIdx = months.length - 1
  const paths = series.map((s) => {
    const slot = slotOf(s.name)
    const d = months.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(s.values[m] ?? 0)).toFixed(1)}`).join(' ')
    // 점 위에 표면색 링을 둘러 겹치는 계열이 서로 파묻히지 않게 한다.
    const dots = months.map((m, i) => {
      const v = Number(s.values[m] ?? 0)
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="var(--s${slot})" stroke="var(--surface-1)" stroke-width="2"><title>${esc(s.name)} · ${esc(m)}: ${nf(v)}</title></circle>`
    }).join('')
    return `<path d="${d}" fill="none" stroke="var(--s${slot})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}`
  }).join('')

  // 마지막 점에 계열 이름을 직접 단다 — 색만으로 식별하지 않게 하는 완화 규칙.
  // 값이 가까운 계열은 라벨이 포개지므로 위에서부터 최소 간격을 벌린다.
  const LABEL_GAP = 13
  const labels = series
    .map((s) => ({ name: s.name, y: y(Number(s.values[months[lastIdx]] ?? 0)) }))
    .sort((a, b) => a.y - b.y)
    .map((item, i, arr) => {
      if (i > 0) item.y = Math.max(item.y, arr[i - 1].y + LABEL_GAP)
      return item
    })
    .map((item) => `<text x="${(x(lastIdx) + 10).toFixed(1)}" y="${(item.y + 4).toFixed(1)}" class="direct">${esc(item.name)}</text>`)
    .join('')

  const xLabels = months.map((m, i) =>
    `<text x="${x(i).toFixed(1)}" y="${H - 10}" class="tick" text-anchor="middle">${esc(m.slice(5))}</text>`).join('')

  return `
  <figure class="chart"${id ? ` id="${id}"` : ''}>
    <figcaption>${esc(title)}</figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">
      ${grid}${xLabels}${paths}${labels}
    </svg>
    <ul class="legend">
      ${series.map((s) => `<li><span class="swatch" style="background:var(--s${slotOf(s.name)})"></span>${esc(s.name)}</li>`).join('')}
    </ul>
  </figure>`
}

/** 가로 막대. 크기 비교가 일이라 길이로 인코딩하고, 값은 막대 끝에 직접 적는다. */
function barChart({ title, rows, id }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0))
  return `
  <figure class="chart"${id ? ` id="${id}"` : ''}>
    <figcaption>${esc(title)}</figcaption>
    <div class="bars">
      ${rows.map((r) => {
    const v = Number(r.value) || 0
    const pct = (v / max) * 100
    return `<div class="bar-row">
          <span class="bar-label">${esc(r.name)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct.toFixed(1)}%;background:var(--s${slotOf(r.name)})"></span></span>
          <span class="bar-value">${nf(v)}${r.suffix ? esc(r.suffix) : ''}</span>
        </div>`
  }).join('')}
    </div>
  </figure>`
}

function table({ title, head, rows, note = null, id }) {
  return `
  <section class="block"${id ? ` id="${id}"` : ''}>
    <h3>${esc(title)}</h3>
    <div class="scroll">
      <table>
        <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${typeof c === 'number' ? nf(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
  </section>`
}

/**
 * 단일 HTML 대시보드를 만든다.
 *
 * @param {object} insight getFunnelInsight()의 결과
 * @returns {string} 완결된 HTML 문서
 */
export function buildHtmlReport(insight) {
  const {
    period, as_of: asOf, monthly = {}, month_by_channel: byChannel = {},
    forecast = {}, detection = {}, funnel_totals: totals = {}, narration = null,
    metrics = [], metric_issues: metricIssues = [],
  } = insight

  const months = [...new Set(Object.values(monthly).flatMap((s) => Object.keys(s)))].sort()
  const brandLabel = period?.brand || '렉서스 · 토요타 전체'
  const generated = new Date().toLocaleString('ko-KR', { hour12: false })

  // 지표 목록은 레지스트리가 준 순서(퍼널 순서)를 따른다. 여기서 다시 나열하지 않는다 —
  // 지표를 늘렸는데 차트만 옛 두 개로 남는 일이 그래서 생겼다.
  const drawn = metrics.length ? metrics.filter((m) => m.available) : Object.keys(monthly).map((id) => ({ id, label: id }))

  // 단위가 다른 지표를 한 축에 겹치지 않는다 — 지표마다 따로 그린다.
  // 활동은 만 단위, 계약은 백 단위라 한 그림에 넣으면 계약이 바닥에 눌린다.
  const channelSeriesOf = (id) => CHANNEL_ORDER
    .filter((c) => byChannel[id]?.[c])
    .map((c) => ({ name: c, values: byChannel[id][c] }))

  const anomalyRows = (detection.anomalies || []).map((a) => [
    a.kind === 'data_loss' ? '데이터 손실' : a.dimension === 'channel' ? '채널' : a.dimension === 'dealer' ? '딜러' : a.kind === 'rate_change' ? '전환율' : '전체',
    `${a.metric}${a.member ? ` · ${a.member}` : ''}`,
    a.kind === 'data_loss' ? '—' : `${a.from_month} → ${a.to_month}`,
    a.kind === 'rate_change' ? `${a.from_rate_pct}% → ${a.to_rate_pct}% (${a.change_pp > 0 ? '+' : ''}${a.change_pp}%p)`
      : a.kind === 'data_loss' ? `${nf(a.lost_count)} / ${nf(a.base_count)} (${a.loss_pct}%)`
        : `${nf(a.from_value)} → ${nf(a.to_value)} (${a.change_pct > 0 ? '+' : ''}${a.change_pct}%)`,
    [
      a.forecast_used ? '예상치 환산' : '',
      a.small_sample ? '소표본·참고용' : '',
      a.over_100 ? '100% 초과 — 코호트 불일치' : '',
    ].filter(Boolean).join(' / ') || '—',
  ])

  // 전환율 100% 초과가 하나라도 있으면 왜 그런지 문서 안에서 답한다. 이 설명이 없으면
  // "147%"를 본 사람이 지표를 못 믿거나, 반대로 성과가 좋다고 잘못 읽는다.
  const hasOver100 = (detection.anomalies || []).some((a) => a.over_100)

  const forecastRows = Object.entries(forecast).filter(([, f]) => f).map(([name, f]) => [
    `${name} (${f.yearMonth} · ${f.days_elapsed}/${f.days_in_month}일)`,
    f.actual_so_far,
    f.method1_forecast,
    f.method2_forecast === null ? '—' : nf(f.method2_forecast),
    f.method3_forecast,
  ])

  const spreadRows = (detection.dealer_spread || []).slice(0, 10).map((d) => [
    d.metric, `${d.from_month} → ${d.to_month}`,
    `${d.same_direction_count}/${d.total_dealers ?? '—'}개 ${d.dominant_direction}`,
    d.pattern,
  ])

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>딜러 계약퍼널 대시보드 — ${esc(brandLabel)}</title>
<style id="doc-style">
  :root {
    color-scheme: light;
    --surface-0: #f4f4f2; --surface-1: #fcfcfb; --border: #e3e2df;
    --text-primary: #0b0b0b; --text-secondary: #52514e; --text-muted: #7a7975;
    --s0: ${SERIES_LIGHT[0]}; --s1: ${SERIES_LIGHT[1]}; --s2: ${SERIES_LIGHT[2]}; --s3: ${SERIES_LIGHT[3]};
    --warn-bg: #fdf6e3; --warn-border: #e5c76b; --warn-text: #6b4e00;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --surface-0: #111110; --surface-1: #1a1a19; --border: #3a3a37;
      --text-primary: #ffffff; --text-secondary: #c3c2b7; --text-muted: #96958c;
      --s0: ${SERIES_DARK[0]}; --s1: ${SERIES_DARK[1]}; --s2: ${SERIES_DARK[2]}; --s3: ${SERIES_DARK[3]};
      --warn-bg: #2a2410; --warn-border: #6b5a1e; --warn-text: #e8d9a0;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --surface-0: #111110; --surface-1: #1a1a19; --border: #3a3a37;
    --text-primary: #ffffff; --text-secondary: #c3c2b7; --text-muted: #96958c;
    --s0: ${SERIES_DARK[0]}; --s1: ${SERIES_DARK[1]}; --s2: ${SERIES_DARK[2]}; --s3: ${SERIES_DARK[3]};
    --warn-bg: #2a2410; --warn-border: #6b5a1e; --warn-text: #e8d9a0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px; background: var(--surface-0); color: var(--text-primary);
    font: 14px/1.6 -apple-system, "Segoe UI", "Malgun Gothic", sans-serif;
  }
  .wrap { max-width: 1040px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 0 0 12px; }
  h3 { font-size: 14px; margin: 0 0 10px; }
  .sub { color: var(--text-secondary); margin: 0 0 20px; font-size: 13px; }
  .block { background: var(--surface-1); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .tile { background: var(--surface-0); border: 1px solid var(--border); border-radius: 6px; padding: 12px; }
  .tile .k { font-size: 12px; color: var(--text-secondary); }
  .tile .v { font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 2px; }
  figure.chart { margin: 0 0 8px; }
  figcaption { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
  svg { width: 100%; height: auto; display: block; }
  .grid { stroke: var(--border); stroke-width: 1; }
  .tick { fill: var(--text-muted); font-size: 11px; }
  .direct { fill: var(--text-secondary); font-size: 11px; }
  .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 14px; padding: 0; margin: 8px 0 0; font-size: 12px; color: var(--text-secondary); }
  .legend li { display: flex; align-items: center; gap: 6px; }
  .swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .bars { display: grid; gap: 8px; }
  .bar-row { display: grid; grid-template-columns: 120px 1fr 92px; align-items: center; gap: 10px; }
  .bar-label { color: var(--text-secondary); font-size: 13px; }
  .bar-track { background: var(--surface-0); border-radius: 4px; height: 14px; }
  .bar-fill { display: block; height: 14px; border-radius: 4px; }
  .bar-value { text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
  th { color: var(--text-secondary); font-weight: 500; font-size: 12px; }
  td:nth-child(n+2) { font-variant-numeric: tabular-nums; }
  .note { color: var(--text-muted); font-size: 12px; margin: 10px 0 0; }
  .warn { background: var(--warn-bg); border: 1px solid var(--warn-border); color: var(--warn-text); border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 13px; }
  .warn-inline { background: var(--warn-bg); border: 1px solid var(--warn-border); color: var(--warn-text); border-radius: 6px; padding: 8px 10px; margin: 10px 0 0; font-size: 12px; }
  .narr { white-space: pre-line; }
  footer { color: var(--text-muted); font-size: 12px; margin-top: 24px; }

  /* 인쇄·PDF. 화면과 종이는 다른 매체다 — 여기서 손보지 않으면 표가 페이지 사이에서
     잘리고, 다크모드로 보던 사람은 검은 배경을 그대로 인쇄한다. */
  @media print {
    @page { size: A4; margin: 12mm; }
    /* 인쇄는 언제나 밝은 바탕이다. 토큰만 되돌리면 나머지 규칙은 그대로 따라온다. */
    :root {
      color-scheme: light;
      --surface-0: #ffffff; --surface-1: #ffffff; --border: #c9c8c4;
      --text-primary: #000000; --text-secondary: #3a3a37; --text-muted: #5f5e5a;
      --warn-bg: #fdf6e3; --warn-border: #b9a35a; --warn-text: #5a4200;
    }
    body { padding: 0; }
    .wrap { max-width: none; }
    /* 블록·차트·표는 페이지 사이에서 쪼개지 않는다. 반쪽 난 표는 읽을 수 없다. */
    .block, figure.chart, .bar-row { break-inside: avoid; page-break-inside: avoid; }
    tr, .tile { break-inside: avoid; page-break-inside: avoid; }
    h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
    /* 화면에서 가로 스크롤로 처리하던 넓은 표는 종이에서 스크롤할 수 없다 — 다 펼친다. */
    .scroll { overflow: visible; }
    table { min-width: 0; width: 100%; }
    details { display: block; }
    details > summary { display: none; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header id="b-header">
  <h1>딜러 계약퍼널 대시보드</h1>
  <p class="sub">
    ${esc(brandLabel)} · ${esc(period?.from ?? '')} ~ ${esc(period?.to ?? '')} ·
    기준일 ${esc(asOf ?? '—')} · 생성 ${esc(generated)}
  </p>
  </header>

  <div class="warn" id="b-notice">
    <strong>계약은 Gross 기준입니다</strong> — 취소·반려된 건도 포함합니다. 고객 수요 추이를 보기 위한
    정의이며(요구사항정의서 3-2), 확정 실적을 세는 다른 화면과 숫자가 다릅니다.
    진행 중인 달은 아래 <strong>예상 최종치</strong>로 환산한 뒤에만 전월과 비교하세요(3-6).
  </div>

  <section class="block" id="b-totals">
    <h2>퍼널 총계</h2>
    <div class="tiles">
      ${drawn.map((m) => `<div class="tile"><div class="k">${esc(m.id)}</div><div class="v">${nf(totals[m.id])}</div></div>`).join('')}
    </div>
    <p class="note">
      시승은 원본 ${nf(totals.시승_파이프라인?.raw)}건에서 취소 ${nf(totals.시승_파이프라인?.cancelled)}건을 빼고
      기회번호 중복 ${nf(totals.시승_파이프라인?.deduped)}건을 제거한 값입니다(정의서 3-4).
      집계 제외 ${nf(totals.집계_제외?.total)}건은 활동유형·조직 차원에 없는 키를 가진 건입니다.
    </p>
    ${metricIssues.length ? `<p class="warn-inline">조회하지 못한 지표: ${metricIssues.map((i) => `${esc(i.metric)}(${esc(i.message)})`).join(' · ')} — 값이 0이어서가 아니라 가져오지 못한 것입니다.</p>` : ''}
  </section>

  <section class="block" id="b-trend">
    <h2>월별 추이</h2>
    ${drawn.map((m) => {
    const s = channelSeriesOf(m.id)
    return s.length ? lineChart({ id: `b-trend-${m.id}`, title: `${m.id} — 채널별`, months, series: s }) : ''
  }).join('')}
    <p class="note">
      값 축은 차트마다 하나입니다. 지표마다 자릿수가 달라(활동은 만 단위, 계약은 백 단위)
      같은 그림에 겹치지 않고 따로 그립니다. 선 끝에 계열 이름을 직접 표시해 색만으로
      구분하지 않도록 했습니다.
    </p>
  </section>

  <section class="block" id="b-channel">
    <h2>채널별 구성</h2>
    ${drawn.map((m) => {
    const rows = CHANNEL_ORDER.filter((c) => totals[`${m.id}_채널별`]?.[c])
      .map((c) => ({ name: c, value: totals[`${m.id}_채널별`][c] }))
    return rows.length ? barChart({ id: `b-channel-${m.id}`, title: m.id, rows }) : ''
  }).join('')}
    <p class="note">
      기회·계약의 채널은 기회 행의 기회생성 활동유형(ca_act_tp)으로 정합니다. 시승은 거기에
      2차 보완(같은 기회의 활동으로 채우기)이 더 붙습니다(정의서 3-4 ④) — 채널 분해의
      근거가 지표마다 완전히 같지는 않습니다.
    </p>
  </section>

  ${table({
    id: 'b-forecast',
    title: '부분월 예상 최종치 (정의서 3-6)',
    head: ['지표', '기준일까지', '① 평일·주말 페이스', '② 과거 진척률', '③ 단순 페이스'],
    rows: forecastRows,
    note: '①이 대표값입니다. 평일과 주말의 수준이 다르면 ③은 남은 날의 요일 구성을 반영하지 못합니다.',
  })}

  ${table({
    id: 'b-anomaly',
    title: `이상현상 (임계치 전월 대비 ±${detection.thresholds?.change_pct}% · 전환율 ±${detection.thresholds?.rate_change_pp}%p)`,
    head: ['축', '지표', '구간', '변화', '비고'],
    rows: anomalyRows,
    note: [
      detection.axis_partial_month_skipped?.length
        ? `채널·딜러 축에서는 ${detection.axis_partial_month_skipped.join(', ')}을(를) 비교하지 않았습니다 — 축 단위 예상 최종치를 만들 수 없어(표본이 작아) 부분월을 비교하면 전 축이 급감으로 잡힙니다.`
        : '',
      hasOver100
        ? '전환율이 100%를 넘는 구간이 있습니다. 같은 건이 두 단계를 순서대로 지난 비율이 아니라, '
          + '각 단계를 자기 기준일(활동일자·기회생성일자·계약일자)로 따로 센 값의 비이기 때문입니다 — '
          + '시승 없이 바로 계약된 건과, 시승은 지난달이고 계약은 이번 달인 건이 섞입니다. '
          + '"전환율 급등"으로 읽지 말고 그 달에 무엇이 늘었는지를 절대치로 보세요.'
        : '',
    ].filter(Boolean).join(' ') || null,
  })}

  ${spreadRows.length ? table({
    id: 'b-spread',
    title: '딜러 확산 — 특정 딜러인가 전사 패턴인가 (정의서 4장 원칙 3)',
    head: ['지표', '구간', '같은 방향 딜러', '판단'],
    rows: spreadRows,
  }) : ''}

  ${narration?.text ? `
  <section class="block" id="b-narration">
    <h2>AI 원인 해석</h2>
    <p class="narr">${esc(narration.text)}</p>
    <p class="note">
      AI는 위 탐지 결과와 집계 요약만 받아 해석합니다(정의서 4-8). 숫자를 다시 계산하지 않으며,
      데이터로 검증되지 않은 원인은 &ldquo;가능성&rdquo;으로만 씁니다(4장 원칙 4).
    </p>
  </section>` : ''}

  ${metrics.length ? table({
    id: 'b-metrics',
    title: '지표 정의 (정의서 3-2 · 6장)',
    head: ['지표', '정의', '원천', '기간 기준', '채널 귀속 근거'],
    rows: metrics.map((m) => [
      m.available ? m.id : `${m.id} (조회 실패)`,
      m.definition, m.source, m.dateBasis, m.channelBasis,
    ]),
    note: '이 문서의 숫자가 다른 화면과 다르다면 대개 이 표에서 갈립니다 — 같은 테이블을 읽어도 '
      + '기간 기준과 채널 귀속 근거가 다르면 값이 달라집니다.',
  }) : ''}

  <footer id="b-footer">
    요구사항정의서 &ldquo;딜러 계약퍼널 분석 자동화&rdquo; 3~4장 규칙으로 생성했습니다.
    집계·예측·탐지는 코드가, 원인 해석은 AI가 맡습니다(2-1).
  </footer>
</div>
</body>
</html>`
}
