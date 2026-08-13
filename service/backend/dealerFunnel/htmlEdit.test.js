// 챗봇 HTML 편집 — 응답 해석과 편집 검토:
//   node --test backend/dealerFunnel/htmlEdit.test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  applyBlockEdits, buildDataBlock, extractEdit, findElementById, findExternalRefs,
  findRecoloredChannels, findThemeGaps, findUnthemedColors, landmarks, listBlocks,
  parseEditResponse, reviewEdit, stripFence,
} from './htmlEdit.js'
import { buildHtmlReport } from './htmlReport.js'

const doc = (body) => `<!doctype html>\n<html lang="ko">\n<head><title>t</title></head>\n<body>${body}</body>\n</html>`

describe('모델 응답에서 문서 뽑기', () => {
  test('요약 주석과 문서를 나눠 뽑는다', () => {
    const r = extractEdit(`<!--SUMMARY: 표를 차트 위로 올렸습니다-->\n${doc('<p>x</p>')}`)
    assert.equal(r.summary, '표를 차트 위로 올렸습니다')
    assert.match(r.html, /^<!doctype html>/)
    assert.match(r.html, /<\/html>$/)
    assert.ok(!r.html.includes('SUMMARY'), '요약 주석이 문서에 섞이면 안 된다')
  })

  test('코드펜스를 둘러 보내도 벗긴다', () => {
    const r = extractEdit('```html\n' + doc('<p>x</p>') + '\n```')
    assert.match(r.html, /^<!doctype html>/)
  })

  test('요약이 없어도 문서는 살린다 — 요약은 부수적이다', () => {
    const r = extractEdit(doc('<p>x</p>'))
    assert.equal(r.summary, null)
    assert.match(r.html, /^<!doctype html>/)
  })

  test('설명을 앞뒤에 붙여 보내도 문서만 도려낸다', () => {
    const r = extractEdit(`알겠습니다. 아래와 같이 고쳤습니다.\n\n${doc('<p>x</p>')}\n\n필요하면 더 말씀해 주세요.`)
    assert.match(r.html, /^<!doctype html>/)
    assert.match(r.html, /<\/html>$/)
    assert.ok(!r.html.includes('알겠습니다'))
  })

  test('</html> 없이 끊긴 응답은 받지 않는다', () => {
    // 그대로 미리보기에 넣으면 브라우저가 알아서 닫아버려서 "왜 뒷부분이 없지"만 남는다.
    const r = extractEdit('<!doctype html>\n<html lang="ko"><body><p>여기서 토큰이 끊')
    assert.ok(r.error)
    assert.match(r.error, /끊겼습니다/)
    assert.equal(r.html, undefined)
  })

  test('HTML이 아예 없으면 오류다', () => {
    assert.ok(extractEdit('죄송하지만 그 요청은 수행할 수 없습니다.').error)
    assert.ok(extractEdit('').error)
    assert.ok(extractEdit(null).error)
  })

  test('stripFence는 펜스가 없으면 그대로 둔다', () => {
    assert.equal(stripFence('  <p>x</p>  '), '<p>x</p>')
  })
})

describe('외부 참조 찾기 — 파일 하나로 열려야 한다', () => {
  test('스크립트·스타일시트·이미지·@import·프로토콜 상대 URL을 모두 잡는다', () => {
    const refs = findExternalRefs(`
      <script src="https://cdn.example.com/echarts.js"></script>
      <link rel="stylesheet" href="//fonts.example.com/a.css">
      <img src="http://img.example.com/logo.png">
      <style>@import "https://x.example.com/b.css"; .a{background:url(https://y.example.com/c.png)}</style>
    `)
    assert.equal(refs.length, 5)
    assert.ok(refs.some((r) => r.includes('echarts.js')))
    assert.ok(refs.some((r) => r.startsWith('//fonts')))
    assert.ok(refs.some((r) => r.includes('c.png')))
  })

  test('문서 안에서 끝나는 참조는 잡지 않는다', () => {
    const refs = findExternalRefs('<a href="#top">위로</a><span style="fill:url(#grad)"></span><img src="data:image/png;base64,AAAA">')
    assert.deepEqual(refs, [])
  })
})

