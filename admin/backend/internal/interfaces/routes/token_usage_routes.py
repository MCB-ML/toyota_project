from internal.dto.token_usage_dto import TokenUsageCreateRequest, TokenUsageQuery
from internal.infrastructure.httpserver.router.router import Router


def tokenUsageRoutes(router: Router, handler):
    """토큰 사용량.

    /log 는 에이전트 백엔드가, 나머지는 어드민 사용량 화면이 쓴다.
    조회를 POST 로 둔 이유는 기간 · 딜러사 · 용도가 함께 오는 조건 묶음이라
    쿼리스트링에 늘어놓는 것보다 본문 스키마로 받는 편이 검증이 붙기 때문이다.
    """
    prefix = router.pathPrefix("/tokenUsage")

    prefix.post(
        "/log",
        handler.log,
        body=TokenUsageCreateRequest,
        summary="Log Token Usage",
        description="에이전트 호출 한 건의 사용량을 기록한다. 실패한 호출도 남긴다",
        tags=["Token Usage"],
    )
    prefix.post(
        "/summary",
        handler.summary,
        body=TokenUsageQuery,
        summary="Usage Summary",
        description="딜러사별 합계와 날짜별 추이. 조건이 비면 전체 기간·전체 딜러사",
        tags=["Token Usage"],
    )
    prefix.post(
        "/detail",
        handler.detail,
        body=TokenUsageQuery,
        summary="Usage Detail Logs",
        description="원본 로그. limit / offset 은 쿼리스트링으로 받는다 (기본 100, 최대 500)",
        tags=["Token Usage"],
    )

    router.includeRouter(prefix)


# end def
