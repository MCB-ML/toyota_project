// 딜러 계약퍼널 — 활동유형 → 채널/카테고리 매핑 (요구사항정의서 3-1).
//
// 이 파일은 KTWS Agentic BI와 **별개 규칙**이다. 같은 Fabric 활동 로그를 읽지만
// 집계 정의가 다르다(예: 계약을 Gross로 본다). 두 쪽 지표를 섞어 쓰면 안 된다.
//
// ── 매핑 키를 tp_nm 으로 잡은 이유 (중요) ────────────────────────────────
// tp_grp_1(관계형성/기회창출/기회진행/연락)으로 매핑하면 **틀린다**.
// 2026-08-10 실측(2026-01~07, 32.3만 건):
//
//   관계형성-생일 연락          tp_grp_1 = 연락       → 정의서는 관계형성활동
//   관계형성-출고 기념일 연락     tp_grp_1 = 연락       → 정의서는 관계형성활동
//   기회창출-관계형성 소개       tp_grp_1 = 기회창출    → 정의서는 관계형성활동 (SC활동 아님)
//
// 정의서가 "관계형성소개는 SC활동이 아니다 — 초기 설계 오류가 있었던 부분이므로 특히
// 주의"라고 적은 함정이 실제로는 세 갈래다. tp_nm 값이 정의서 표기와 그대로 일치하므로
// 그걸 키로 쓴다.
// ────────────────────────────────────────────────────────────────

export const CHANNEL = {
  RELATIONSHIP: '관계형성활동',
  SC: 'SC활동',
  WALK_IN: '내방/내전',
  ONLINE: '온라인유입',
}

export const CATEGORY = {
  EXISTING: '기존고객',
  NEW: '신규유입',
}

/**
 * tp_nm → {channel, category}. 정의서 3-1 표를 그대로 옮겼다.
 *
 * 여기 없는 활동유형은 "기회진행"으로 별도 처리한다(정의서 3-1 각주, 3-6).
 * 임의로 채널을 부여하지 않는다 — 잘못 넣으면 채널 합계가 조용히 부풀려진다.
 */
export const CHANNEL_MAP = {
  '관계형성-자사출고': { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING },
  '관계형성-타사출고': { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING },
  '관계형성-생일 연락': { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING },
  '관계형성-출고 기념일 연락': { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING },
  '기회창출-관계형성 소개': { channel: CHANNEL.RELATIONSHIP, category: CATEGORY.EXISTING },

  '기회창출-잠재고객': { channel: CHANNEL.SC, category: CATEGORY.EXISTING },
  '기회창출-판촉(개인/팀/회사)': { channel: CHANNEL.SC, category: CATEGORY.EXISTING },

  '기회창출-내방상담': { channel: CHANNEL.WALK_IN, category: CATEGORY.NEW },
  '기회창출-내전상담': { channel: CHANNEL.WALK_IN, category: CATEGORY.NEW },

  '기회창출-온라인 유입(시승신청)': { channel: CHANNEL.ONLINE, category: CATEGORY.NEW },
  '기회창출-온라인 유입(상담신청)': { channel: CHANNEL.ONLINE, category: CATEGORY.NEW },
}

/** 채널 표시 순서. 대시보드 축 순서가 실행마다 흔들리지 않게 고정한다. */
export const CHANNEL_ORDER = [CHANNEL.RELATIONSHIP, CHANNEL.SC, CHANNEL.WALK_IN, CHANNEL.ONLINE]

/**
 * 기회진행 유형 — 채널 매핑 대상이 아니다.
 * 시승결과는 3-4 시승 파이프라인의 입력이고, 나머지는 3-5 규칙으로 처리한다.
 */
export const PROGRESS_TYPES = new Set([
  '기회진행-시승결과',
  '기회진행-시승예약',
  '기회진행-신차상담',
  '기회진행-견적',
])

/** 3-4 시승 파이프라인의 입력이 되는 활동유형. */
export const TESTDRIVE_SOURCE_TYPE = '기회진행-시승결과'

/**
 * 활동유형 하나를 분류한다.
 *
 * @returns {{channel: string, category: string}}                 채널 매핑 대상
 *        | {progress: true, testdrive: boolean}                  기회진행(별도 처리)
 *        | {unknown: true}                                       둘 다 아님 — 새 값이 생긴 것
 *
 * unknown은 삼키지 않는다. 데이터에 없던 활동유형이 추가되면 채널 합계에서 조용히
 * 빠지므로, 호출부가 반드시 드러내야 한다(정의서 3-5의 정합성 등식이 깨진다).
 */
export function classifyActivityType(tpNm) {
  const key = String(tpNm ?? '').trim()
  const hit = CHANNEL_MAP[key]
  if (hit) return hit
  if (PROGRESS_TYPES.has(key)) return { progress: true, testdrive: key === TESTDRIVE_SOURCE_TYPE }
  return { unknown: true }
}
