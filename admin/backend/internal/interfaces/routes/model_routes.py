from internal.dto.model_dto import ModelCreateRequest, ModelUpdateRequest
from internal.infrastructure.httpserver.router.router import Router


def modelRoutes(router: Router, handler):
    """모델 스펙 카탈로그 (전역). 구 /azureDeployment 를 개명했다."""
    prefix = router.pathPrefix("/model")

    prefix.get("/getAll", handler.getAll, summary="Get All Models", tags=["Model"])
    prefix.get("/getById/{id}", handler.getById, summary="Get Model By Id", tags=["Model"])
    prefix.post(
        "/create", handler.create, body=ModelCreateRequest, summary="Create Model", tags=["Model"]
    )
    prefix.put(
        "/update", handler.update, body=ModelUpdateRequest, summary="Update Model", tags=["Model"]
    )
    prefix.delete("/delete/{id}", handler.delete, summary="Delete Model", tags=["Model"])

    router.includeRouter(prefix)


# end def
