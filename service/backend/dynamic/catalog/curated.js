// 큐레이션된 스키마 설명(schema/tables/*.yaml, schema/index.yaml)을 하베스트 결과에 얹는다.
//
// 이 파일은 schema/ 디렉터리를 **읽기만** 한다. 사용자 지시대로 schema는 그대로 두고,
// 여기서는 "사람이 검증한 설명"이라는 신뢰 등급을 인덱스에 옮겨 담는 역할만 한다.
import { listTableIndex, loadTableSchema } from '../../schemaLoader.js'
import { STATUS } from './metadataIndex.js'

/**
 * schema/index.yaml + schema/tables/*.yaml 을 {테이블명 -> 큐레이션 정보}로 읽는다.
 * 파일이 깨져 있으면 그 테이블만 건너뛴다 — 하베스트 전체를 세우지 않는다.
 */
export function loadCuratedTables() {
  const out = new Map()
  let entries = []
  try {
    entries = listTableIndex() || []
  } catch {
    return out
  }
  for (const entry of entries) {
    let schema
    try {
      schema = loadTableSchema(entry.file)
    } catch {
      continue
    }
    if (!schema?.table) continue
    const columns = new Map()
    for (const c of schema.columns || []) {
      columns.set(String(c.name).toLowerCase(), { description: c.description || null, type: c.type || null })
    }
    out.set(schema.table, {
      ko: entry.ko || null,
      synonyms: entry.syn || [],
      description: schema.description || null,
      grain: schema.grain || null,
      primary_keys: schema.semantics?.keys?.primary || [],
      foreign_keys: schema.semantics?.keys?.foreign || [],
      columns,
    })
  }
  return out
}

/**
 * 하베스트한 테이블/컬럼에 큐레이션 설명을 병합하고 인증 등급을 매긴다.
 *
 * 설명이 있는 컬럼은 CERTIFIED — "이 컬럼이 업무적으로 무엇인지" 사람이 적어둔 것이 있다는
 * 뜻이다. 없으면 DISCOVERED — 존재는 확실하지만 의미는 런타임에 근거를 모아야 한다.
 */
export function applyCurated(index, curated = loadCuratedTables()) {
  for (const t of index.tables || []) {
    const c = curated.get(t.table)
    t.curated = Boolean(c)
    if (!c) {
      for (const col of t.columns) col.certification_status = STATUS.DISCOVERED
      continue
    }
    t.ko = c.ko
    t.synonyms = c.synonyms
    t.description = c.description
    t.grain = c.grain
    if (c.primary_keys?.length) t.declared_primary_keys = c.primary_keys
    // 정의서가 적어둔 FK 선언 — Schema Graph의 "metadata FK" 근거가 된다(스펙 11장).
    // 이름 유사도보다 강한 근거지만, 그래도 Certified Join(joins.yaml)보다는 아래다.
    const fks = (c.foreign_keys || [])
      .filter((fk) => fk?.column && fk?.references?.table && fk?.references?.column)
      .map((fk) => ({
        column: fk.column,
        to_table: `${fk.references.schema || t.schema}.${fk.references.table}`,
        to_column: fk.references.column,
        description: fk.description || null,
      }))
    if (fks.length) t.declared_foreign_keys = fks
    for (const col of t.columns) {
      const meta = c.columns.get(col.name.toLowerCase())
      if (meta?.description) {
        col.description = meta.description
        col.certification_status = STATUS.CERTIFIED
      } else {
        col.certification_status = STATUS.DISCOVERED
      }
    }
  }
  return index
}
