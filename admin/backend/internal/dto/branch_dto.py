from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict

# Request DTOs


class BranchConfigurationCreateRequest(BaseModel):
    id: Optional[int] = None
    branchId: Optional[Union[str, UUID]] = None
    configType: Optional[str] = None
    agentType: Optional[str] = None
    endpoint: Optional[str] = None
    db: Optional[str] = None
    user: Optional[str] = None
    port: Optional[int] = None
    password: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class BranchCreateRequestFormData(BaseModel):
    payload: str
    branchLogo: UploadFile | str | None = None
    bgImg: UploadFile | str | None = None
    model_config = ConfigDict(arbitrary_types_allowed=True)


class BranchCreateRequest(BaseModel):
    branchName: str
    companyId: UUID
    branchType: Optional[str] = None
    branchLocation: Optional[str] = None
    branchAllowUserAccess: Optional[bool] = False
    dataAgentBotName: Optional[str] = None
    dataAgentWelcomeprompt: Optional[str] = None
    branchLogo: Optional[UploadFile | str] = None
    bgImg: Optional[UploadFile | str] = None
    # branchConfiguration: Optional[List[BranchConfigurationCreateRequest]] = None
    isActive: Optional[bool] = False
    isDefault: Optional[bool] = False


# end class


class BranchUpdateRequest(BranchCreateRequest):
    branchId: Union[str, UUID]


class BranchUpdateActiveRequest(BaseModel):
    companyId: Union[str, UUID]
    branchId: Union[str, UUID]
    isActive: bool


# end class


class BranchUpdateAllowUserAccessRequest(BaseModel):
    companyId: Union[str, UUID]
    branchId: Union[str, UUID]
    allowUserAccess: bool


# Response DTOs
class BranchResponse(BaseModel):
    branchId: Union[str, UUID]
    branchName: str
    companyId: Union[str, UUID]
    branchType: Optional[str] = None
    branchLocation: Optional[str] = None
    branchAllowUserAccess: Optional[bool] = False
    branchLogo: Optional[bytes] = None
    bgImg: Optional[bytes] = None
    bgImgStr: Optional[str] = None
    branchLogoImg: Optional[str] = None
    dataAgentBotName: Optional[str] = None
    dataAgentWelcomeprompt: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    isActive: Optional[bool] = False
    isDefault: Optional[bool] = False

    class Config:
        from_attributes = True

    # end class


class BranchResponseById(BaseModel):
    branchId: Union[str, UUID]
    branchName: str
    companyId: Union[str, UUID]
    branchType: Optional[str] = None
    branchLocation: Optional[str] = None
    branchAllowUserAccess: Optional[bool] = False
    branchLogo: Optional[bytes] = None
    branchLogoImg: Optional[str] = None
    bgImg: Optional[bytes] = None
    bgImgStr: Optional[str] = None
    dataAgentBotName: Optional[str] = None
    dataAgentWelcomeprompt: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    isActive: Optional[bool] = False
    isDefault: Optional[bool] = False
    # branchConfiguration: list[BranchConfigurationCreateRequest] = Field(
    #     alias="branchConfigurations"
    # )

    class Config:
        from_attributes = True


# end class


class BranchListResponse(BaseModel):
    branches: List[BranchResponse]
    total: int


# end class


class BranchDeleteResponse(BaseModel):
    branchId: str
    message: str


# end class
