from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.system_prompt import SystemPrompt
from internal.domain.repository.system_prompt_repository import SystemPromptRepository
from internal.dto.system_prompt_dto import (
    SystemPromptCreateRequest,
    SystemPromptUpdateRequest,
)
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.interfaces.repository.base.base_repository import BaseRepository

CACHE_KEY_ALL_PROMPTS = "system_prompts:all"


class SystemPromptRepositoryImpl(SystemPromptRepository):
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache
        self.systemPrompt = BaseRepository(SystemPrompt, dbEngine)

    async def getAll(self) -> Optional[List[SystemPrompt]]:
        rows = await self.systemPrompt.get()

        # 카테고리 -> 이름 순으로 정렬해 화면이 그대로 그릴 수 있게 한다
        return sorted(rows or [], key=lambda r: (r.category or "", r.name or ""))

    async def getById(self, id: str) -> Optional[SystemPrompt]:
        rows = await self.systemPrompt.get(where_condition=[SystemPrompt.id == id])

        return rows[0] if rows else None

    async def create(self, req: SystemPromptCreateRequest) -> None:
        exists = await self.systemPrompt.check(
            where_conditions=[
                SystemPrompt.category == req.category,
                SystemPrompt.name == req.name,
            ]
        )

        if exists:
            raise ValueError(f"'{req.name}' 은(는) 이미 등록된 이름입니다.")

        dt = datetime.now(ZoneInfo("Asia/Seoul"))

        await self.systemPrompt.insert(
            SystemPrompt(
                category=req.category,
                name=req.name,
                fileName=req.fileName,
                fileType=req.fileType,
                value=req.value,
                isActive=True,
                createdAt=dt,
            )
        )

        await self.cache.delete(CACHE_KEY_ALL_PROMPTS)

    async def update(self, req: SystemPromptUpdateRequest) -> None:
        async with AsyncSession(self.dbEngine) as session:
            async with session.begin():
                rows = await self.systemPrompt.get(
                    where_condition=[SystemPrompt.id == req.id],
                    custom_session=session,
                )

                if not rows:
                    raise ValueError("프롬프트를 찾을 수 없습니다.")

                prompt = rows[0]

                # 이름을 바꾸는 경우 같은 카테고리 안에서 중복인지 확인한다
                if req.name is not None and req.name != prompt.name:
                    duplicated = await self.systemPrompt.check(
                        where_conditions=[
                            SystemPrompt.category == prompt.category,
                            SystemPrompt.name == req.name,
                            SystemPrompt.id != req.id,
                        ],
                        custom_session=session,
                    )

                    if duplicated:
                        raise ValueError(f"'{req.name}' 은(는) 이미 등록된 이름입니다.")

                    prompt.name = req.name

                if req.fileName is not None:
                    prompt.fileName = req.fileName

                if req.fileType is not None:
                    prompt.fileType = req.fileType

                if req.value is not None:
                    prompt.value = req.value

                if req.isActive is not None:
                    prompt.isActive = req.isActive

                prompt.updatedAt = datetime.now(ZoneInfo("Asia/Seoul"))

        await self.cache.delete(CACHE_KEY_ALL_PROMPTS)

    async def delete(self, id: str) -> None:
        exists = await self.systemPrompt.check(where_conditions=[SystemPrompt.id == id])

        if not exists:
            raise ValueError("프롬프트를 찾을 수 없습니다.")

        await self.systemPrompt.delete(where_conditions=[SystemPrompt.id == id])

        await self.cache.delete(CACHE_KEY_ALL_PROMPTS)


def newSystemPromptRepository(
    dbEngine: AsyncEngine, cache: AsyncCache
) -> SystemPromptRepository:
    return SystemPromptRepositoryImpl(dbEngine, cache)
