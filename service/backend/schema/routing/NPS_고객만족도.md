# NPS_고객만족도 쿼리 규칙

## 테이블
`FCT_NPS`(nps_seq 단위)가 기준 테이블이다. 담당 SC명은 `DIM_MNG_USER`, 날짜 그룹핑은 `DIM_CALENDAR_KTWS`(reply_date 기준).

## 예시
```sql
-- 사업부문별 이번달 평균 NPS 점수
SELECT biz_area, AVG(promoter_score) AS avg_score, COUNT(*) AS response_cnt
FROM FCT_NPS
WHERE reply_date >= '2026-04-01' AND reply_date < '2026-05-01'
GROUP BY biz_area

-- SC별 NPS 점수와 고객 코멘트
SELECT u.name AS sc_name, n.promoter_score, n.cust_comment, n.reply_date
FROM FCT_NPS n
JOIN DIM_MNG_USER u ON u.sc_key = n.sc_key
ORDER BY n.reply_date DESC
```
