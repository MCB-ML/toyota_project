// Certified Report 파라미터 검증·정규화.
//
// 이 단계를 통과한 값만 드라이버 바인딩으로 넘어간다. 값을 SQL 문자열에 끼워넣는
// 경로는 존재하지 않으므로 여기서 막는 건 인젝션이 아니라 "조용히 틀린 결과"다:
// 원본 GOLD가 다중 값 필터를 LIKE 패딩(',값1,값2,')으로 비교하기 때문에
// 값 자체에 콤마가 들어가면 필터가 엉뚱하게 동작한다. 그건 오류로 세워 막는다.
import { ReportError } from './registry.js'

export const SC_ALL = 'ALL'

// 다중 값 파라미터 하나에 허용하는 최대 개수. LIKE 패딩 문자열이 무한정
// 길어지는 걸 막는 상한이자, LLM이 값을 폭주시켜 넣는 걸 막는 장치.
export const MAX_MULTI_VALUES = 50

const PARAMETER_ALIAS_GROUPS = [
  ['Year', 'year'],
  ['MonthNumber', 'month'],
  ['Day', 'day'],
  ['Brand', 'brand'],
  ['DealerNm', 'dealer_nm'],
  ['GroupName', 'group_name'],
  ['DeptNm', 'dept_nm'],
  ['ActYn', 'active_yn'],
  ['ScName', 'sc_name'],
  ['CommonTpNm', 'common_tp_nm', 'common_tp'],
  ['TpGrp1', 'tp_grp_1'],
]

function buildAliasMap(contract) {
  const known = new Set(contract.parameters.map((p) => p.name))
  const aliasMap = new Map([...known].map((name) => [name, name]))
  for (const group of PARAMETER_ALIAS_GROUPS) {
    const target = group.find((name) => known.has(name))
    if (!target) continue
    for (const alias of group) aliasMap.set(alias, target)
  }
  return { known, aliasMap }
}

function sameRawValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function normalizeParameterKeys(contract, raw, errors, { rejectUnknown = true } = {}) {
  const { known, aliasMap } = buildAliasMap(contract)
  const normalized = {}
  for (const [key, value] of Object.entries(raw || {})) {
    const target = aliasMap.get(key)
    if (!target) {
      if (rejectUnknown) errors.push(`이 리포트에 없는 파라미터입니다: ${key} (사용 가능: ${[...known].join(', ')})`)
      continue
    }
    if (Object.prototype.hasOwnProperty.call(normalized, target) && !sameRawValue(normalized[target], value)) {
      errors.push(`같은 파라미터를 서로 다른 이름으로 중복 지정했습니다: ${target}`)
      continue
    }
    normalized[target] = value
  }
  return normalized
}

function scParameterName(contract) {
  return contract.parameters.find((p) => p.name === 'ScName' || p.name === 'sc_name')?.name
}

function asList(value) {
  if (value === null || value === undefined) return null
  const list = Array.isArray(value) ? value : [value]
  const cleaned = []
  for (const raw of list) {
    if (raw === null || raw === undefined) continue
    const s = String(raw).trim()
    if (s === '') continue // 빈 문자열은 "전체"로 취급 — NULL과 같게 본다
    cleaned.push(s)
  }
  if (cleaned.length === 0) return null
  return [...new Set(cleaned)] // 중복 제거
}

function validateInt(spec, value, errors) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n)) {
    errors.push(`${spec.name}은(는) 정수여야 합니다: ${JSON.stringify(value)}`)
    return null
  }
  if (spec.min !== undefined && n < spec.min) {
    errors.push(`${spec.name}은(는) ${spec.min} 이상이어야 합니다: ${n}`)
    return null
  }
  if (spec.max !== undefined && n > spec.max) {
    errors.push(`${spec.name}은(는) ${spec.max} 이하여야 합니다: ${n}`)
    return null
  }
  return n
}

