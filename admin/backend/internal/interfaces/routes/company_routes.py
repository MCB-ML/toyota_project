from internal.dto.company_dto import CompanyCreateRequest, CompanyUpdateRequest
from internal.infrastructure.httpserver.router.router import Router
from internal.interfaces.api.v1.companies.handler import CompanyHandler


def companyRoutes(router: Router, handler: CompanyHandler):
    """딜러사 CRUD.

    Connection / Dataset / Fabric 라우트는 제거했다.
    데이터 소스 연결은 에이전트 백엔드가 담당하며 어드민은 PostgreSQL 만 본다.
    """
    companyPrefix = router.pathPrefix("/companies")

    companyPrefix.get(
        "/getAll",
        handler.getCompanies,
        summary="Get All Companies",
        description="딜러사 목록",
        tags=["Company"],
    )

    companyPrefix.get(
        "/getById/{id}",
        handler.getCompanyById,
        summary="Get Company By Id",
        description="딜러사 상세 (용도별 모델 지정 포함)",
        tags=["Company"],
    )

    companyPrefix.post(
        "/insert",
        handler.createCompany,
        body=CompanyCreateRequest,
        summary="Create Company",
        tags=["Company"],
    )

    companyPrefix.put(
        "/update",
        handler.updateCompany,
        body=CompanyUpdateRequest,
        summary="Update Company",
        tags=["Company"],
    )

    companyPrefix.delete(
        "/deleteById/{id}",
        handler.deleteCompany,
        summary="Delete Company",
        description="소프트 삭제",
        tags=["Company"],
    )

    router.includeRouter(companyPrefix)


# end def
