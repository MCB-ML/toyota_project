from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class ADUserCreateRequest(BaseModel):
    userId: str = Field(..., description="The Object ID from Azure AD")
    userName: str
    userEmail: str
    userRole: Optional[str] = None
    workspaceIds: List[str] = Field(
        ..., min_items=1, description="List of workspace IDs"
    )
    userAccess: Optional[str] = None
    userDepartment: Optional[str] = None
    userDepartment: Optional[str] = None
    defaultCompany: Optional[Union[str, UUID]] = None
    defaultLanguage: Optional[str] = None
    mode: Optional[str] = None


# end class


class ADUserUpdateRequest(BaseModel):
    userName: Optional[str] = None
    userEmail: Optional[str] = None
    userRole: Optional[str] = None
    workspaceIds: Optional[List[str]] = Field(None, min_items=1)
    userAccess: Optional[str] = None
    userDepartment: Optional[str] = None
    userDepartment: Optional[str] = None
    defaultCompany: Optional[Union[str, UUID]] = None
    defaultLanguage: Optional[str] = None


# end class


class ADUserWorkspaceResponse(BaseModel):
    workspaceId: str
    workspaceName: str


# end class


class ADUserResponse(BaseModel):
    userId: str
    userName: str
    userEmail: str
    workspaces: List[ADUserWorkspaceResponse] = Field(default_factory=list)
    userRole: Optional[str]
    userAccess: Optional[str]
    userDepartment: Optional[str]
    userDepartment: Optional[str]
    defaultCompany: Optional[Union[str, UUID]]
    defaultLanguage: Optional[str]
    userAvatar: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str]


# end class


class ADUserListResponse(BaseModel):
    users: List[ADUserResponse]
    total: int


# end class


class GetUserDetailsRequest(BaseModel):
    email: str = Field(..., description="The user's email address")


# end class


class AzureUserDetails(BaseModel):
    id: str
    displayName: Optional[str] = None
    mail: Optional[str] = None
    userPrincipalName: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    businessPhones: Optional[List[str]] = None
    mobilePhone: Optional[str] = None
    officeLocation: Optional[str] = None
    preferredLanguage: Optional[str] = None
    surname: Optional[str] = None
    givenName: Optional[str] = None
    employeeId: Optional[str] = None
    employeeType: Optional[str] = None
    streetAddress: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    companyName: Optional[str] = None
    accountEnabled: Optional[bool] = None
    createdDateTime: Optional[str] = None
    usageLocation: Optional[str] = None
    userType: Optional[str] = None
    unreadMailCount: int
    activeChatCount: int
    avatar: Optional[str] = None


class GetUserDetailsResponse(BaseModel):
    defaultCompany: Optional[Union[str, UUID]] = None
    defaultLanguage: Optional[str] = None
    workspaces: List[ADUserWorkspaceResponse] = Field(default_factory=list)
    details: AzureUserDetails


# end class