describe('블록 찾기 · 목록', () => {
  const page = '<div class="wrap">'
    + '<header id="b-header"><h1>제목</h1></header>'
    + '<section class="block" id="b-totals"><h2>퍼널 총계</h2><div>안</div></section>'
    + '<section class="block" id="b-trend"><h2>월별 추이</h2><section>중첩된 섹션</section>꼬리</section>'
    + '<footer id="b-footer">끝</footer></div>'

  test('같은 태그가 중첩돼도 짝을 맞춰 끝을 찾는다', () => {
    // 첫 </section>으로 끊으면 "꼬리"가 잘려 나간다.
    const el = findElementById(page, 'b-trend')
    const inner = page.slice(el.start, el.end)
    assert.ok(inner.includes('중첩된 섹션'))
    assert.ok(inner.endsWith('꼬리</section>'))
  })

  test('블록 목록에 id·태그·제목·크기를 담는다', () => {
    const blocks = listBlocks(page)
    assert.deepEqual(blocks.map((b) => b.id), ['b-header', 'b-totals', 'b-trend', 'b-footer'])
    assert.equal(blocks.find((b) => b.id === 'b-totals').title, '퍼널 총계')
    assert.equal(blocks.find((b) => b.id === 'b-header').tag, 'header')
    assert.ok(blocks.every((b) => b.bytes > 0))
  })

  test('없는 id는 null', () => {
    assert.equal(findElementById(page, 'b-nope'), null)
  })
})

