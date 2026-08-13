from abc import ABC, abstractmethod
from typing import List, Optional

from internal.domain.entities.branch import Branch
from internal.dto.branch_dto import BranchUpdateRequest


class BranchRepository(ABC):
    @abstractmethod
    async def createBranch(self, branch: Branch) -> None:
        """Create a new branch."""
        pass

    # end def

    @abstractmethod
    async def updateBranch(self, branch: BranchUpdateRequest) -> None:
        """Update an existing branch."""
        pass

    # end def

    @abstractmethod
    async def updateActiveBranch(self, branch: BranchUpdateRequest) -> None:
        """Update an existing branch."""
        pass

    @abstractmethod
    async def updateDefaultBranch(self, branch: BranchUpdateRequest) -> None:
        """Update an existing branch."""
        pass

    @abstractmethod
    async def deleteBranch(self, branchId: str) -> None:
        """Soft delete a branch by ID."""
        pass

    # end def

    @abstractmethod
    async def getBranchByCompanyId(self, companyId: str) -> List[Branch]:
        """Get all branches."""
        pass

    # end def
    @abstractmethod
    async def getBranchById(self, branchId: str) -> Optional[Branch]:
        """Get a branch by ID."""
        pass

    # end def

    @abstractmethod
    async def getBranches(self) -> List[Branch]:
        """Get all branches."""
        pass

    # end def

    @abstractmethod
    async def getBranchByNameAndCompany(
        self, name: str, companyId: str
    ) -> Optional[Branch]:
        """Get a branch by name and company ID."""
        pass

    # end def


# end class
