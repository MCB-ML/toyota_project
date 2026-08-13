// 59개 지표가 Semantic Signature로 어떻게 읽히는지 뽑는다(스펙 14장 Phase 8).
//   node backend/agentic-bi/semantic/migrationReport.mjs
//
// registry가 아니라 **YAML 원본**을 읽는다 — registry는 이미 signature를 붙여 놓기 때문에
// 그걸 다시 재면 전부 DECLARED로 나온다(처음 뽑았을 때 실제로 그랬다).
//
// 출력: semantic-migration-report.json
//   AUTO_SAFE        그대로 써도 되는 것
//   REVIEW_REQUIRED  사람이 YAML에 semantic_signature를 적어 두는 게 나은 것
//   AMBIGUOUS        반드시 사람이 정해야 하는 것
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'

import { signatureOf, migrationClass } from './signature.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FILES = ['activity', 'lead', 'testdrive', 'contract', 'delivery', 'target'].map((n) => `metrics/${n}_metrics.yaml`)

const rows = []
for (const rel of FILES) {
  const doc = parseYaml(fs.readFileSync(path.join(HERE, rel), 'utf8'))
  for (const m of doc.metrics || []) {
    const s = signatureOf(m)
    rows.push({
      id: m.id,
      name_ko: m.name_ko || null,
      class: migrationClass(m),
      concept: s.measure.concept,
      kind: s.measure.kind,
      output_grain: s.time.output_grain,
      calculation_window: s.time.calculation_window,
      cumulative: s.time.cumulative,
      confidence: s.confidence,
      evidence: s.evidence,
      source_file: rel,
    })
  }
}

const summary = {}
for (const r of rows) summary[r.class] = (summary[r.class] || 0) + 1

const out = path.join(HERE, 'semantic-migration-report.json')
fs.writeFileSync(out, JSON.stringify({ total: rows.length, summary, metrics: rows.sort((a, b) => a.id.localeCompare(b.id)) }, null, 2))

console.log(`총 ${rows.length}개`, summary)
for (const r of rows) {
  if (r.class === 'AUTO_SAFE') continue
  console.log(`  ${r.class.padEnd(16)} ${r.id.padEnd(40)} ${r.concept.padEnd(10)} ${String(r.output_grain).padEnd(6)} ${r.calculation_window}  [${r.confidence}]`)
}
console.log(`\n→ ${out}`)
