import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.ad_user_master import ADUserMaster
from internal.domain.entities.user_assignment import UserAssignment
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.helper.timeutil import nowUtc

# Cache keys
CACHE_KEY_ALL_AD_USER_MASTER = "ad_users_master:all"
CACHE_KEY_ORG_CHART_WORKSPACE = "orgchart:workspace_view"
CACHE_KEY_ORG_CHART_END_USER = "orgchart:end_user_view"
CACHE_TTL_SECONDS = 300


class ADUserMasterRepository:
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache

    # end def

    async def _syncUserAssignments(
        self, userId: str, workspaceIds: List[str], userType: str = "ad_user"
    ) -> None:
        """Syncs user assignments"""
        async with self.dbEngine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    UserAssignment.__table__.delete().where(
                        UserAssignment.userId == userId
                    )
                )
            )

            if workspaceIds:
                values = [
                    {
                        "assignment_id": str(uuid.uuid4()),
                        "user_id": userId,
                        "workspace_id": wsId,
                        "user_type": userType,
                        "created_at": nowUtc(),
                    }
                    for wsId in workspaceIds
                ]
                await conn.run_sync(
                    lambda sync_conn: sync_conn.execute(
                        UserAssignment.__table__.insert(), values
                    )
                )
            # end if
        # end with

    # end def

    async def UserAssignmentsInsert(
        self, userId: str, workspaceIds: List[str], userType: str = "ad_user"
    ) -> bool:
        async with self.dbEngine.begin() as conn:

            def get_existing(sync_conn):
                result = sync_conn.execute(
                    UserAssignment.__table__.select()
                    .with_only_columns(UserAssignment.workspaceId)
                    .where(UserAssignment.userId == userId)
                )
                return set(result.scalars())

            existing_ids = await conn.run_sync(get_existing)

            to_insert = [ws for ws in workspaceIds if ws not in existing_ids]

            if not to_insert:
                return False

            values = [
                {
                    "assignment_id": str(uuid.uuid4()),
                    "user_id": userId,
                    "workspace_id": ws,
                    "user_type": userType,
                    "created_at": nowUtc(),
                }
                for ws in to_insert
            ]

            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    UserAssignment.__table__.insert(), values
                )
            )

            return True

    async def getUserAssignments(self, userId: str) -> List[str]:
        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                select(UserAssignment.workspaceId).where(
                    UserAssignment.userId == userId
                )
            )
            return result.scalars().all()
        # end with

    # end def

    async def createADUser(self, user: ADUserMaster, workspaceIds: List[str]) -> None:
        async with self.dbEngine.begin() as conn:
            # 1. Insert AD User Master
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    ADUserMaster.__table__.insert().values(
                        user_id=user.userId,
                        user_name=user.userName,
                        user_email=user.userEmail,
                        user_role=user.userRole,
                        user_access=user.userAccess,
                        user_department=user.userDepartment,
                        user_avatar=user.userAvatar,
                        default_company=user.defaultCompany,
                        default_language=user.defaultLanguage,
                        created_at=user.createdAt or nowUtc(),
                    )
                )
            )
        # end with

        # 2. Sync Assignments
        await self._syncUserAssignments(user.userId, workspaceIds)

        # Invalidate cache
        await self.cache.delete(CACHE_KEY_ALL_AD_USER_MASTER)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def getADUserById(self, userId: str) -> Optional[ADUserMaster]:
        # Cache check via getAll
        allUsers = await self.getAllADUsers()
        for user in allUsers:
            if str(user.userId) == str(userId):
                return user
        return None

    # end def

    async def getADUserByEmail(self, email: str) -> Optional[ADUserMaster]:
        allUsers = await self.getAllADUsers()
        for user in allUsers:
            if user.userEmail.lower() == email.lower():
                return user
        return None

    # end def

    async def getAllADUsers(self) -> List[ADUserMaster]:
        # Cache logic
        cachedUsers = await self.cache.get(CACHE_KEY_ALL_AD_USER_MASTER)
        if cachedUsers is not None:
            return cachedUsers
        # end if

        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(select(ADUserMaster))
            users = result.scalars().all()

            await self.cache.set(CACHE_KEY_ALL_AD_USER_MASTER, users, CACHE_TTL_SECONDS)

            return users
        # end with

    # end def

    async def updateADUser(
        self, user: ADUserMaster, workspaceIds: Optional[List[str]] = None
    ) -> None:
        async with self.dbEngine.begin() as conn:
            # 1. Update AD User
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    ADUserMaster.__table__.update()
                    .where(ADUserMaster.userId == user.userId)
                    .values(
                        user_name=user.userName,
                        user_email=user.userEmail,
                        user_role=user.userRole,
                        user_access=user.userAccess,
                        user_department=user.userDepartment,
                        user_avatar=user.userAvatar,
                        default_company=user.defaultCompany,
                        default_language=user.defaultLanguage,
                        updated_at=nowUtc(),
                    )
                )
            )
        # end with

        if workspaceIds is not None:
            await self._syncUserAssignments(user.userId, workspaceIds)

        await self.cache.delete(CACHE_KEY_ALL_AD_USER_MASTER)

    # end def

    async def getAllUserAssignmentsMap(self) -> dict:
        """Returns a dictionary mapping userId to a list of workspaceIds"""
        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                select(UserAssignment.userId, UserAssignment.workspaceId)
            )
            rows = result.all()

            assignmentMap = {}
            for userId, workspaceId in rows:
                if userId not in assignmentMap:
                    assignmentMap[userId] = []
                assignmentMap[userId].append(workspaceId)

            return assignmentMap
        # end with

    # end def

    async def deleteADUser(self, userId: str) -> None:
        async with self.dbEngine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    ADUserMaster.__table__.delete().where(ADUserMaster.userId == userId)
                )
            )
        # end with
        await self.cache.delete(CACHE_KEY_ALL_AD_USER_MASTER)

    # end def


def newADUserMasterRepository(
    dbEngine: AsyncEngine, cache: AsyncCache
) -> ADUserMasterRepository:
    return ADUserMasterRepository(dbEngine, cache)


# end def
