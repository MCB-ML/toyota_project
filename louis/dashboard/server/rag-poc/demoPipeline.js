import 'dotenv/config'
import { runPipeline, renderPipelineForPrompt } from './pipeline.js'

// Manual smoke test for the 4-stage pipeline — picks queries likely to exercise
// each stage, including Stage 3's backfill path (queries whose best-matching
// few-shot example is cross-table, so there's a real chance Stage 1's top-5 alone
// misses one side of the join).
const queries = [
  '이번달 브랜드별 계약 건수 알려줘',
  '캠페인 타입별 실행 완료 건수를 보여줘',
  '딜러 휴일을 제외한 이번 달 일별 입고 건수를 보여줘',
  '재고 수량이 많은 부품 TOP 10을 보여줘',
]

async function main() {
  for (const q of queries) {
    const result = await runPipeline(q)
    console.log('='.repeat(80))
    console.log('Q:', q)
    console.log('Stage1 hitTables:', result.stage1.hitTables.map(t => `${t.db}.${t.id}(${t.score.toFixed(2)})`).join(', '))
    console.log('Stage2 general few-shot:', result.stage2.general.map(f => f.id).join(', '))
    console.log('Stage2 cross few-shot:', result.stage2.cross.map(f => f.id).join(', '))
    console.log('Stage3 missingTables:', result.stage3.missingTables.map(t => `${t.db}.${t.id}`).join(', ') || '(none)')
    console.log('Stage3 backfillSchema:', result.stage3.backfillSchema.map(t => `${t.db}.${t.id}`).join(', ') || '(none)')
    console.log('Stage4 glossary:', result.stage4.glossaryHits.map(g => `${g.term}(${g.score.toFixed(2)})`).join(', '))
  }

  console.log('\n' + '='.repeat(80))
  console.log('Full rendered prompt for first query:\n')
  const first = await runPipeline(queries[0])
  console.log(renderPipelineForPrompt(first))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
