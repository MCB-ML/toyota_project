// Dimension catalog for fragments that declare `group_by_placeholder` — lets ONE fragment
// serve many "~별" questions (딜러별/브랜드별/전시장별/부서별/SC별 등) instead of a fragment
// being hand-duplicated per dimension (see rag-poc/design-scaling-improvements.md §2).
//
// Scope (2026-07-22, 1단계): only dimensions that are plain columns on tables the fragment
// ALREADY joins — no extra JOINs added. `expression` assumes the fragment aliases
// KPI_W::DIM_MNG_USER as `u` (every fragment that currently uses this catalog does).
// Dimensions needing an extra join (e.g. 모델별 -> DIM_VEHIC_SPEC_MDL) are out of scope for
// this stage — see design doc §2 "바로는 안 되는 범위".

export const dimensions = [
  {
    id: 'sc', label: 'SC', synonyms: ['SC', 'sc', '영업사원', '세일즈컨설턴트', '판매사원', '담당자'],
    expression: 'u.name',
  },
  {
    id: 'dealer', label: '딜러', synonyms: ['딜러', '딜러사', '대리점', '딜러별'],
    expression: 'u.dealer_nm',
  },
  {
    id: 'brand', label: '브랜드', synonyms: ['브랜드', '브랜드별'],
    expression: 'u.BRAND',
  },
  {
    id: 'group', label: '전시장', synonyms: ['전시장', '지점', '매장', '전시장별'],
    expression: 'u.group_name',
  },
  {
    id: 'dept', label: '부서', synonyms: ['부서', '팀', '부서별'],
    expression: 'u.dept_nm',
  },
]

// structured.dimensions는 Stage 0(LLM)이 뽑은 자유 텍스트(예: "브랜드", "딜러별")라 정확한
// enum이 아니다 — id/synonym 완전 일치 + 부분 포함(예: "브랜드별"이 "브랜드"를 포함) 둘 다 허용.
// fragment.supported_dimensions로 후보를 먼저 좁혀서, 이 fragment가 실제로 못 다루는
// dimension은 애초에 매치되지 않게 한다.
export function resolveGroupDimension(requestedDimensions, supportedDimensionIds) {
  if (!requestedDimensions?.length || !supportedDimensionIds?.length) return null
  const candidates = dimensions.filter(d => supportedDimensionIds.includes(d.id))
  for (const requested of requestedDimensions) {
    const text = String(requested || '').trim()
    if (!text) continue
    const hit = candidates.find(d => d.id === text || d.synonyms.some(s => text.includes(s) || s.includes(text)))
    if (hit) return hit
  }
  return null
}
