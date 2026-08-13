from datetime import date, datetime
from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TokenUsageCreateRequest(BaseModel):
    """에이전트가 호출 한 건을 마치고 남기는 로그.

    어드민 화면에서 쓰지 않는다. 에이전트 백엔드가 호출한다.
    """

    companyId: Union[str, UUID]
    # 로그인 계정의 이메일. 없으면 배치·시스템 호출로 본다.
    userEmail: Optional[str] = Field(None, max_length=255)
    # 어느 대화를 처리하다 쓴 토큰인가. 이상한 숫자를 역추적할 때 쓴다.
    sessionId: Optional[Union[str, UUID]] = None
    messageId: Optional[Union[str, UUID]] = None
    # 용도: main | sql | sql_2 | rag | powerbi | chart
    agentType: Optional[str] = Field(None, max_length=20)
    modelId: Optional[Union[str, UUID]] = None
    inputTokens: int = Field(0, ge=0)
    outputTokens: int = Field(0, ge=0)
    latencyMs: Optional[int] = Field(None, ge=0)
    succeeded: bool = True
    errorMessage: Optional[str] = None


class TokenUsageQuery(BaseModel):
    """리포트 조회 조건. 모두 선택이고, 없으면 전체 기간 · 전체 딜러사."""

    # 포함 경계. 종료일은 그날 23:59:59 까지 센다.
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    companyId: Optional[Union[str, UUID]] = None
    agentType: Optional[str] = None
    userEmail: Optional[str] = None


class TokenUsageSummaryRow(BaseModel):
    """딜러사 한 곳의 집계 한 줄."""

    companyId: Union[str, UUID]
    companyName: str
    requestCount: int = 0
    failedCount: int = 0
    inputTokens: int = 0
    outputTokens: int = 0
    totalTokens: int = 0
    avgLatencyMs: Optional[int] = None
    lastUsedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenUsageUserRow(BaseModel):
    """딜러사 안에서 이메일 한 개의 집계 한 줄.

    이메일이 없으면 '(시스템)' 으로 묶는다. 배치·시스템 호출이 사람 사용량에
    섞여 들어가면 딜러사별 비교가 어긋난다.
    """

    companyId: Union[str, UUID]
    userEmail: str
    requestCount: int = 0
    failedCount: int = 0
    inputTokens: int = 0
    outputTokens: int = 0
    totalTokens: int = 0
    avgLatencyMs: Optional[int] = None
    lastUsedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenUsageDailyRow(BaseModel):
    """날짜 x 딜러사 추이 한 줄. 화면의 꺾은선용."""

    usageDate: date
    companyId: Union[str, UUID]
    companyName: str
    requestCount: int = 0
    totalTokens: int = 0

    model_config = ConfigDict(from_attributes=True)


class TokenUsageSummaryResponse(BaseModel):
    rows: List[TokenUsageSummaryRow]
    # 딜러사 안에서 다시 이메일로 나눈 것. 화면은 딜러사 행을 펼쳐 이 목록을 보여준다.
    users: List[TokenUsageUserRow]
    daily: List[TokenUsageDailyRow]
    # 합계는 프론트에서 더해도 되지만, 필터가 걸린 상태의 총합을
    # 화면 상단에 바로 띄우려면 서버가 주는 편이 어긋날 일이 없다.
    totalRequestCount: int = 0
    totalTokens: int = 0


class TokenUsageDetailRow(BaseModel):
    """원본 로그 한 줄. 이상한 숫자를 파고들 때만 본다."""

    id: int
    companyId: Union[str, UUID]
    companyName: Optional[str] = None
    userEmail: Optional[str] = None
    agentType: Optional[str] = None
    modelName: Optional[str] = None
    inputTokens: int = 0
    outputTokens: int = 0
    totalTokens: int = 0
    latencyMs: Optional[int] = None
    succeeded: bool = True
    errorMessage: Optional[str] = None
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenUsageDetailResponse(BaseModel):
    logs: List[TokenUsageDetailRow]
    total: int
