from typing import Any

from internal.domain.repository.model_repository import ModelRepository
from internal.dto.model_dto import ModelCreateRequest, ModelUpdateRequest
from internal.helper.response_api import ResponseApi
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext


class ModelHandler:
    def __init__(self, repo: ModelRepository, mainLib: Any):
        self.repo = repo
        self.mainLib = mainLib

    async def getAll(self, hc: HandlerContext):
        resp = ResponseApi()
        await resp.validate_with_result(self.repo.getAll)
        return resp.get_result()

    async def getById(self, hc: HandlerContext):
        resp = ResponseApi()
        await resp.validate_with_result(self.repo.getById, hc.getPathParams().get("id"))
        return resp.get_result()

    async def create(self, hc: HandlerContext):
        resp = ResponseApi()
        req = await hc.readBody(ModelCreateRequest)
        await resp.validate(self.repo.create, req)
        return resp.get_result()

    async def update(self, hc: HandlerContext):
        resp = ResponseApi()
        req = await hc.readBody(ModelUpdateRequest)
        await resp.validate(self.repo.update, req)
        return resp.get_result()

    async def delete(self, hc: HandlerContext):
        resp = ResponseApi()
        await resp.validate(self.repo.delete, hc.getPathParams().get("id"))
        return resp.get_result()


def newModelHandler(repo: ModelRepository, mainLib: Any) -> ModelHandler:
    return ModelHandler(repo, mainLib)
