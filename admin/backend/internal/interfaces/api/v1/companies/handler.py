from datetime import datetime
from zoneinfo import ZoneInfo

from internal.domain.entities.company import Company
from internal.domain.entities.company_model_deployment import CompanyInfoModelDeployment
from internal.domain.repository.company_repository import CompanyRepository
from internal.dto.company_dto import (
    CompanyCreateRequest,
    CompanyResponse,
    CompanyUpdateRequest,
)
from internal.helper.response_api import ResponseApi
from internal.infrastructure.httpserver.handler.handler_context import HandlerContext

LOG_TAG_COMPANY_HANDLER = "OSHdCmpy"
printDebugErrorCompanyHandler = True


def _isoOrNone(dt):
    """시각을 ISO-8601(시간대 포함) 문자열로.

    strftime("%Y-%m-%d %H:%M:%S") 은 시간대를 버린다.
    그러면 화면의 new Date(...) 가 그 값을 현지 시각(KST)으로 읽어
    UTC 로 저장된 시각이 9시간 앞당겨져 보인다. 하루가 밀리기도 한다.
    """
    return dt.isoformat() if dt else None

class CompanyHandler:
    def __init__(self, repo: CompanyRepository, mainLib):
        self.repo = repo
        self.mainLib = mainLib

    # end def

    def _companyToResponse(self, company: Company) -> CompanyResponse:
        """Convert company entity to company response DTO"""
        return CompanyResponse(
            companyId=company.companyId,
            companyName=company.companyName,
            description=company.description,
            isActive=company.isActive,
            createdAt=_isoOrNone(company.createdAt) or "",
            updatedAt=_isoOrNone(company.updatedAt),
        )

    # end def

    async def createCompany(self, hc: HandlerContext):
        """Create a new company"""

        # Read and validate request body
        req = await hc.readBody(CompanyCreateRequest)

        resp = ResponseApi()

        dt = datetime.now(ZoneInfo("Asia/Seoul"))

        company = Company(
            companyName=req.companyName,
            description=req.description,
            isActive=req.isActive if req.isActive is not None else True,
            createdAt=dt,
        )

        # company.aiagentazureDeployments.append(
        #     AIAgentAzureDeployment(
        #         agentType="ai-agent",
        #         azureEndpoint=req.azureEndpoint_aiagent_deployment,
        #         azureApiKey=req.azureApiKey_aiagent_deployment,
        #         azureDeployment=req.azureDeployment_aiagent_deployment,
        #         azureVersion=req.azureVersion_aiagent_deployment,
        #         azureMaxToken=req.azureMaxToken_aiagent_deployment,
        #         azureTopK=req.azureTopK_aiagent_deployment,
        #         azureTemperature=req.azureTemperature_aiagent_deployment,
        #         azureReasoning=req.azureReasoning_aiagent_deployment,
        #     )
        # )

        # 모델을 고르지 않은 용도는 저장하지 않는다.
        # model_id 가 NOT NULL 이라 빈 값이면 제약에 걸린다.
        for dep in req.deployments or []:
            if not dep.modelId:
                continue

            company.deployments.append(
                CompanyInfoModelDeployment(
                    agentType=dep.agentType,
                    modelId=dep.modelId,
                    createdAt=dt,
                )
            )

        # 시스템 프롬프트는 전역이라 딜러사 생성 시 만들지 않는다.
        # System Prompt 메뉴에서 /api/v1/systemPrompt/update 로 별도 관리한다.

        await resp.validate(self.repo.createCompany, company)

        return resp.get_result()

    async def getCompanyById(self, hc: HandlerContext):
        """Get company by ID"""
        params = hc.getPathParams()

        companyId = params.get("id")

        resp = ResponseApi()

        await resp.validate_with_result(self.repo.getCompanyById, companyId)

        return resp.get_result()
        # end try

    # end def

    async def getCompanies(self, hc: HandlerContext):
        resp = ResponseApi(CompanyResponse)

        await resp.validate_with_result(self.repo.getCompanies)

        return resp.get_result_paging()

        # end try

    # end def

    async def updateCompany(self, hc: HandlerContext):
        """Update company"""
        resp = ResponseApi()
        req = await hc.readBody(CompanyUpdateRequest)
        await resp.validate(self.repo.updateCompany, req)

        return resp.get_result()

    # end def

    async def deleteCompany(self, hc: HandlerContext):
        """Soft delete company"""
        params = hc.getPathParams()
        companyId = params.get("id")
        resp = ResponseApi()

        await resp.validate(self.repo.deleteCompany, companyId)

        return resp.get_result()
        # end try

    # end def


# Connection / Dataset / Fabric 핸들러 제거:
# 데이터 소스 연결은 에이전트 백엔드가 담당한다. 어드민은 PostgreSQL 만 본다.


def newCompanyHandler(repo: CompanyRepository, mainLib) -> CompanyHandler:
    return CompanyHandler(repo, mainLib)


# end def