function validateMultiValue(spec, value, errors) {
  const list = asList(value)
  if (list === null) return null

  if (list.length > MAX_MULTI_VALUES) {
    errors.push(`${spec.name}에 값이 너무 많습니다(${list.length}개, 최대 ${MAX_MULTI_VALUES}개).`)
    return null
  }

  for (const v of list) {
    // LIKE 패딩 방식의 구조적 한계 — 조용히 틀린 결과가 나오므로 명확히 막는다.
    if (v.includes(',')) {
      errors.push(
        `${spec.name}의 값에 콤마가 들어 있어 필터할 수 없습니다: ${JSON.stringify(v)}. ` +
          `이 리포트는 다중 값을 콤마로 구분하기 때문에 값 자체에 콤마가 있으면 구분되지 않습니다.`,
      )
      return null
    }
    if (spec.allowed_values && !spec.allowed_values.includes(v)) {
      errors.push(
        `${spec.name}에 허용되지 않은 값입니다: ${JSON.stringify(v)} ` +
          `(허용: ${spec.allowed_values.join(', ')})`,
      )
      return null
    }
  }

  // SQL은 ',값1,값2,' 패딩으로 비교하므로 콤마로 이어 붙인 하나의 문자열로 넘긴다.
  return list.join(',')
}

/**
 * 요청 파라미터를 계약에 맞춰 검증·정규화한다.
 *
 * @param contract  계약 객체(registry에서 로드한 것)
 * @param raw       {Year, MonthNumber, ScName, ...} 형태의 요청 값
 * @param authorizationScope
 *        {DealerNm: [...], ScName: [...]} 형태의 "이 사용자가 볼 수 있는 범위".
 *        ⚠ 현재 이 서버에는 인증이 없어서 이 값은 호출자가 주장하는 것일 뿐이며
 *        신뢰할 수 있는 신원에서 파생되지 않는다. 즉 보안 경계가 아니라 구조상의
 *        자리다. 서버 인증이 생기면 그때 실제 경계가 된다. (계약의 authorization.enforced 참고)
 * @returns {{ok: boolean, params?: object, errors?: string[]}}
 */
export function validateReportParameters(contract, raw = {}, authorizationScope = null) {
  const errors = []
  const params = {}
  const normalizedRaw = normalizeParameterKeys(contract, raw, errors)

  for (const spec of contract.parameters) {
    // 원본 SQL의 DECLARE에 기본값이 있던 파라미터는 계약에 default로 옮겨 적는다.
    // 예: @lookback_months INT = 3 — 바인딩으로 NULL을 넣으면 TOP(NULL)이 되어
    // "A TOP or FETCH clause contains an invalid value"로 실패한다(실측).
    const value = normalizedRaw[spec.name] ?? (spec.default !== undefined ? spec.default : undefined)

    if (spec.sql_type === 'int') {
      params[spec.name] = validateInt(spec, value, errors)
    } else if (spec.multi_value) {
      params[spec.name] = validateMultiValue(spec, value, errors)
    } else {
      const list = asList(value)
      params[spec.name] = list ? list[0] : null
    }
  }

  // ScName의 'ALL'은 SC 이름이 아니라 "SC 열을 보이되 전체"라는 뜻이다.
  // asList/중복제거를 거쳐도 그대로 살아남아야 하고, 다른 값과 섞이면 모순이다.
  const scName = scParameterName(contract)
  if (scName && params[scName] && params[scName] !== SC_ALL && params[scName].split(',').includes(SC_ALL)) {
    errors.push(`${scName}에 'ALL'과 특정 SC 이름을 함께 지정할 수 없습니다: ${params[scName]}`)
  }

  if (errors.length === 0 && authorizationScope) {
    applyAuthorizationScope(contract, params, normalizeParameterKeys(contract, authorizationScope, errors, { rejectUnknown: false }), errors)
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, params }
}

// 요청 범위 ∩ 허용 범위. 허용 밖의 값을 조용히 떨어뜨리지 않고 오류로 세운다 —
// 조용히 빼면 사용자는 자기가 요청한 것보다 적은 데이터를 보고도 모른다.
function applyAuthorizationScope(contract, params, scope, errors) {
  for (const spec of contract.parameters) {
    if (!spec.authorization_dimension) continue
    const permitted = scope[spec.name]
    if (!permitted || permitted.length === 0) continue // 제한 없음

    const requested = params[spec.name]
    if (requested === null) {
      // "전체" 요청은 허용된 범위로 좁힌다.
      params[spec.name] = permitted.join(',')
      continue
    }
    if (requested === SC_ALL) {
      params[spec.name] = permitted.join(',')
      continue
    }

    const asked = requested.split(',')
    const denied = asked.filter((v) => !permitted.includes(v))
    if (denied.length > 0) {
      errors.push(`권한 밖의 ${spec.name} 값이 포함되어 있습니다: ${denied.join(', ')}`)
      continue
    }
    params[spec.name] = asked.join(',')
  }
}