describe('블록 편집 프로토콜 — 바뀐 것만 주고받는다', () => {
  const page = '<body><section id="a"><h2>A</h2></section><section id="b"><h2>B</h2></section></body>'

  test('바뀐 블록만 갈아끼운다', () => {
    const parsed = parseEditResponse(
      '<!--SUMMARY: A를 고쳤습니다-->\n<!--BLOCK id="a"-->\n<section id="a"><h2>새 A</h2></section>\n<!--/BLOCK-->',
    )
    assert.equal(parsed.mode, 'blocks')
    assert.equal(parsed.summary, 'A를 고쳤습니다')
    const { html, applied, failed } = applyBlockEdits(page, parsed.edits)
    assert.match(html, /<section id="a"><h2>새 A<\/h2><\/section>/)
    assert.match(html, /<section id="b"><h2>B<\/h2><\/section>/)   // 안 건드린 블록은 그대로
    assert.deepEqual(applied, ['a'])
    assert.deepEqual(failed, [])
  })

  test('여러 블록을 한 번에 고친다', () => {
    const parsed = parseEditResponse(
      '<!--BLOCK id="a"--><section id="a">A2</section><!--/BLOCK-->'
      + '<!--BLOCK id="b"--><section id="b">B2</section><!--/BLOCK-->',
    )
    assert.deepEqual(applyBlockEdits(page, parsed.edits).applied, ['a', 'b'])
  })

  test('새 블록은 after로 자리를 받아 끼운다', () => {
    const parsed = parseEditResponse(
      '<!--BLOCK id="c" after="a"--><section id="c">C</section><!--/BLOCK-->',
    )
    const { html, applied } = applyBlockEdits(page, parsed.edits)
    assert.deepEqual(applied, ['c'])
    assert.ok(html.indexOf('id="c"') > html.indexOf('id="a"'))
    assert.ok(html.indexOf('id="c"') < html.indexOf('id="b"'))
  })

  test('자리를 모르는 새 블록은 끝에 붙이지 않고 실패로 알린다', () => {
    // 엉뚱한 자리에 조용히 들어가면 되돌리기 전엔 못 찾는다.
    const { html, applied, failed } = applyBlockEdits(page, [{ id: 'z', op: 'replace', html: '<section id="z"/>' }])
    assert.deepEqual(applied, [])
    assert.equal(failed[0].id, 'z')
    assert.equal(html, page)
  })

  test('블록 안 한 조각만 바꾼다 — 차트 제목 하나에 SVG 전체를 다시 쓰지 않는다', () => {
    const chart = '<body><figure id="c1"><figcaption>계약 — 채널별</figcaption><svg>…큰 SVG…</svg></figure></body>'
    const parsed = parseEditResponse(
      '<!--PATCH id="c1"-->\n<!--FIND--><figcaption>계약 — 채널별</figcaption><!--/FIND-->\n'
      + '<!--TO--><figcaption>계약 추이 (Gross)</figcaption><!--/TO-->\n<!--/PATCH-->',
    )
    assert.equal(parsed.edits[0].op, 'patch')
    const { html, applied, failed } = applyBlockEdits(chart, parsed.edits)
    assert.match(html, /<figcaption>계약 추이 \(Gross\)<\/figcaption>/)
    assert.match(html, /…큰 SVG…/)   // 나머지는 손대지 않는다
    assert.deepEqual(applied, ['c1'])
    assert.deepEqual(failed, [])
  })

  test('찾는 문자열이 여러 번이면 고르지 않고 실패로 알린다', () => {
    // 조용히 첫 번째를 고치면 사용자는 엉뚱한 데가 바뀐 걸 되돌리기 전엔 못 찾는다.
    const dup = '<body><section id="a"><p>같은 말</p><p>같은 말</p></section></body>'
    const { html, applied, failed } = applyBlockEdits(dup, [
      { id: 'a', op: 'patch', find: '<p>같은 말</p>', to: '<p>바뀜</p>' },
    ])
    assert.deepEqual(applied, [])
    assert.match(failed[0].reason, /2번 나와/)
    assert.equal(html, dup)
  })

  test('찾는 문자열이 없으면 실패로 알린다', () => {
    const { failed } = applyBlockEdits(page, [{ id: 'a', op: 'patch', find: '없는 말', to: 'x' }])
    assert.match(failed[0].reason, /블록에 없음/)
  })

  test('바꿀 내용에 $& 같은 치환 기호가 있어도 그대로 들어간다', () => {
    // String.replace는 $&·$1을 특수하게 읽는다 — 콜백으로 넘기지 않으면 문구가 깨진다.
    const src = '<body><section id="a"><p>원문</p></section></body>'
    const { html } = applyBlockEdits(src, [{ id: 'a', op: 'patch', find: '<p>원문</p>', to: '<p>비용 $& 대비 $1</p>' }])
    assert.match(html, /비용 \$& 대비 \$1/)
  })

  test('블록을 지운다', () => {
    const parsed = parseEditResponse('<!--REMOVE id="b"-->')
    const { html, applied } = applyBlockEdits(page, parsed.edits)
    assert.deepEqual(applied, ['b'])
    assert.ok(!html.includes('id="b"'))
    assert.ok(html.includes('id="a"'))
  })

  test('전체 재작성 경로는 그대로 열려 있다 — 인쇄용 재구성 같은 전역 요청이 있다', () => {
    const parsed = parseEditResponse(
      '<!--SUMMARY: 전체 개편-->\n<!--DOCUMENT-->\n<!doctype html>\n<html lang="ko"><body>새 문서</body></html>\n<!--/DOCUMENT-->',
    )
    assert.equal(parsed.mode, 'document')
    assert.match(parsed.html, /^<!doctype html>/)
    assert.match(parsed.html, /<\/html>$/)
  })

  test('형식을 안 지키고 문서 전체를 보내도 살린다 — 형식 하나로 턴을 통째로 버리지 않는다', () => {
    const parsed = parseEditResponse('<!doctype html>\n<html lang="ko"><body>x</body></html>')
    assert.equal(parsed.mode, 'document')
  })

  test('블록도 문서도 없으면 오류다', () => {
    assert.ok(parseEditResponse('그 요청은 수행할 수 없습니다.').error)
  })

  test('블록이 잘려 닫히지 않으면 그 블록은 건드리지 않는다', () => {
    // <!--/BLOCK-->이 안 오면 애초에 매칭이 안 되므로 편집 목록에 안 들어간다.
    const parsed = parseEditResponse('<!--BLOCK id="a"--><section id="a">여기서 토큰이 끊')
    assert.ok(parsed.error)
  })
})

