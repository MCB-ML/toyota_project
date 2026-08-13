from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from sqlalchemy.orm import selectinload

from internal.domain.entities.company import Company
from internal.domain.entities.company_model_deployment import CompanyInfoModelDeployment
from internal.domain.entities.user import User
from internal.domain.repository.company_repository import CompanyRepository
from internal.dto.company_dto import CompanyUpdateRequest
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.interfaces.repository.base.base_repository import BaseRepository

CACHE_KEY_ALL_COMPANIES = "companies:all"
CACHE_TTL_SECONDS = 300


class CompanyRepositoryImpl(CompanyRepository):
    """딜러사 저장소.

    Branch / Workspace / Dataset / Connection 은 스키마에서 제거되었다.
    딜러사가 갖는 것은 사용자와 용도별 모델 지정뿐이다.
    """

    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache
        self.comp_repo = BaseRepository(Company, dbEngine)
        self.comp_deployment_repo = BaseRepository(CompanyInfoModelDeployment, dbEngine)
        self.user_repo = BaseRepository(User, dbEngine)

    # end def

    async def _invalidateCache(self):
        await self.cache.delete(CACHE_KEY_ALL_COMPANIES)

    async def createCompany(self, company: Company):
        exists = await self.comp_repo.check(
            where_conditions=[Company.companyName == company.companyName]
        )

        if exists:
            raise ValueError("companyName already used!")

        await self.comp_repo.insert(company)

        await self._invalidateCache()

    # end def

    async def updateCompany(self, req: CompanyUpdateRequest):
        dt = datetime.now(ZoneInfo("Asia/Seoul"))

        async with AsyncSession(self.dbEngine) as session:
            async with session.begin():
                rows = await self.comp_repo.get(
                    where_condition=[Company.companyId == req.companyId],
                    custom_session=session,
                )

                if not rows:
                    raise ValueError("Company not found")

                company = rows[0]

                company.companyName = req.companyName
                company.description = req.description

                if req.isActive is not None:
                    company.isActive = req.isActive

                company.updatedAt = dt

                # 용도별 모델 지정을 통째로 다시 쓴다.
                # 화면은 용도 6칸을 항상 그리지만 고르지 않은 칸은 보내지 않으므로,
                # 지운 지정이 DB 에 남지 않도록 삭제 후 재삽입한다.
                await self.comp_deployment_repo.delete(
                    where_conditions=[
                        CompanyInfoModelDeployment.companyId == req.companyId
                    ],
                    custom_session=session,
                )

                for dep in req.deployments or []:
                    if not dep.modelId:
                        continue

                    await self.comp_deployment_repo.insert(
                        CompanyInfoModelDeployment(
                            companyId=req.companyId,
                            agentType=dep.agentType,
                            modelId=dep.modelId,
                            createdAt=dt,
                        ),
                        custom_session=session,
                    )

                # 시스템 프롬프트는 전역이 되어 Company 에서 분리되었다.
                # /api/v1/systemPrompt/* 로 별도 관리한다.

        await self._invalidateCache()

    # end def

    async def deleteCompany(self, companyId: str) -> None:
        """소프트 삭제.

        소속 사용자가 있으면 거부한다. User_master.default_company 가
        ON DELETE RESTRICT 라 물리 삭제도 어차피 막히는데,
        그 시점에 나오는 DB 오류보다 여기서 알려주는 편이 낫다.
        """
        hasUser = await self.user_repo.check(
            where_conditions=[User.defaultCompany == companyId]
        )

        if hasUser:
            raise ValueError("이 딜러사에 속한 사용자가 있어 삭제할 수 없습니다.")

        await self.comp_repo.update(
            where_conditions=[Company.companyId == companyId],
            values={"deletedAt": datetime.now(ZoneInfo("Asia/Seoul"))},
        )

        await self._invalidateCache()

    # end def

    async def getCompanyById(self, companyId: str) -> Optional[Company]:
        result = await self.comp_repo.get(
            where_condition=[Company.companyId == companyId],
            # 접속 키(credentials)는 제거되었다. 남겨두면 AttributeError 가 난다.
            include=[selectinload(Company.deployments)],
        )

        return result[0] if result else None

    # end def

    async def getCompanies(self) -> List[Company]:
        cached = await self.cache.get(CACHE_KEY_ALL_COMPANIES)

        if cached is not None:
            return cached

        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                select(Company).where(Company.deletedAt.is_(None))
            )
            companies = result.scalars().all()

            await self.cache.set(CACHE_KEY_ALL_COMPANIES, companies, CACHE_TTL_SECONDS)

            return companies

    # end def

    async def getCompanyByName(self, name: str) -> Optional[Company]:
        companies = await self.getCompanies()

        for c in companies:
            if c.companyName == name:
                return c

        return None

    # end def


def newCompanyRepository(
    dbEngine: AsyncEngine, cache: AsyncCache
) -> CompanyRepository:
    return CompanyRepositoryImpl(dbEngine, cache)
