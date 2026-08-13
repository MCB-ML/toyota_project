# 해피보드_HOT고객 쿼리 규칙

## 테이블
`FCT_HBOARD_MEETING` 하나가 기준 테이블이다(meet_seq + lead_id 단위 — 미팅 하나에 여러 HOT 고객 칩이 딸린다). 담당 SC명은 `DIM_MNG_USER`, 관심 차종명은 `DIM_VEHIC_SPEC_VAR`, 날짜 그룹핑은 `DIM_CALENDAR_KTWS`.

## 핵심 규칙
- "미팅 건수"는 `COUNT(DISTINCT meet_seq)`, "HOT 고객(칩) 건수"는 `COUNT(*)`(meet_seq+lead_id 단위) — 둘을 혼동하지 말 것.
- 종료된 건은 `close_yn = 'Y'`로 필터한다.
- `contract_ratio`(계약확률)는 문자열 컬럼이므로 정렬/비교 전 실제 값 형식(퍼센트 문자열인지 숫자인지)을 확인할 것.

## 예시
```sql
-- 담당 SC별 이번달 해피보드 HOT 고객 건수
SELECT u.name AS sc_name, COUNT(*) AS hot_cnt
FROM FCT_HBOARD_MEETING h
JOIN DIM_MNG_USER u ON u.sc_key = h.mng_sc_key
WHERE h.meet_dt >= '2026-04-01' AND h.meet_dt < '2026-05-01'
GROUP BY u.name
ORDER BY hot_cnt DESC

-- 관심 차종별 HOT 고객 상태 분포
SELECT v.variant_nm, h.chip_status_nm, COUNT(*) AS cnt
FROM FCT_HBOARD_MEETING h
JOIN DIM_VEHIC_SPEC_VAR v ON v.var_key = h.int_var_key
GROUP BY v.variant_nm, h.chip_status_nm
```
