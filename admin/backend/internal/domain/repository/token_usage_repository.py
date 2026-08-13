from abc import ABC, abstractmethod

from internal.dto.token_usage_dto import TokenUsageCreateRequest, TokenUsageQuery


class TokenUsageRepository(ABC):
    """토큰 사용량. 쓰는 쪽은 에이전트, 읽는 쪽은 어드민 리포트."""

    @abstractmethod
    async def log(self, req: TokenUsageCreateRequest) -> None:
        pass

    @abstractmethod
    async def summary(self, query: TokenUsageQuery) -> None:
        pass

    @abstractmethod
    async def detail(self, query: TokenUsageQuery, limit: int, offset: int) -> None:
        pass
