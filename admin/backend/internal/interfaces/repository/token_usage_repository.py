from datetime import datetime, time
from typing import List, Optional, Union
from uuid import UUID

from sqlalchemy import cast, func, literal, select
from sqlalchemy import Date as SqlDate
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.company import Company
from internal.domain.entities.model_master import ModelMaster
from internal.domain.entities.token_usage_log import TokenUsageLog
from internal.domain.repository.token_usage_repository import TokenUsageRepository
from internal.dto.token_usage_dto import (
    TokenUsageCreateRequest,
    TokenUsageDailyRow,
    TokenUsageDetailResponse,
    TokenUsageDetailRow,
    TokenUsageQuery,
    TokenUsageSummaryResponse,
    TokenUsageSummaryRow,
    TokenUsageUserRow,
)
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.interfaces.repository.base.base_repository import BaseRepository
from internal.helper.timeutil import nowUtc

# 로그는 호출 한 건마다 쌓인다. 상세 목록을 통째로 내려보내면 화면이 먼저 죽는다.
MAX_DETAIL_LIMIT = 500

# 이메일이 없는 호출(배치·시스템)을 묶는 이름. 사람 사용량과 섞이면 비교가 어긋난다.
SYSTEM_CALLER = "(시스템)"


def _uuid(value: Optional[Union[str, UUID]]) -> Optional[UUID]:
    """문자열로 온 id 를 UUID 로 바꾼다.

    DTO 가 Union[str, UUID] 라 에이전트가 보낸 JSON 은 문자열로 들어온다.
    uuid 컬럼에 문자열을 그대로 바인딩하면 드라이버 단에서 터진다.
    """
    if value is None or isinstance(value, UUID):
        return value

    value = str(value).strip()
    if not value:
        return None

    return UUID(value)


