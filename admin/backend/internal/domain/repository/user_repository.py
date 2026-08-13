from abc import ABC, abstractmethod
from typing import List, Optional

from internal.domain.entities.user import User


class UserRepository(ABC):
    @abstractmethod
    async def createUser(self, user: User, workspaceIds: List[str]) -> None:
        """Create a new user"""
        pass

    # end def

    @abstractmethod
    async def getUserById(self, userId: str) -> Optional[User]:
        """Get user by ID"""
        pass

    # end def

    @abstractmethod
    async def getUserByEmail(self, email: str) -> Optional[User]:
        """Get user by email"""
        pass

    # end def

    @abstractmethod
    async def getUserLoginByEmail(self, email: str) -> Optional[User]:
        """Get user Login by email"""
        pass

    # end def
    
    @abstractmethod
    async def getUserCompanyContext(self, userId: str) -> dict:
        """Get dashboard company/scope context for a user"""
        pass

    # end def

    @abstractmethod
    async def checkUser(self, mode:str,id: str) -> Optional[User]:
        """Check user Login by email"""
        pass

    @abstractmethod
    async def getAllUsers(self) -> List[User]:
        """Get all users"""
        pass

    # end def

    @abstractmethod
    async def updateUser(
        self,
        user: User,
        workspaceIds: Optional[List[str]] = None,
        changePassword: Optional[str] = None,
    ) -> None:
        """Update user"""
        pass

    @abstractmethod
    async def updatePassword(self, userId: str, newPassword: str) -> None:
        """Update user password"""
        pass

    # end def

    @abstractmethod
    async def deleteUser(self, userId: str) -> None:
        """Soft delete user"""
        pass

    # end def

    @abstractmethod
    async def UserAssignmentsInsert(self, userId: str, workspaceIds) -> None:
        """Insert assignemnet"""
        pass

    # end def


# end class


