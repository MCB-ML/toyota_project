from typing import Any, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Any] = Field(default=None, alias="detail")

    class Config:
        populate_by_name = True

    # end class


# end class


def newErrorResponse(
    code: str, message: str, details: Optional[str] = None
) -> ErrorResponse:
    return ErrorResponse(code=code, message=message, details=details)


# end def

# Common error codes
ERROR_CODE_INTERNAL_SERVER_ERROR = "500"
ERROR_CODE_SYSTEM_DISABLED = "503"
ERROR_CODE_BAD_REQUEST = "400"
ERROR_CODE_UNAUTHORIZED = "401"
ERROR_CODE_FORBIDDEN = "403"
ERROR_CODE_NOT_FOUND = "404"
ERROR_CODE_CONFLICT = "409"
ERROR_CODE_VALIDATION_FAILED = "422"
ERROR_CODE_TOO_MANY_REQUESTS = "429"

# Common error messages
ERROR_MSG_INTERNAL_SERVER_ERROR = "An unexpected error occurred"
ERROR_MSG_SYSTEM_DISABLED = "System is disabled"
ERROR_MSG_BAD_REQUEST = "Invalid request"
ERROR_MSG_UNAUTHORIZED = "Authorization required"
ERROR_MSG_FORBIDDEN = "Access denied"
ERROR_MSG_NOT_FOUND = "Resource not found"
ERROR_MSG_CONFLICT = "Resource conflict"
ERROR_MSG_VALIDATION_FAILED = "Validation failed"
ERROR_MSG_TOO_MANY_REQUESTS = "Maximum attempts exceeded"
