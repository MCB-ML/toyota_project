from abc import ABC, abstractmethod
from typing import List, Optional

from internal.domain.entities.company import Company
from internal.dto.company_dto import CompanyUpdateRequest


class CompanyRepository(ABC):
    @abstractmethod
    def createCompany(self, company: Company) -> Company:
        """Create a new company."""
        pass

    # end def

    @abstractmethod
    def updateCompany(self, company: CompanyUpdateRequest) -> Company:
        """Update an existing company."""
        pass

    # end def

    @abstractmethod
    def deleteCompany(self, companyId: str) -> None:
        """Soft delete a company by ID."""
        pass

    # end def

    @abstractmethod
    def getCompanyById(self, companyId: str) -> Optional[Company]:
        """Get a company by ID."""
        pass

    # end def

    @abstractmethod
    def getCompanies(self) -> List[Company]:
        """Get all companies."""
        pass

    # end def

    @abstractmethod
    def getCompanyByName(self, name: str) -> Optional[Company]:
        """Get a company by name."""
        pass

    # end def

    # 데이터 소스 연결(addConnection / GetConnection / DeleteConnection /
    # setConnectionStatus / connectDb / getTop10Data) 은 제거되었다.
    # 어드민은 PostgreSQL 만 보고, 딜러사 데이터 원본(Fabric) 연결은
    # 에이전트 백엔드가 담당한다.


# end class
