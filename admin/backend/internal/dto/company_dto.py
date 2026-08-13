from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CompanyDeployment(BaseModel):
    """딜러사 x 용도 -> 모델.

    deploymentType(dataagent/aiagent) 은 제거되었다. 파라미터는 한 갈래만 쓴다.
    접속 키도 제거되었다. 사용량 분리는 TokenUsage_log 가 맡는다.
    """

    id: Optional[Union[str, UUID]] = None
    companyId: Optional[str] = None
    agentType: str
    modelId: Optional[Union[str, UUID]] = None


class CompanyConnection(BaseModel):
    id: Optional[Union[str, UUID]] = None
    agentType: str
    companyId: Optional[str] = None
    database: Optional[str] = None
    endpoint: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None
    port: Optional[int] = None
    configType: Optional[str] = 'dataagent'
    isActive: Optional[bool] = False
    sourceList:Optional[list] = None

# SystemPromptResponse 제거: 프롬프트는 전역이 되어 Company 페이로드에서 빠졌다.
# system_prompt_dto.py 참고.


class CompanyCreateRequest(BaseModel):
    companyName: str
    description: Optional[str] = None
    isActive: Optional[bool] = True
    deployments: Optional[List[CompanyDeployment]] = None


class CompanyUpdateRequest(CompanyCreateRequest):
    companyId: UUID


# Response DTOs
class CompanyResponse(BaseModel):
    companyId: Union[str, UUID]
    companyName: str
    description: Optional[str] = None
    isActive: Optional[bool] = True
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
    # end class


# end class


# class CompanyResponseRelation(CompanyResponse):
#     azureDeployments: List[AzureDeploymentResponse] = []
#     aiagentazureDeployments: List[AzureDeploymentResponse] = []
#     systemPrompts: List[SystemPromptResponse] = []


class CompanyListResponse(BaseModel):
    companies: List[CompanyResponse]
    total: int


# end class


class CompanyDeleteResponse(BaseModel):
    companyId: str
    message: str


class DeleteCompanyRequest(BaseModel):
    id: UUID

class CompanyConnectionCreateRequest(BaseModel):
    id: Optional[Union[str, UUID]] = None
    endpoint: str
    database:str
    user:str
    password:str
    port: Optional[int] = None
    agentType:str
    configType:str
    table: Optional[str] = None
    companyId: Optional[str] = None