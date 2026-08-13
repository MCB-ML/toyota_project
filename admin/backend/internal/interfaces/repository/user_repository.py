import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, delete, select, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.ad_user_master import ADUserMaster
from internal.domain.entities.user import User
from internal.domain.repository.user_repository import UserRepository
from internal.infrastructure.cache.async_cache import AsyncCache
from internal.helper.timeutil import nowUtc

# Cache keys for users
CACHE_KEY_ALL_USERS = "users:all"
CACHE_KEY_ORG_CHART_WORKSPACE = "orgchart:workspace_view"
CACHE_KEY_ORG_CHART_END_USER = "orgchart:end_user_view"
CACHE_TTL_SECONDS = 300


class UserRepositoryImpl(UserRepository):
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache

    # end def

    async def _syncUserAssignments(
        self, userId: str, workspaceIds: List[str], userType: str = "credential"
    ) -> None:
        # User_Assignment 테이블은 스키마에서 제거되었다.
        # 딜러사 = Company 한 계층만 쓰고, 접근 범위는 User_master.default_company
        # 하나로 정해진다. 호출부가 아직 남아 있어 아무 일도 하지 않고 돌아간다.
        return None

    # end def

    async def UserAssignmentsInsert(
        self, userId: str, workspaceIds: List[str], userType: str = "credential"
    ) -> None:
        # User_Assignment 테이블은 스키마에서 제거되었다.
        # 딜러사 = Company 한 계층만 쓰고, 접근 범위는 User_master.default_company
        # 하나로 정해진다. 호출부가 아직 남아 있어 아무 일도 하지 않고 돌아간다.
        return None

    # end def

    async def getUserAssignments(self, userId: str) -> List[str]:
        # User_Assignment 테이블은 스키마에서 제거되었다.
        # 딜러사 = Company 한 계층만 쓰고, 접근 범위는 User_master.default_company
        # 하나로 정해진다. 호출부가 아직 남아 있어 아무 일도 하지 않고 돌아간다.
        return []

    # end def

    async def getAllUserAssignments(self):
        # User_Assignment 테이블은 스키마에서 제거되었다.
        # 딜러사 = Company 한 계층만 쓰고, 접근 범위는 User_master.default_company
        # 하나로 정해진다. 호출부가 아직 남아 있어 아무 일도 하지 않고 돌아간다.
        return []

    # end def

    async def createUser(self, user: User, workspaceIds: List[str]) -> None:
        async with self.dbEngine.begin() as conn:
            # 1. Insert User
            await conn.run_sync(
                lambda sync_conn: sync_conn.execute(
                    User.__table__.insert().values(
                        user_id=user.userId,
                        user_name=user.userName,
                        user_email=user.userEmail,
                        user_password=user.userPassword,
                        user_role=user.userRole,
                        user_access=user.userAccess,
                        user_department=user.userDepartment,
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
        await self.cache.delete(CACHE_KEY_ALL_USERS)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def getUserById(self, userId: str) -> Optional[User]:
        # Get all users -> handles cache check & population automatically
        allUsers = await self.getAllUsers()
        for user in allUsers:
            if str(user.userId) == str(userId):
                return user
        return None

    # end def

    async def getUserByEmail(self, email: str) -> Optional[User]:
        allUsers = await self.getAllUsers()
        for user in allUsers:
            if user.userEmail == email:
                return user
        return None

    # end def
    
    async def getUserLoginByEmail(self, email: str) -> Optional[User]:
        """로그인용 계정 조회.

        권한(admin) 으로 거르지 않는다. 여기서 걸러버리면 자격증명이 멀쩡한
        일반 사용자가 로그인 화면에서 "User not found" 를 보게 된다.
        권한 판정은 /auth/check 가 403 으로 하고, 화면은 그때 안내를 띄운다.
        """
        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                select(User).where(User.userEmail == email)
            )
            return result.scalars().one_or_none()
        
    async def getUserCompanyContext(self, userId: str) -> dict:
        if userId is not None and not isinstance(userId, uuid.UUID):
            try:
                userId = uuid.UUID(str(userId))
            except (ValueError, AttributeError, TypeError):
                return {}

        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(
                text(
                    """
                    SELECT
                        v.company_info_id::text AS company_info_id,
                        v.company_info_name AS company_info_name,
                        m.scope_key AS scope_key
                    FROM dbo."v_user_company" v
                    LEFT JOIN dbo."ScopeCompany_map" m
                      ON m.company_info_id = v.company_info_id
                    WHERE v.user_id = :user_id
                    LIMIT 1
                    """
                ),
                {"user_id": userId},
            )
            row = result.mappings().first()
            if not row:
                return {}
            return {
                "companyInfoId": row.get("company_info_id"),
                "companyInfoName": row.get("company_info_name"),
                "scopeKey": row.get("scope_key"),
            }
    async def checkUser(self, mode:str, id: str) -> Optional[User]:

        # JWT 의 sub 는 문자열이고 user_id 는 uuid 다.
        # 그대로 비교하면 PostgreSQL 이 uuid = text 를 거부한다.
        # 형변환이 곧 검증이기도 하다 - 이상한 값은 여기서 걸러진다.
        if id is not None and not isinstance(id, uuid.UUID):
            try:
                id = uuid.UUID(str(id))
            except (ValueError, AttributeError, TypeError):
                return None

        async with AsyncSession(self.dbEngine) as session:
                
                # 권한(admin) 검사는 여기서 하지 않는다.
                # 계정을 못 찾은 것과 권한이 없는 것을 구분해야 화면이
                # "로그인하세요" 와 "접속 권한이 없습니다" 를 나눠 안내할 수 있다.
                # 검사는 auth handler 의 _checkToken 이 맡는다.
                if mode == "credential":
                    result = await session.execute(
                        select(User).where(User.userId == id)
                    )
                    return result.scalars().one_or_none()

                elif mode == "azure":
                    result = await session.execute(
                        select(ADUserMaster).where(ADUserMaster.userId == id)
                    )
                    return result.scalars().one_or_none()

                else:
                    # Explicit handling (VERY IMPORTANT)
                    raise ValueError(f"Invalid mode: {mode}")
                


    async def getAllUsers(self) -> List[User]:
        # Check cache first
        cachedUsers = await self.cache.get(CACHE_KEY_ALL_USERS)
        if cachedUsers is not None:
            return cachedUsers
        # end if

        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(select(User))
            users = result.scalars().all()

            # Update cache
            await self.cache.set(CACHE_KEY_ALL_USERS, users, CACHE_TTL_SECONDS)

            return users
        # end with

    # end def

    async def updateUser(
        self,
        user: User,
        workspaceIds: Optional[List[str]] = None,
        changePassword: Optional[str] = None,
    ) -> None:
        async with self.dbEngine.begin() as conn:
            # 1. Update User

            values = {
                "user_name": user.userName,
                "user_email": user.userEmail,
                "user_role": user.userRole,
                "user_access": user.userAccess,
                "user_department": user.userDepartment,
                "default_company": user.defaultCompany,
                "default_language": user.defaultLanguage,
                "updated_at": nowUtc(),
            }

            if changePassword:
                values["user_password"] = changePassword

            await conn.execute(
                User.__table__.update()
                .where(User.userId == user.userId)
                .values(**values)
            )
        # end with

        # 2. Update Assignments if provided
        if workspaceIds is not None:
            await self._syncUserAssignments(user.userId, workspaceIds)
        # end if

        # Invalidate cache
        await self.cache.delete(CACHE_KEY_ALL_USERS)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def

    async def updatePassword(self, userId: str, newPassword: str) -> None:
        async with self.dbEngine.begin() as conn:
            await conn.execute(
                User.__table__.update()
                .where(User.userId == userId)
                .values(
                    user_password=newPassword,
                    updated_at=nowUtc(),
                )
            )
        # end with

    # end def

    async def deleteUser(self, userId: str) -> None:
        async with self.dbEngine.begin() as conn:
            # User_Assignment 삭제는 없다 - 테이블이 제거되었다.

            # Delete User
            await conn.execute(User.__table__.delete().where(User.userId == userId))
        # end with

        # Invalidate cache
        await self.cache.delete(CACHE_KEY_ALL_USERS)
        await self.cache.delete(CACHE_KEY_ORG_CHART_WORKSPACE)
        await self.cache.delete(CACHE_KEY_ORG_CHART_END_USER)

    # end def


# end class


def newUserRepository(dbEngine: AsyncEngine, cache: AsyncCache) -> UserRepository:
    return UserRepositoryImpl(dbEngine, cache)


# end def
