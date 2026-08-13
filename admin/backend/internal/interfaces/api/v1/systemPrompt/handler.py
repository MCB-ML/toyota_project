from typing import Any

from internal.domain.repository.system_prompt_repository import SystemPromptRepository
from internal.dto.system_prompt_dto import (
    SystemPromptCreateRequest,
    SystemPromptUpdateRequest,
)
from internal.helper.response_api import ResponseApi
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext


class SystemPromptHandler:
    def __init__(self, repo: SystemPromptRepository, mainLib: Any):
        self.repo = repo
        self.mainLib = mainLib

    async def getAll(self, hc: HandlerContext):
        resp = ResponseApi()

        await resp.validate_with_result(self.repo.getAll)

        return resp.get_result()

    async def getById(self, hc: HandlerContext):
        resp = ResponseApi()

        params = hc.getPathParams()

        await resp.validate_with_result(self.repo.getById, params.get("id"))

        return resp.get_result()

    async def create(self, hc: HandlerContext):
        resp = ResponseApi()

        req = await hc.readBody(SystemPromptCreateRequest)

        await resp.validate(self.repo.create, req)

        return resp.get_result()

    async def update(self, hc: HandlerContext):
        resp = ResponseApi()

        req = await hc.readBody(SystemPromptUpdateRequest)

        await resp.validate(self.repo.update, req)

        return resp.get_result()

    async def delete(self, hc: HandlerContext):
        resp = ResponseApi()

        params = hc.getPathParams()

        await resp.validate(self.repo.delete, params.get("id"))

        return resp.get_result()


def newSystemPromptHandler(
    repo: SystemPromptRepository, mainLib: Any
) -> SystemPromptHandler:
    return SystemPromptHandler(repo, mainLib)
