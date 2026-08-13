from abc import ABC, abstractmethod
from typing import List, Optional

from internal.domain.entities.workspace import Workspace


class WorkspaceRepository(ABC):
    @abstractmethod
    async def createWorkspace(self, workspace: Workspace) -> None:
        """Create a new workspace."""
        pass

    # end def

    @abstractmethod
    async def updateWorkspace(self, workspace: Workspace) -> None:
        """Update an existing workspace."""
        pass

    # end def

    @abstractmethod
    async def deleteWorkspace(self, workspaceId: str) -> None:
        """Soft delete a workspace by ID."""
        pass

    # end def

    @abstractmethod
    async def getWorkspaceById(self, workspaceId: str) -> Optional[Workspace]:
        """Get a workspace by ID."""
        pass

    # end def

    @abstractmethod
    async def getWorkspaces(self) -> List[Workspace]:
        """Get all workspaces."""
        pass

    @abstractmethod
    async def getWorkspaceByBranchId(self, branchId: str) -> List[Workspace]:
        """Get workspaces by branch ID."""
        pass

    # end def

    @abstractmethod
    async def getWorkspaceByNameAndBranch(
        self, name: str, branchId: str
    ) -> Optional[Workspace]:
        """Get a workspace by name and branch ID."""
        pass

    # end def

    @abstractmethod
    async def getWorkspaceUserAccess(self, id: str):
        """Get a workspace user access"""
        pass


# end def
# end class
