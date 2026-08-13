from abc import ABC, abstractmethod

from internal.dto.system_prompt_dto import (
    SystemPromptCreateRequest,
    SystemPromptUpdateRequest,
)


class SystemPromptRepository(ABC):
    @abstractmethod
    async def getAll(self) -> None:
        """전체 프롬프트 조회 (카테고리 · 이름 순)"""
        pass

    @abstractmethod
    async def getById(self, id: str) -> None:
        """단건 조회. 본문 편집용"""
        pass

    @abstractmethod
    async def create(self, req: SystemPromptCreateRequest) -> None:
        """새 프롬프트 등록"""
        pass

    @abstractmethod
    async def update(self, req: SystemPromptUpdateRequest) -> None:
        """이름/본문 수정"""
        pass

    @abstractmethod
    async def delete(self, id: str) -> None:
        """삭제"""
        pass