describe('편집에 쓸 수 있는 데이터 블록', () => {
  const data = {
    metrics: [
      {
        id: '기회', definition: '구매 관심이 포착된 건.', source: 'ktws.FCT_LEAD',
        dateBasis: '기회생성일자 (lead_reg_dt)', channelBasis: '기회 행의 ca_act_tp', available: true,
      },
      {
        id: '계약', definition: 'Gross 기준.', source: 'ktws.FCT_CONTRACT_KTWS',
        dateBasis: '계약일자 (contract_dt)', channelBasis: '기회 행의 ca_act_tp',
        available: false, error: '타임아웃',
      },
    ],
    series: { 기회: { total: 1200, month: { '2026-07': 400 } } },
  }

  test('지표 정의와 집계를 함께 싣는다 — 문서에 없는 지표를 쓰려면 둘 다 필요하다', () => {
    const block = buildDataBlock(data)
    assert.match(block, /기회생성일자 \(lead_reg_dt\)/)
    assert.match(block, /ktws\.FCT_LEAD/)
    assert.match(block, /월 순서입니다: 2026-07/)
    assert.match(block, /"월별":\[400\]/)
  })

  test('월 키를 반복하지 않고 축으로 한 번만 적는다 — 여기가 제일 큰 낭비였다', () => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04']
    const byMonth = (base) => Object.fromEntries(months.map((m, i) => [m, base + i]))
    const wide = buildDataBlock({
      metrics: [],
      series: {
        활동: {
          total: 100,
          month: byMonth(10),
          month_by_channel: Object.fromEntries(['관계형성활동', 'SC활동', '내방/내전', '온라인유입'].map((c) => [c, byMonth(1)])),
          month_by_dealer: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`딜러${i}`, byMonth(2)])),
        },
      },
    })
    // 월 이름은 축 한 줄에만 나온다. 계열마다 반복되면 20계열 × 4개월 = 80번 나온다.
    assert.equal([...wide.matchAll(/2026-01/g)].length, 1)
    assert.ok(wide.includes('"딜러0":[2,3,4,5]'))
  })

  test('조회 실패한 지표는 쓰지 말라고 표시한다 — 0으로 그리면 실적 0과 구분이 안 된다', () => {
    assert.match(buildDataBlock(data), /계약 \(조회 실패 — 쓰지 마세요\)/)
  })

  test('데이터가 없으면 블록을 만들지 않는다 — 빈 블록을 넣으면 없는 걸 있다고 읽는다', () => {
    assert.equal(buildDataBlock(null), null)
    assert.equal(buildDataBlock({}), null)
    assert.equal(buildDataBlock({ metrics: [] }), null)
  })
})

// 검사가 옳다는 가장 강한 증거는 **코드가 만든 원본이 아무 경고도 안 내는 것**이다.
// 원본은 이 규약을 지키도록 짜여 있으므로, 여기서 경고가 나오면 검사가 틀린 것이다.
describe('차트 규약 — 원본은 규약을 지킨다', () => {
  const original = buildHtmlReport({
    period: { from: '2026-01-01', to: '2026-09-01', brand: null },
    monthly: { 활동: { '2026-06': 100, '2026-07': 120 } },
    month_by_channel: {
      활동: {
        관계형성활동: { '2026-06': 40, '2026-07': 45 },
        SC활동: { '2026-06': 30, '2026-07': 35 },
        '내방/내전': { '2026-06': 20, '2026-07': 25 },
        온라인유입: { '2026-06': 10, '2026-07': 15 },
      },
    },
    funnel_totals: {
      활동: 100,
      활동_채널별: { 관계형성활동: 85, SC활동: 65, '내방/내전': 45, 온라인유입: 25 },
    },
    detection: {},
  })

  test('테마 변수를 안 거친 색이 하나도 없다', () => {
    assert.deepEqual(findUnthemedColors(original), [])
  })

  test('다크모드 정의 세 자리가 다 있다', () => {
    assert.deepEqual(findThemeGaps(original), [])
  })

  test('채널이 전부 자기 색 슬롯을 쓴다', () => {
    assert.deepEqual(findRecoloredChannels(original), [])
  })

  test('직접 라벨과 범례를 함께 센다', () => {
    const l = landmarks(original)
    assert.ok(l.labels >= 4, '계열마다 직접 라벨이 있어야 한다')
    assert.ok(l.legends >= 1)
  })

  test('원본을 그대로 다시 넣으면 경고가 없다 — 매 턴 같은 경고가 반복되면 진짜 경고가 묻힌다', () => {
    assert.deepEqual(reviewEdit(original, original).warnings, [])
  })
})