class TokenUsageRepositoryImpl(TokenUsageRepository):
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache
        self.usage = BaseRepository(TokenUsageLog, dbEngine)

    def _conditions(self, query: TokenUsageQuery) -> List:
        """조회 조건. 비어 있으면 전체."""
        conds = []

        if query.startDate:
            conds.append(
                TokenUsageLog.createdAt >= datetime.combine(query.startDate, time.min)
            )

        if query.endDate:
            # 종료일 당일을 포함해야 한다. 날짜만 비교하면 그날 오전 0시까지만 잡힌다.
            conds.append(
                TokenUsageLog.createdAt <= datetime.combine(query.endDate, time.max)
            )

        if query.companyId:
            conds.append(TokenUsageLog.companyId == _uuid(query.companyId))

        if query.agentType:
            conds.append(TokenUsageLog.agentType == query.agentType)

        if query.userEmail:
            # 저장할 때 소문자로 눕혔으므로 조회도 맞춰야 한다
            conds.append(TokenUsageLog.userEmail == query.userEmail.strip().lower())

        return conds

    async def log(self, req: TokenUsageCreateRequest) -> None:
        """에이전트가 남기는 기록.

        실패한 호출도 남긴다. 실패율이 곧 그 딜러사가 겪는 체감 품질이고,
        실패한 호출도 입력 토큰은 이미 나갔다.
        """
        await self.usage.insert(
            TokenUsageLog(
                companyId=_uuid(req.companyId),
                # 대소문자가 섞여 들어오면 같은 사람이 두 줄로 갈라진다
                userEmail=req.userEmail.strip().lower() if req.userEmail else None,
                sessionId=_uuid(req.sessionId),
                messageId=_uuid(req.messageId),
                agentType=req.agentType,
                modelId=_uuid(req.modelId),
                inputTokens=req.inputTokens,
                outputTokens=req.outputTokens,
                latencyMs=req.latencyMs,
                succeeded=req.succeeded,
                errorMessage=req.errorMessage,
                createdAt=nowUtc(),
            )
        )

    async def summary(self, query: TokenUsageQuery) -> TokenUsageSummaryResponse:
        conds = self._conditions(query)

        totalTokens = TokenUsageLog.inputTokens + TokenUsageLog.outputTokens

        # 딜러사별 합계
        rowsStmt = (
            select(
                Company.companyId,
                Company.companyName,
                func.count(TokenUsageLog.id).label("requestCount"),
                # 실패 건수. filter 절이라 별도 쿼리를 돌 필요가 없다.
                func.count(TokenUsageLog.id)
                .filter(TokenUsageLog.succeeded.is_(False))
                .label("failedCount"),
                func.coalesce(func.sum(TokenUsageLog.inputTokens), 0).label("inputTokens"),
                func.coalesce(func.sum(TokenUsageLog.outputTokens), 0).label(
                    "outputTokens"
                ),
                func.coalesce(func.sum(totalTokens), 0).label("totalTokens"),
                func.avg(TokenUsageLog.latencyMs).label("avgLatencyMs"),
                func.max(TokenUsageLog.createdAt).label("lastUsedAt"),
            )
            .select_from(TokenUsageLog)
            .join(Company, Company.companyId == TokenUsageLog.companyId)
            .where(*conds)
            .group_by(Company.companyId, Company.companyName)
            .order_by(func.coalesce(func.sum(totalTokens), 0).desc())
        )

        # 딜러사 안에서 다시 이메일별로. 화면이 딜러사 행을 펼치면 이 목록이 나온다.
        userEmail = func.coalesce(TokenUsageLog.userEmail, literal(SYSTEM_CALLER)).label(
            "userEmail"
        )

        usersStmt = (
            select(
                TokenUsageLog.companyId,
                userEmail,
                func.count(TokenUsageLog.id).label("requestCount"),
                func.count(TokenUsageLog.id)
                .filter(TokenUsageLog.succeeded.is_(False))
                .label("failedCount"),
                func.coalesce(func.sum(TokenUsageLog.inputTokens), 0).label("inputTokens"),
                func.coalesce(func.sum(TokenUsageLog.outputTokens), 0).label(
                    "outputTokens"
                ),
                func.coalesce(func.sum(totalTokens), 0).label("totalTokens"),
                func.avg(TokenUsageLog.latencyMs).label("avgLatencyMs"),
                func.max(TokenUsageLog.createdAt).label("lastUsedAt"),
            )
            .where(*conds)
            .group_by(TokenUsageLog.companyId, userEmail)
            .order_by(func.coalesce(func.sum(totalTokens), 0).desc())
        )

        # 날짜 x 딜러사 추이
        usageDate = cast(TokenUsageLog.createdAt, SqlDate).label("usageDate")

        dailyStmt = (
            select(
                usageDate,
                Company.companyId,
                Company.companyName,
                func.count(TokenUsageLog.id).label("requestCount"),
                func.coalesce(func.sum(totalTokens), 0).label("totalTokens"),
            )
            .select_from(TokenUsageLog)
            .join(Company, Company.companyId == TokenUsageLog.companyId)
            .where(*conds)
            .group_by(usageDate, Company.companyId, Company.companyName)
            .order_by(usageDate)
        )

        async with AsyncSession(self.dbEngine) as session:
            rowsResult = (await session.execute(rowsStmt)).all()
            usersResult = (await session.execute(usersStmt)).all()
            dailyResult = (await session.execute(dailyStmt)).all()

        rows = [
            TokenUsageSummaryRow(
                companyId=r.companyId,
                companyName=r.companyName,
                requestCount=r.requestCount,
                failedCount=r.failedCount,
                inputTokens=r.inputTokens,
                outputTokens=r.outputTokens,
                totalTokens=r.totalTokens,
                # 평균 응답 시간은 소수점을 보여줄 이유가 없다
                avgLatencyMs=int(r.avgLatencyMs) if r.avgLatencyMs is not None else None,
                lastUsedAt=r.lastUsedAt,
            )
            for r in rowsResult
        ]

        users = [
            TokenUsageUserRow(
                companyId=u.companyId,
                userEmail=u.userEmail,
                requestCount=u.requestCount,
                failedCount=u.failedCount,
                inputTokens=u.inputTokens,
                outputTokens=u.outputTokens,
                totalTokens=u.totalTokens,
                avgLatencyMs=int(u.avgLatencyMs) if u.avgLatencyMs is not None else None,
                lastUsedAt=u.lastUsedAt,
            )
            for u in usersResult
        ]

        daily = [
            TokenUsageDailyRow(
                usageDate=d.usageDate,
                companyId=d.companyId,
                companyName=d.companyName,
                requestCount=d.requestCount,
                totalTokens=d.totalTokens,
            )
            for d in dailyResult
        ]

        return TokenUsageSummaryResponse(
            rows=rows,
            users=users,
            daily=daily,
            totalRequestCount=sum(r.requestCount for r in rows),
            totalTokens=sum(r.totalTokens for r in rows),
        )

    async def detail(
        self, query: TokenUsageQuery, limit: int = 100, offset: int = 0
    ) -> TokenUsageDetailResponse:
        conds = self._conditions(query)
        limit = max(1, min(limit, MAX_DETAIL_LIMIT))
        offset = max(0, offset)

        countStmt = (
            select(func.count(TokenUsageLog.id)).select_from(TokenUsageLog).where(*conds)
        )

        stmt = (
            select(
                TokenUsageLog,
                Company.companyName,
                ModelMaster.displayName,
            )
            .select_from(TokenUsageLog)
            .join(Company, Company.companyId == TokenUsageLog.companyId)
            # 모델이 지워져도 로그는 남는다 (ON DELETE SET NULL). outer 여야 한다.
            .outerjoin(ModelMaster, ModelMaster.id == TokenUsageLog.modelId)
            .where(*conds)
            .order_by(TokenUsageLog.createdAt.desc())
            .limit(limit)
            .offset(offset)
        )

        async with AsyncSession(self.dbEngine) as session:
            total = (await session.execute(countStmt)).scalar() or 0
            result = (await session.execute(stmt)).all()

        logs = [
            TokenUsageDetailRow(
                id=row[0].id,
                companyId=row[0].companyId,
                companyName=row[1],
                userEmail=row[0].userEmail,
                agentType=row[0].agentType,
                modelName=row[2],
                inputTokens=row[0].inputTokens,
                outputTokens=row[0].outputTokens,
                totalTokens=(row[0].inputTokens or 0) + (row[0].outputTokens or 0),
                latencyMs=row[0].latencyMs,
                succeeded=row[0].succeeded,
                errorMessage=row[0].errorMessage,
                createdAt=row[0].createdAt,
            )
            for row in result
        ]

        return TokenUsageDetailResponse(logs=logs, total=total)


def newTokenUsageRepository(
    dbEngine: AsyncEngine, cache: AsyncCache
) -> TokenUsageRepository:
    return TokenUsageRepositoryImpl(dbEngine, cache)
