import 'dotenv/config'
import { createAzureClient, getAzureConfig } from '../azureClient.js'
import { runPipeline } from './pipeline.js'

// Manual smoke test for the 10-stage pipeline — liveValidate:false so this stays fast/free
// (no Stage 9b Fabric round-trip), just to sanity-check every stage produces sane output and
// composedSql looks structurally right.
const queries = [
  '특정 딜러의 이번달 활동 건수를 보여줘',
  '특정 딜러의 이번달 영업기회 건수를 보여줘',
  '특정 딜러의 이번달 계약 건수를 보여줘',
  '이번달 영업기회 대비 계약 전환율을 보여줘',
  '캠페인 타입별 실행 완료 건수를 보여줘', // 매칭되는 Pattern Card가 없어야 정상 — reject_plan 경로 확인용
]

async function main() {
  const client = createAzureClient()
  if (!client) throw new Error('Azure OpenAI env vars missing')
  const { deployment } = getAzureConfig()

  for (const q of queries) {
    const result = await runPipeline({ query: q, client, deployment, opts: { liveValidate: false } })
    console.log('='.repeat(80))
    console.log('Q:', q)
    console.log('Stage0 structured:', JSON.stringify(result.stage0_structured))
    console.log('Stage1 hitTables:', result.stage1_tables.map(t => `${t.db}.${t.id}(${t.score.toFixed(2)})`).join(', '))
    console.log('Stage2 patterns:', result.stage2_patterns.map(p => `${p.pattern_id}(${p.score.toFixed(2)})`).join(', '))
    if (result.error) {
      console.log('ERROR:', result.error)
      continue
    }
    console.log('Stage3 plan:', result.stage3_plan.pattern_id, '-', result.stage3_plan.steps.map(s => s.cte_name).join(' -> '))
    console.log('Stage4 fragments:', result.stage4_fragments.map(f => f.fragment_id).join(', '))
    console.log('Stage5 backfill missingTables:', result.stage5_backfill.missingTables.map(t => `${t.db}.${t.id}`).join(', ') || '(none)')
    console.log('Stage6 rules:', result.stage6_rules.map(r => r.term).join(', '))
    console.log('Stage6 glossary:', result.stage6_glossary.map(g => `${g.term}(${g.score.toFixed(2)})`).join(', '))
    console.log('Stage7 steps:', result.stage7_steps.map(s => s.cte_name).join(', '))
    console.log('\ncomposedSql:\n' + result.composedSql)
    console.log('\nlint warnings:', JSON.stringify(result.validation.structuralWarnings))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
