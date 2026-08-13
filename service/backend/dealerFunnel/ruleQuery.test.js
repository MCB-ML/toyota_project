// 규칙 기반 SQL 생성 — 실행 전 방어와 결과 포장:
//   node --test backend/dealerFunnel/ruleQuery.test.js
//
// SQL이 맞는지 대조할 정답이 없는 경로다. 그래서 막을 수 있는 것(테이블 범위·형식)은
// 여기서 못 박고, 막을 수 없는 것(값의 정확성)은 SQL을 드러내 사람이 보게 한다.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildRuleQueryBlock, buildSchemaBlock, buildValuesBlockFrom, checkSqlRules, extractSql, findDisallowedTables } from './ruleQuery.js'
import { ALLOWED_TABLES, FUNNEL_SQL_RULES } from './rules.js'

describe('규칙 본문 — 실측한 함정이 다 들어 있다', () => {
  test('① 테이블은 ktws 스키마', () => {
    assert.match(FUNNEL_SQL_RULES, /ktws\.<테이블>/)
    assert.match(FUNNEL_SQL_RULES, /KPI_W는 데이터베이스 이름이지 스키마가 아닙니다/)
  })

  test('② tp_grp_1으로 매핑 금지 — 관계형성소개가 샌다', () => {
    assert.match(FUNNEL_SQL_RULES, /tp_grp_1\(그룹\)으로 나누지 마세요/)
    assert.match(FUNNEL_SQL_RULES, /기회창출-관계형성 소개/)
  })

  test('③ 조인은 tp_key로 — tp_cd로 조인하면 값이 갈린다', () => {
    assert.match(FUNNEL_SQL_RULES, /A\.tp_key = T\.tp_key/)
    assert.match(FUNNEL_SQL_RULES, /7,553\(tp_key\) 대 7,684\(tp_cd\)/)
  })

  test('④ 활동은 채널 매핑 대상만', () => {
    assert.match(FUNNEL_SQL_RULES, /매핑 대상만 셉니다/)
  })

  test('시승 3단계와 계약 Gross를 못 박는다', () => {
    assert.match(FUNNEL_SQL_RULES, /PARTITION BY lead_key/)
    assert.match(FUNNEL_SQL_RULES, /cancel_dt로 거르지 마세요/)
  })

  test('지표마다 날짜 기준이 다르다고 적는다 (3-7)', () => {
    for (const col of ['act_dt_fr', 'lead_reg_dt', 'contract_dt']) {
      assert.match(FUNNEL_SQL_RULES, new RegExp(col))
    }
  })
})

describe('SQL 뽑기', () => {
  test('코드펜스를 벗긴다', () => {
    assert.equal(extractSql('```sql\nSELECT 1\n```'), 'SELECT 1')
  })

  test('펜스 없이 설명이 앞에 붙어도 SELECT부터 자른다', () => {
    assert.equal(extractSql('아래와 같이 조회합니다.\nSELECT 1'), 'SELECT 1')
  })

  test('WITH로 시작하는 문도 잡는다', () => {
    assert.match(extractSql('```\nWITH a AS (SELECT 1) SELECT * FROM a;\n```'), /^WITH a AS/)
  })

  test('끝의 세미콜론은 뗀다 — mssql이 여러 문장으로 읽을 여지를 없앤다', () => {
    assert.ok(!extractSql('SELECT 1;').endsWith(';'))
  })

  test('SQL이 없으면 null', () => {
    assert.equal(extractSql('NO_QUERY'), null)
    assert.equal(extractSql(''), null)
  })
})

describe('테이블 범위 — 퍼널 밖은 조회하지 않는다', () => {
  test('허용된 테이블만 쓰면 통과', () => {
    assert.deepEqual(findDisallowedTables(
      'SELECT * FROM ktws.FCT_ACTIVITY_v2 A JOIN ktws.DIM_MNG_USER U ON A.sc_key = U.sc_key',
    ), [])
  })

  test('퍼널과 무관한 테이블을 잡는다', () => {
    // 이 화면은 계약퍼널 문서를 만드는 자리다 — 인사·재고를 훑을 이유가 없다.
    assert.deepEqual(findDisallowedTables('SELECT * FROM ktws.FCT_NPS'), ['FCT_NPS'])
  })

  test('다른 스키마도 잡는다', () => {
    assert.deepEqual(findDisallowedTables('SELECT * FROM dbo.User_master'), ['dbo.User_master'])
  })

  test('CTE 이름은 테이블로 오인하지 않는다', () => {
    assert.deepEqual(findDisallowedTables(
      'WITH td AS (SELECT 1) SELECT * FROM td JOIN ktws.FCT_LEAD L ON 1=1',
    ), [])
  })
})

describe('결과 블록', () => {
  const ok = { sql: 'SELECT 1', rows: [{ 채널: 'SC활동', 건수: 10 }], columns: ['채널', '건수'], truncated: 0, elapsedMs: 120 }

  test('실행한 SQL을 값과 함께 넣는다 — 대조할 정답이 없어 근거는 SQL뿐이다', () => {
    const block = buildRuleQueryBlock(ok)
    assert.match(block, /실행한 SQL:\nSELECT 1/)
    assert.match(block, /조회 근거를 함께 적으세요/)
    assert.match(block, /"채널":"SC활동"/)
  })

  test('0행이면 값을 채우지 말라고 한다 — 조회 실패와 구분해서', () => {
    const block = buildRuleQueryBlock({ ...ok, rows: [] })
    assert.match(block, /결과가 0행입니다/)
    assert.match(block, /값을 채우지 말고 그 사실을 적으세요/)
  })

  test('실패하면 시도한 SQL을 보여주고 지어내지 말라고 한다', () => {
    const block = buildRuleQueryBlock({ sql: 'SELECT 1', error: 'Invalid column name', rows: [] })
    assert.match(block, /조회에 실패했습니다 — Invalid column name/)
    assert.match(block, /값을 지어내지 말고/)
  })

  test('잘렸으면 전체 행 수를 알린다', () => {
    assert.match(buildRuleQueryBlock({ ...ok, truncated: 900 }), /전체 900행 중 앞 1행만/)
  })

  test('조회 안 한 턴에는 블록이 없다', () => {
    assert.equal(buildRuleQueryBlock(null), null)
  })
})

