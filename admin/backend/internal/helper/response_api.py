import asyncio
from collections.abc import Callable
from typing import Any, Generic, Type, TypeVar

from fastapi.encoders import jsonable_encoder
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class ResponseApi(Generic[T]):
    def __init__(self, response_model: Type[T] | None = None):
        self.response_model = response_model
        self.success: bool = True
        self.message: str = ""
        self.result: Any = None
        self.statusCode: int = 200
        self.headers = {"Content-Type": "application/json"}

    async def _execute(self, fn: Callable, *args, **kwargs):
        if asyncio.iscoroutinefunction(fn):
            return await fn(*args, **kwargs)
        return fn(*args, **kwargs)

    def _serialize(self, data: Any):
        """DTO -> JSON 으로 바로 실을 수 있는 값.

        model_dump(mode="json") 인 이유:
            기본(python) 모드는 UUID·datetime 을 객체 그대로 둔다.
            asyncpg 는 uuid 컬럼을 pgproto.UUID 로 돌려주는데,
            이것이 그대로 ORJSONResponse 에 들어가면
            "Type is not JSON serializable: asyncpg.pgproto.pgproto.UUID" 로 죽는다.
            uuid.UUID 의 하위형이지만 orjson 은 정확한 타입만 안다.
        """
        if self.response_model is None:
            return jsonable_encoder(data)

        if isinstance(data, list):
            return [
                self.response_model.model_validate(item).model_dump(mode="json")
                for item in data
            ]

        if data is None:
            return None

        return self.response_model.model_validate(data).model_dump(mode="json")

    async def validate_with_result(self, fn: Callable, *args, **kwargs):
        try:
            data = await self._execute(fn, *args, **kwargs)
            self.result = self._serialize(data)
        except Exception as e:
            self._handle_error(e)

    async def validate(self, fn: Callable, *args, **kwargs):
        try:
            await self._execute(fn, *args, **kwargs)
            self.result = None
            self.message = "Success"
        except Exception as e:
            self._handle_error(e)

    def _handle_error(self, e: Exception):
        self.success = False
        self.statusCode = 500
        self.message = str(e)
        self.result = None

    def get_result(self, custom_res: any = None):
        if custom_res:
            self.result = custom_res

        return ORJSONResponse(
            content={
                "success": self.success,
                "result": self.result,
                "message": self.message,
            },
            status_code=self.statusCode,
            headers=self.headers,
        )

    def error(self, message: str):
        return ORJSONResponse(
            content={"success": False, "result": None, "message": message},
            status_code=self.statusCode,
            headers=self.headers,
        )

    def get_result_paging(self):
        total = len(self.result) if isinstance(self.result, list) else 0
        return ORJSONResponse(
            content={
                "success": self.success,
                "result": self.result,
                "message": self.message,
                "total": total,
            },
            status_code=self.statusCode,
            headers=self.headers,
        )
