from internal.dto.system_prompt_dto import (
    SystemPromptCreateRequest,
    SystemPromptUpdateRequest,
)
from internal.infrastructure.httpserver.router.router import Router


def systemPromptRoutes(router: Router, handler):
    promptPrefix = router.pathPrefix("/systemPrompt")

    promptPrefix.get(
        "/getAll",
        handler.getAll,
        summary="Get All System Prompts",
        description="전역 프롬프트 전체 조회 (카테고리 · 이름 순)",
        tags=["System Prompt"],
    )

    promptPrefix.get(
        "/getById/{id}",
        handler.getById,
        summary="Get System Prompt By Id",
        description="프롬프트 단건 조회",
        tags=["System Prompt"],
    )

    promptPrefix.post(
        "/create",
        handler.create,
        body=SystemPromptCreateRequest,
        summary="Create System Prompt",
        description="카테고리(semantic/ontology/metrics)에 프롬프트 파일 추가",
        tags=["System Prompt"],
    )

    promptPrefix.put(
        "/update",
        handler.update,
        body=SystemPromptUpdateRequest,
        summary="Update System Prompt",
        description="프롬프트 이름/본문 수정",
        tags=["System Prompt"],
    )

    promptPrefix.delete(
        "/delete/{id}",
        handler.delete,
        summary="Delete System Prompt",
        description="프롬프트 삭제",
        tags=["System Prompt"],
    )

    router.includeRouter(promptPrefix)


# end def