describe('스키마 블록', () => {
  const block = buildSchemaBlock()

  test('허용 테이블만 담고 ktws 접두사를 붙인다', () => {
    for (const t of ALLOWED_TABLES) assert.match(block, new RegExp(`ktws\.${t}`))
    assert.ok(!block.includes('FCT_NPS'), '퍼널과 무관한 테이블이 들어갔다')
  })
})

describe('실행 전 금지 규칙 — 조용히 다른 답을 만드는 것들', () => {
  test('요청 없는 TOP은 막는다 — 잘린 결과가 전체인 양 실린다', () => {
    const v = checkSqlRules('SELECT TOP 5 a FROM ktws.FCT_LEAD', '')
    assert.equal(v.length, 1)
    assert.match(v[0], /TOP을 썼습니다/)
  })

  test('사용자가 상위 N개를 요청했으면 TOP을 허용한다', () => {
    assert.deepEqual(checkSqlRules('SELECT TOP 5 a FROM ktws.FCT_LEAD', '계약이 가장 많은 상위 5곳만'), [])
    assert.deepEqual(checkSqlRules('SELECT TOP 3 a FROM ktws.FCT_LEAD', '3개만 보여줘'), [])
  })

  test('OFFSET/FETCH도 같은 자르기라 막는다', () => {
    assert.match(checkSqlRules('SELECT a FROM x ORDER BY a OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY', '')[0], /OFFSET/)
  })

  test('SELECT *를 막는다 — 문서에 실릴 열을 사람이 정해야 한다', () => {
    assert.match(checkSqlRules('SELECT * FROM ktws.FCT_LEAD', '')[0], /SELECT \*/)
    assert.match(checkSqlRules('SELECT A.* FROM ktws.FCT_LEAD A', '')[0], /SELECT \*/)
  })

  test('EXISTS 안의 SELECT *는 관용구라 통과시킨다', () => {
    assert.deepEqual(checkSqlRules('SELECT a FROM x WHERE EXISTS (SELECT * FROM ktws.FCT_LEAD)', ''), [])
  })

  test('날짜 BETWEEN을 막는다 — 끝날의 시간이 붙은 행이 통째로 빠진다', () => {
    const v = checkSqlRules("SELECT a FROM x WHERE d BETWEEN '2026-04-01' AND '2026-04-30'", '')
    assert.match(v[0], /BETWEEN/)
  })

  test('규칙을 지킨 SQL은 통과한다', () => {
    assert.deepEqual(checkSqlRules(
      "SELECT COUNT(*) AS [건수] FROM ktws.FCT_ACTIVITY_v2 WHERE act_dt_fr >= '2026-04-01' AND act_dt_fr < '2026-05-01'", ''), [])
  })

  test('COUNT(*)는 SELECT *가 아니다', () => {
    assert.deepEqual(checkSqlRules('SELECT COUNT(*) AS [건수] FROM ktws.FCT_LEAD', ''), [])
  })
})

describe('값 사전 — 값과 설명을 섞지 않는다', () => {
  // 2026-08-12 실측 회귀: 딜러를 "렉서스 강남(LEXUS)"로 적어 놓고 "이 값을 그대로 쓰라"고 해서
  // 모델이 dealer_nm IN ('렉서스 강남(LEXUS)', …)로 조건을 걸었다. 0행이 나왔는데 오류가
  // 아니라서 "12월엔 계약이 없었나 보다"로 읽혔다.
  test('딜러 이름 뒤에 브랜드를 괄호로 붙이지 않는다', () => {
    // 실제 Fabric 없이도 형식은 검사할 수 있다 — 조회가 실패하면 목록이 비고, 그때도
    // 괄호 붙은 값이 나오면 안 된다.
    const block = buildValuesBlockFrom(
      [{ dealer_nm: '렉서스 강남', BRAND: 'LEXUS' }, { dealer_nm: '토요타 서초', BRAND: 'TOYOTA' }],
      [{ pma_cd: 'Y', pma_type: 'IN' }, { pma_cd: 'etc', pma_type: 'etc' }],
    )
    assert.ok(!/렉서스 강남\(LEXUS\)/.test(block), '값에 브랜드가 괄호로 붙었다')
    assert.match(block, /LEXUS: 렉서스 강남/)
    assert.match(block, /TOYOTA: 토요타 서초/)
  })

  test('코드 컬럼이 Y/N 둘뿐이 아니라고 알린다', () => {
    const block = buildValuesBlockFrom([], [{ pma_cd: 'Y', pma_type: 'IN' }, { pma_cd: 'etc', pma_type: 'etc' }])
    assert.match(block, /'etc'/)
    assert.match(block, /Y\/N 둘뿐이 아닙니다/)
  })

  test('규칙에도 코드 컬럼 주의가 들어 있다', () => {
    assert.match(FUNNEL_SQL_RULES, /Y\/N 둘뿐이라고 가정하지 마세요/)
    assert.match(FUNNEL_SQL_RULES, /21\.6%가 etc/)
  })
})
