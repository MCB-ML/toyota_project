from abc import ABC, abstractmethod

from internal.dto.model_dto import ModelCreateRequest, ModelUpdateRequest


class ModelRepository(ABC):
    """모델 스펙 카탈로그 (전역)"""

    @abstractmethod
    async def getAll(self) -> None:
        pass

    @abstractmethod
    async def getById(self, id: str) -> None:
        pass

    @abstractmethod
    async def create(self, req: ModelCreateRequest) -> None:
        pass

    @abstractmethod
    async def update(self, req: ModelUpdateRequest) -> None:
        pass

    @abstractmethod
    async def delete(self, id: str) -> None:
        pass


# ModelCredentialRepository 는 제거되었다.
# 접속 키를 딜러사마다 발급해도 청구서가 갈라지지 않는다.
# 사용량은 TokenUsage_log 로 집계한다. token_usage_repository.py 참고.
