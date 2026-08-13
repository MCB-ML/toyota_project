# 공개본 안내

이 저장소는 사내 저장소의 **정리된 스냅샷**입니다. 원본의 커밋 히스토리는 포함하지
않습니다 — 과거 커밋에 아래 항목들이 남아 있어, 히스토리를 그대로 올리면 정리가
의미를 잃기 때문입니다.

## 제거한 것

- 내부 DB 정의서 (`docs/정의서/`, `docs/DB정의서_*.md`, `docs/schema-prompt.md`)
- 스키마 정의서 스프레드시트 (`service/backend/schema/*.xlsx`)
- 배포용 복제본 (`service/deploy/`) — `service/backend`·`service/frontend`와 내용이 겹칩니다

## 자리만 남긴 것

값을 지우고 자리를 남겼습니다. 로직은 그대로라 코드를 읽는 데 지장이 없고,
실제로 돌리려면 아래를 채워야 합니다.

| 자리 | 무엇 |
|---|---|
| `EXCLUDED_USER_ID`, `EXCLUDED_USER_ID_1,EXCLUDED_USER_ID_2` | 집계에서 제외하는 계정 ID 목록 |
| `REPLACE_ME.datawarehouse.fabric.microsoft.com` | Fabric 웨어하우스 엔드포인트 |
| `REPLACE_ME@example.com` | 웨어하우스 접속 계정 |
| `00000000-0000-0000-0000-0000000000xx` | 테넌트 · Azure 구독 · Power BI 리포트 · 조직 식별자 |

`service/backend/reports/sql/*.sql`의 제외 계정 목록이 여기 해당합니다. 값을 채우지
않으면 쿼리는 실행되지만 **제외 규칙이 걸리지 않아 집계값이 원본과 달라집니다.**

계약(`service/backend/reports/contracts/*.yaml`)의 `sql_sha256`은 정리된 SQL 기준으로
다시 계산해 넣었습니다 — 22개 전부 일치합니다.

## 설정

`.env.example`을 `.env`로 복사해 채우면 됩니다. `.env`는 원본에서도 저장소에
올라간 적이 없습니다.
