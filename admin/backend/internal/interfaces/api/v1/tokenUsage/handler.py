from typing import Any

from internal.domain.repository.token_usage_repository import TokenUsageRepository
from internal.dto.token_usage_dto import TokenUsageCreateRequest, TokenUsageQuery
from internal.helper.response_api import ResponseApi
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext


def _toInt(value: str, fallback: int) -> int:
    """쿼리스트링은 문자열이라 그대로 넘기면 limit 비교에서 터진다."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


class TokenUsageHandler:
    def __init__(self, repo: TokenUsageRepository, mainLib: Any):
        self.repo = repo
        self.mainLib = mainLib

    async def log(self, hc: HandlerContext):
        """에이전트 백엔드가 호출한다. 어드민 화면에서는 쓰지 않는다."""
        resp = ResponseApi()
        req = await hc.readBody(TokenUsageCreateRequest)
        await resp.validate(self.repo.log, req)
        return resp.get_result()

    async def summary(self, hc: HandlerContext):
        """딜러사별 사용량 집계 + 날짜별 추이."""
        resp = ResponseApi()
        query = await hc.readBody(TokenUsageQuery)
        await resp.validate_with_result(self.repo.summary, query)
        return resp.get_result()

    async def detail(self, hc: HandlerContext):
        """원본 로그. 집계 숫자가 이상할 때 파고드는 용도."""
        resp = ResponseApi()
        query = await hc.readBody(TokenUsageQuery)

        limit = _toInt(hc.getQueryParam("limit"), 100)
        offset = _toInt(hc.getQueryParam("offset"), 0)

        await resp.validate_with_result(self.repo.detail, query, limit, offset)
        return resp.get_result()


def newTokenUsageHandler(repo: TokenUsageRepository, mainLib: Any) -> TokenUsageHandler:
    return TokenUsageHandler(repo, mainLib)
