from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Provider = Literal["bedrock", "azure_openai", "openai", "vertex"]
ModelKind = Literal["llm", "embedding"]


class ModelCreateRequest(BaseModel):
    """모델 스펙. 전 딜러사가 공유한다."""

    displayName: str = Field(..., min_length=1, max_length=100)
    provider: Provider = "bedrock"
    modelKind: ModelKind = "llm"
    # provider 별 호출 식별자. bedrock 예: anthropic.claude-sonnet-4-5-20250929-v1:0
    modelId: str = Field(..., min_length=1, max_length=200)
    apiVersion: Optional[str] = None
    maxToken: Optional[int] = None
    # 0.7 같은 소수를 담아야 한다. int 로 받으면 잘린다.
    temperature: Optional[Decimal] = None
    topP: Optional[Decimal] = None
    topK: Optional[int] = None
    reasoningEffort: Optional[str] = None
    embeddingModel: Optional[str] = None
    isActive: Optional[bool] = True


class ModelUpdateRequest(ModelCreateRequest):
    id: Union[str, UUID]


class ModelResponse(BaseModel):
    id: Union[str, UUID]
    displayName: str
    provider: str
    modelKind: str
    modelId: str
    apiVersion: Optional[str] = None
    maxToken: Optional[int] = None
    temperature: Optional[Decimal] = None
    topP: Optional[Decimal] = None
    topK: Optional[int] = None
    reasoningEffort: Optional[str] = None
    embeddingModel: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