describe('차트 규약 위반을 잡는다', () => {
  const doc2 = (style, body) => `<!doctype html>
<html lang="ko"><head><style>
:root { --s0: #2a78d6; --s1: #eb6834; --s2: #1baf7a; --s3: #eda100; --surface-1: #fcfcfb; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --s0: #3987e5; } }
:root[data-theme="dark"] { --s0: #3987e5; }
${style}
</style></head><body>${body}</body></html>`

  const clean = doc2('.bar-fill { border-radius: 4px; }',
    '<svg><path stroke="var(--s0)"/><circle fill="var(--s0)"><title>관계형성활동 · 2026-06: 40</title></circle></svg>')

  test('토큰만 쓰는 문서는 통과한다', () => {
    assert.deepEqual(findUnthemedColors(clean), [])
  })

  test('SVG에 직접 박은 색을 잡는다 — 다크모드에서만 안 바뀐다', () => {
    const bad = doc2('', '<svg><path stroke="#2a78d6"/><rect fill="rgb(235,104,52)"/></svg>')
    const hits = findUnthemedColors(bad)
    assert.ok(hits.includes('#2a78d6'))
    assert.ok(hits.some((h) => h.startsWith('rgb(')))
  })

  test('테마 블록 밖의 CSS 규칙에 박은 색도 잡는다', () => {
    const bad = doc2('.donut-slice { fill: #eda100; }', '<svg></svg>')
    assert.deepEqual(findUnthemedColors(bad), ['#eda100'])
  })

  test('테마 블록 안의 색은 잡지 않는다 — 토큰 정의 그 자체다', () => {
    // 중첩된 @media까지 통째로 건너뛰어야 한다. 정규식으로 자르면 여기서 샌다.
    assert.deepEqual(findUnthemedColors(clean), [])
  })

  test('@media print 안의 색은 잡지 않는다 — 인쇄용 토큰 되돌리기다', () => {
    // 인쇄는 언제나 밝은 바탕이라 :root 토큰을 다시 정의해야 한다. 그걸 위반으로 보면
    // 문서를 고칠 때마다 고칠 수 없는 경고가 뜬다.
    const printed = doc2('@media print { :root { --surface-0: #ffffff; --text-primary: #000000; } }', '')
    assert.deepEqual(findUnthemedColors(printed), [])
  })

  test('HTML 엔티티를 색으로 오인하지 않는다', () => {
    assert.deepEqual(findUnthemedColors(doc2('', '<p>&#39;따옴표&#39; &#8212;</p>')), [])
  })

  test('완전 투명은 경고하지 않는다 — 고칠 수 없는 경고는 진짜 경고를 가린다', () => {
    // 라이브 편집에서 실제로 #0000이 경고를 띄웠다. 투명은 라이트·다크가 같다.
    const transparent = doc2('.x { background: #0000; border-color: rgba(0,0,0,0); outline: #00000000; }', '')
    assert.deepEqual(findUnthemedColors(transparent), [])
  })

  test('알파가 0이 아니면 여전히 잡는다', () => {
    const opaque = doc2('.x { background: #0008; border-color: rgba(0,0,0,0.5); }', '')
    const hits = findUnthemedColors(opaque)
    assert.ok(hits.includes('#0008'))
    assert.ok(hits.some((h) => h.startsWith('rgba(')))
  })

  test('다크모드 블록이 지워지면 알린다', () => {
    const noDark = '<!doctype html><html><head><style>:root { --s0: #2a78d6; }</style></head><body></body></html>'
    const gaps = findThemeGaps(noDark)
    assert.ok(gaps.some((g) => /prefers-color-scheme/.test(g)))
    assert.ok(gaps.some((g) => /data-theme/.test(g)))
  })

  test('채널 색이 밀린 것을 잡는다', () => {
    // 온라인유입은 CHANNEL_ORDER의 4번째라 언제나 슬롯 3이어야 한다.
    const recolored = findRecoloredChannels(
      '<li><span class="swatch" style="background:var(--s1)"></span>온라인유입</li>',
    )
    assert.equal(recolored.length, 1)
    assert.equal(recolored[0].name, '온라인유입')
    assert.equal(recolored[0].expected, 3)
    assert.deepEqual(recolored[0].used, [1])
  })

  test('막대 행 구조에서도 채널과 색을 짝지어 본다', () => {
    const row = '<div class="bar-row"><span class="bar-label">SC활동</span>'
      + '<span class="bar-track"><span class="bar-fill" style="width:50%;background:var(--s1)"></span></span></div>'
    assert.deepEqual(findRecoloredChannels(row), [])
  })

  test('한 덩어리에 채널이 둘이면 판정하지 않는다 — 억지 경고보다 침묵이 낫다', () => {
    const ambiguous = '<span>관계형성활동과 SC활동 비교 <b style="color:var(--s2)">보기</b></span>'
    assert.deepEqual(findRecoloredChannels(ambiguous), [])
  })
})

