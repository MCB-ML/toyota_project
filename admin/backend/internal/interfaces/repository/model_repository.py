from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.company_model_deployment import CompanyInfoModelDeployment
from internal.domain.entities.model_master import ModelMaster
from internal.domain.repository.model_repository import ModelRepository
from internal.dto.model_dto import ModelCreateRequest, ModelUpdateRequest
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.interfaces.repository.base.base_repository import BaseRepository


def _now():
    return datetime.now(ZoneInfo("Asia/Seoul"))


class ModelRepositoryImpl(ModelRepository):
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache
        self.model = BaseRepository(ModelMaster, dbEngine)
        self.deployment = BaseRepository(CompanyInfoModelDeployment, dbEngine)

    async def getAll(self) -> Optional[List[ModelMaster]]:
        return await self.model.get()

    async def getById(self, id: str) -> Optional[ModelMaster]:
        res = await self.model.get(where_condition=[ModelMaster.id == id])
        return res[0] if res else None

    async def create(self, req: ModelCreateRequest) -> None:
        exists = await self.model.check(
            where_conditions=[ModelMaster.displayName == req.displayName]
        )

        if exists:
            raise ValueError(f"'{req.displayName}' 은(는) 이미 등록된 이름입니다.")

        await self.model.insert(
            ModelMaster(
                displayName=req.displayName,
                provider=req.provider,
                modelKind=req.modelKind,
                modelId=req.modelId,
                apiVersion=req.apiVersion,
                maxToken=req.maxToken,
                temperature=req.temperature,
                topP=req.topP,
                topK=req.topK,
                reasoningEffort=req.reasoningEffort,
                embeddingModel=req.embeddingModel,
                isActive=req.isActive if req.isActive is not None else True,
                createdAt=_now(),
            )
        )

    async def update(self, req: ModelUpdateRequest) -> None:
        async with AsyncSession(self.dbEngine) as session:
            async with session.begin():
                duplicated = await self.model.check(
                    where_conditions=[
                        ModelMaster.displayName == req.displayName,
                        ModelMaster.id != req.id,
                    ],
                    custom_session=session,
                )

                if duplicated:
                    raise ValueError(f"'{req.displayName}' 은(는) 이미 등록된 이름입니다.")

                rows = await self.model.get(
                    where_condition=[ModelMaster.id == req.id], custom_session=session
                )

                if not rows:
                    raise ValueError("모델을 찾을 수 없습니다.")

                model = rows[0]

                for field in (
                    "displayName",
                    "provider",
                    "modelKind",
                    "modelId",
                    "apiVersion",
                    "maxToken",
                    "temperature",
                    "topP",
                    "topK",
                    "reasoningEffort",
                    "embeddingModel",
                    "isActive",
                ):
                    value = getattr(req, field, None)
                    if value is not None:
                        setattr(model, field, value)

                model.updatedAt = _now()

    async def delete(self, id: str) -> None:
        # 딜러사가 쓰고 있는 모델을 지우면 그 딜러사의 에이전트가 멈춘다
        inUse = await self.deployment.check(
            where_conditions=[CompanyInfoModelDeployment.modelId == id]
        )

        if inUse:
            raise ValueError("이 모델을 사용 중인 딜러사가 있어 삭제할 수 없습니다.")

        await self.model.delete(where_conditions=[ModelMaster.id == id])


def newModelRepository(dbEngine: AsyncEngine, cache: AsyncCache) -> ModelRepository:
    return ModelRepositoryImpl(dbEngine, cache)
