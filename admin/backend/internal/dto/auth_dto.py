from typing import Any, Dict, Optional

from pydantic import BaseModel


class MicrosoftLoginRequest(BaseModel):
    accessToken: str


class TeamsLoginRequest(BaseModel):
    token: str


class CredentialLoginRequest(BaseModel):
    email: str
    password: str


# end class


class AuthResponse(BaseModel):
    token: Optional[str] = None
    user: Dict[str, Any]
    defaultCompany: Optional[str] = None
    defaultCompanyName: Optional[str] = None
    scopeKey: Optional[str] = None
    defaultLanguage: Optional[str] = None


# end class