describe('편집 검토 — 막지 않고 알린다', () => {
  const before = doc('<section><table><tr><td>1</td></tr><tr><td>2</td></tr></table><svg></svg></section><section><svg></svg></section>')

  test('사라진 섹션·표·차트를 세어 알린다', () => {
    const after = doc('<section><svg></svg></section>')
    const { warnings } = reviewEdit(before, after)
    assert.ok(warnings.some((w) => /섹션 1개가 없어졌습니다/.test(w)))
    assert.ok(warnings.some((w) => /표 1개가 없어졌습니다/.test(w)))
    assert.ok(warnings.some((w) => /차트 1개가 없어졌습니다/.test(w)))
  })

  test('요청대로 늘어난 편집에는 경고를 달지 않는다', () => {
    const after = doc('<section><table><tr><td>1</td></tr><tr><td>2</td></tr></table><svg></svg></section><section><svg></svg></section><section><p>요약</p></section>')
    assert.deepEqual(reviewEdit(before, after).warnings, [])
  })

  test('외부 주소가 생기면 알린다 — 사내망에서 빈 칸으로 뜬다', () => {
    const after = doc('<section><table><tr><td>1</td></tr><tr><td>2</td></tr></table><svg></svg></section><section><svg></svg></section><script src="https://cdn.example.com/x.js"></script>')
    const { warnings } = reviewEdit(before, after)
    assert.ok(warnings.some((w) => /외부 주소를 참조합니다/.test(w)))
  })

  test('문서가 크게 줄면 알린다', () => {
    const { warnings } = reviewEdit(doc('<p>' + 'x'.repeat(5000) + '</p>'), doc('<p>x</p>'))
    assert.ok(warnings.some((w) => /% 줄었습니다/.test(w)))
  })

  test('전후 뼈대 수치를 함께 돌려준다 — 화면이 delta를 그린다', () => {
    const { before: b, after: a } = reviewEdit(before, doc('<section></section>'))
    assert.equal(b.sections, 2)
    assert.equal(b.tables, 1)
    assert.equal(b.charts, 2)
    assert.equal(a.sections, 1)
    assert.ok(b.bytes > a.bytes)
  })

  test('landmarks는 빈 값에도 터지지 않는다', () => {
    assert.deepEqual(landmarks(null), {
      bytes: 0, sections: 0, tables: 0, charts: 0, rows: 0, labels: 0, legends: 0,
    })
  })
})
