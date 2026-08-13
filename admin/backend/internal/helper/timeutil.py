"""시각 헬퍼.

DB 컬럼은 전부 timestamptz 다. 여기에 시간대 없는(naive) 값을 넣으면
PostgreSQL 이 그것을 "세션 시간대의 시각" 으로 해석한다.
세션 시간대가 Asia/Seoul 이므로 datetime.utcnow() 를 그대로 넣으면
UTC 시각이 KST 로 읽혀 저장 순간 9시간이 밀린다.

    datetime.utcnow()   -> 2026-08-04 02:18 (시간대 없음)
    DB 가 KST 로 해석    -> 2026-08-04 02:18 +09:00
    실제 저장(UTC)      -> 2026-08-03 17:18   <- 하루 전으로 보인다

그래서 DB 에 넣는 시각은 반드시 시간대를 붙인 값이어야 한다.
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")


def nowUtc() -> datetime:
    """DB 에 넣을 현재 시각. 시간대가 붙어 있다.

    저장은 UTC 로 하고, 보여줄 때 KST 로 바꾼다.
    어느 시간대로 넣든 timestamptz 는 같은 순간을 가리키지만,
    UTC 로 통일해두면 로그와 DB 를 나란히 볼 때 헷갈리지 않는다.
    """
    return datetime.now(timezone.utc)


def nowKst() -> datetime:
    """화면·로그용 현재 시각(KST). 저장에는 nowUtc() 를 쓴다."""
    return datetime.now(KST)
