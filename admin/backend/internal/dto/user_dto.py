from typing import List, Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

# 사용자 권한 3종. 각 권한의 허용 범위는 에이전트 백엔드가 판단한다.
UserRole = Literal["admin", "user", "viewer"]


# Request DTOs
class UserCreateRequest(BaseModel):
    userName: str = Field(..., min_length=1, max_length=255)
    userEmail: EmailStr
    userPassword: str = Field(..., min_length=6)
    # 워크스페이스 개념 제거로 빈 배열이 정상이다. (구: min_items=1 필수)
    workspaceIds: List[str] = Field(default_factory=list, description="사용하지 않음")
    userRole: UserRole = "user"
    userAccess: Optional[str] = None
    userDepartment: Optional[str] = None
    # 사용자는 딜러사 1곳에 반드시 소속된다.
    defaultCompany: Union[str, UUID]
    defaultLanguage: Optional[str] = None
    mode: Optional[str] = None


# end class


class UserUpdateRequest(BaseModel):
    userName: Optional[str] = Field(None, min_length=1, max_length=255)
    userEmail: Optional[EmailStr] = None
    userRole: Optional[UserRole] = None
    userAccess: Optional[str] = None
    userDepartment: Optional[str] = None
    userChangePassword: Optional[str] = None
    workspaceIds: Optional[List[str]] = None
    defaultCompany: Optional[Union[str, UUID]] = None
    defaultLanguage: Optional[str] = None


# end class


class UserUpdatePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str = Field(..., min_length=6)


# end class


# Response DTOs
class UserWorkspaceResponse(BaseModel):
    workspaceId: str
    workspaceName: str


# end class


class UserResponse(BaseModel):
    userId: Union[str, UUID]
    userName: str
    userEmail: str
    workspaces: List[UserWorkspaceResponse] = Field(default_factory=list)
    userRole: Optional[str] = None
    userAccess: Optional[str] = None
    userDepartment: Optional[str] = None
    userDepartment: Optional[str] = None
    defaultCompany: Optional[Union[str, UUID]] = None
    defaultLanguage: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

    # end class


# end class


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


# end class


class UserDeleteResponse(BaseModel):
    userId: str
    message: str


# end class
