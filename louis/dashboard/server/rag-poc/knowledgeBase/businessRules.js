// Pure domain-rule definitions — a rule describes WHAT the business means, not how any
// one fragment implements it. Multiple sql_fragments can enforce the same rule with
// different concrete SQL (see frag_qualified_lead_full vs frag_qualified_lead_key).

export const businessRules = [
  {
    rule_id: 'br_active_staff', term: '재직 SC만 포함', priority: 10,
    description: '활동/영업기회/계약 실적을 집계할 때는 기본적으로 현재 재직 중인 SC만 포함한다. 퇴사자를 포함하려면 사용자가 명시적으로 요청해야 한다.',
    condition_expression: "D.active_yn = '재직'",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['active_yn'],
  },
  {
    rule_id: 'br_exclude_front_sc', term: '창구SC 제외', priority: 10,
    description: '창구SC(facade_sc_yn=\'창구SC\')는 실적 집계 대상에서 제외한다. 목록형 쿼리에서는 facade_sc_yn이 NULL인 행도 유지해야 하므로 "<> \'창구SC\' OR IS NULL" 형태로 쓴다.',
    condition_expression: "D.facade_sc_yn <> '창구SC'",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['facade_sc_yn'],
  },
  {
    rule_id: 'br_exclude_staff_names', term: '특정 조직 제외', priority: 10,
    description: "'고객지원팀', 'TOYOTA YM' 소속은 실적 집계 대상에서 제외한다.",
    condition_expression: "D.name NOT IN ('고객지원팀', 'TOYOTA YM')",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['name'],
  },
  {
    rule_id: 'br_exclude_test_users', term: '테스트/특수 계정 제외', priority: 10,
    description: '특정 user_id 6개(테스트/관리용 계정으로 추정)는 실적 집계 대상에서 제외한다. 일부 목록형 GOLD 쿼리는 이 조건을 생략하기도 하니 원본 소스를 우선한다.',
    condition_expression: "D.user_id NOT IN ('DM5103', 'DM9999', 'JB30016', 'KMKS176', 'KMKS999', 'JB30067')",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['user_id'],
  },
  {
    rule_id: 'br_activity_type_scope', term: '활동유형 대분류 제한', priority: 9,
    description: 'CRM 활동/목표 집계는 활동유형 대분류가 관계형성 또는 기회창출인 것만 포함한다. 원본 CRM_ACT 코드(P101 등)를 직접 나열하지 말고 이 조건으로 표현한다.',
    condition_expression: "tp_grp_1 IN ('관계형성', '기회창출')",
    related_tables: ['KPI_W::DIM_CRM_ACT_TYPE', 'KPI_W::DIM_CRM_ACT_TYPE_ORDER'], related_columns: ['tp_grp_1'],
  },
  {
    rule_id: 'br_qualified_lead_def', term: '자격 리드(qualified lead) 정의', priority: 8,
    description: '영업기회(리드)가 "이번달 실적/전환율" 계산에 포함되려면 (a) 리드가 열려있거나(close_dt가 기준일 이후 또는 NULL) 판매로 이어졌고(last_retail_sales_dt가 NOT NULL), (b) 관계형성/기회창출 대분류 + 부재중이 아닌 활동이 실제로 연결돼 있어야 한다. 계약 건수 계산도 이 정의를 통과한 리드에 연결된 계약만 인정한다.',
    condition_expression: "(close_dt > :기준일 OR close_dt IS NULL OR last_retail_sales_dt IS NOT NULL) AND EXISTS(관계형성/기회창출 대분류 + act_result <> '부재중' 활동)",
    related_tables: ['KPI_W::FCT_LEAD', 'KPI_W::FCT_ACTIVITY_v2'], related_columns: ['close_dt', 'last_retail_sales_dt', 'act_result'],
  },
  {
    rule_id: 'br_dealer_scope', term: '대상 딜러 한정', priority: 5,
    description: '사용자가 딜러/지점을 지정하면 DIM_MNG_DEALER.dealer_nm으로 좁힌다. dealer_id보다 dealer_nm 매칭이 자연어 질문엔 더 안전하다(GOLD 쿼리 중 dealer_id를 쓰는 것도 있으나 값이 특정 예시용 상수라 재사용성이 낮음).',
    condition_expression: "E.dealer_nm = :dealer",
    related_tables: ['KPI_W::DIM_MNG_DEALER'], related_columns: ['dealer_nm'],
  },
  {
    rule_id: 'br_contract_target_scope', term: '계약 목표 필터', priority: 9,
    description: "계약 목표는 활동유형 대분류(tp_grp_1)가 아니라 DIM_CRM_ACT_TYPE.common_tp_nm = '계약'인 것만 센다 — 영업기회 목표(br_activity_type_scope 사용)와 필터 대상 컬럼 자체가 다르므로 혼동하지 말 것.",
    condition_expression: "t.common_tp_nm = '계약'",
    related_tables: ['KPI_W::DIM_CRM_ACT_TYPE'], related_columns: ['common_tp_nm'],
  },
  {
    rule_id: 'br_yearmonth_scope', term: '조회 연월 필터', priority: 5,
    description: '사용자가 언급한 연월로 기간을 제한한다. DIM_CALENDAR_KTWS.YearMonth(등호 비교) 또는 Year+MonthNumber(두 컬럼 비교) 중 원본 GOLD 패턴이 쓰는 형태를 그대로 따른다 — 임의로 통일하지 않는다.',
    condition_expression: "C.YearMonth = :yearMonth",
    related_tables: ['KPI_W::DIM_CALENDAR_KTWS'], related_columns: ['YearMonth', 'Year', 'MonthNumber'],
  },
  {
    rule_id: 'br_active_yn_string_values', term: 'active_yn은 Y/N이 아니라 재직/퇴사 문자열', priority: 3,
    description: "DIM_MNG_USER.active_yn은 boolean스러운 'Y'/'N'이 아니라 한글 문자열 '재직'/'퇴사'다 — 실측으로 검증된 반복 실수 포인트이므로 SQL 생성 시 항상 이 값으로 비교할 것.",
    condition_expression: "active_yn IN ('재직', '퇴사')",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['active_yn'],
  },
  {
    rule_id: 'br_org_drilldown_scope', term: '조직 드릴다운(브랜드/그룹/부서) 한정', priority: 4,
    description: '딜러 한정(br_dealer_scope)보다 더 좁혀서 브랜드/전시장(group_name)/부서(dept_nm) 단위까지 지정하는 GOLD 쿼리가 있다(1-1시트 시승/coalesce 계열). 사용자가 이 단위까지 명시한 경우에만 적용 — 언급 안 하면 필터 자체를 걸지 않는다(딜러 레벨까지만).',
    condition_expression: "D.BRAND = :brand AND D.group_name = :group_name AND D.dept_nm = :dept_nm",
    related_tables: ['KPI_W::DIM_MNG_USER'], related_columns: ['BRAND', 'group_name', 'dept_nm'],
  },
  {
    rule_id: 'br_testdrive_completion_def', term: '시승 완료/취소 판정 기준', priority: 6,
    description: "시승(test-drive) 활동은 FCT_ACTIVITY_v2.act_tp = 'P113'로 식별한다. '시승완료'는 act_result = '시승완료', '시승취소 제외'는 act_result <> '시승취소'(NULL 허용)로 판정 — act_result 문자열 그대로 비교하며 별도 코드 매핑 테이블 없음.",
    condition_expression: "ACT.act_tp = 'P113' AND ACT.act_result = '시승완료'",
    related_tables: ['KPI_W::FCT_ACTIVITY_v2'], related_columns: ['act_tp', 'act_result'],
  },
  {
    rule_id: 'br_working_day_def', term: '근무일(영업일) 정의', priority: 5,
    description: "근무일은 DIM_CALENDAR_KTWS.kr_holiday = '0'인 날짜(공휴일이 아닌 날)다. '진행 근무일수'는 그중 오늘(GETDATE()) 이전인 것만, '총 근무일수'는 해당 연/월 전체 근무일이며, '근무일 진행률'은 진행÷총(분모 0이면 0)이다 — 오늘 날짜에 의존하므로 쿼리 실행 시점마다 달라진다.",
    condition_expression: "c.kr_holiday = '0'",
    related_tables: ['KPI_W::DIM_CALENDAR_KTWS'], related_columns: ['kr_holiday', 'Date'],
  },
  {
    rule_id: 'br_closed_in_month_scope', term: '이번달 클로즈(종결) 리드 한정', priority: 8,
    description: '리드 여정(상담→시승→계약→출고) 칩보드/퍼널은 FCT_LEAD.closed_in_mon = \'Y\'인 리드, 즉 이번달에 클로즈(종결) 처리된 리드만 대상으로 한다 — 슬라이서가 아니라 이 두 쿼리의 정의 자체라 사용자가 다르게 요청하지 않는 한 항상 적용한다.',
    condition_expression: "l.closed_in_mon = 'Y'",
    related_tables: ['KPI_W::FCT_LEAD'], related_columns: ['closed_in_mon'],
  },
]
