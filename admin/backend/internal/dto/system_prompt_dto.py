from datetime import datetime
from typing import Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# 프롬프트 카테고리 3종
PromptCategory = Literal["semantic", "ontology", "metrics"]
PROMPT_CATEGORIES = ("semantic", "ontology", "metrics")

PromptFileType = Literal["yaml", "md"]


class SystemPromptCreateRequest(BaseModel):
    category: PromptCategory
    name: str = Field(..., min_length=1, max_length=200)
    fileName: Optional[str] = None
    fileType: PromptFileType = "yaml"
    value: str = Field(..., min_length=1)


class SystemPromptUpdateRequest(BaseModel):
    id: Union[str, UUID]
    # 카테고리 이동은 허용하지 않는다. 이름/내용만 수정한다.
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    fileName: Optional[str] = None
    fileType: Optional[PromptFileType] = None
    value: Optional[str] = None
    isActive: Optional[bool] = None


class SystemPromptResponse(BaseModel):
    id: Union[str, UUID]
    category: str
    name: str
    fileName: Optional[str] = None
    fileType: str = "yaml"
    value: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
