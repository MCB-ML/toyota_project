from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from internal.domain.entities.ad_user import ADUser
from internal.infrastructure.cache.async_cache import AsyncCache

CACHE_KEY_ALL_AD_USERS = "ad_users:all"
CACHE_TTL_SECONDS = 300


class ADUserRepository:
    def __init__(self, dbEngine: AsyncEngine, cache: AsyncCache):
        self.dbEngine = dbEngine
        self.cache = cache

    # end def

    async def upsertUsers(self, users: List[ADUser]) -> None:
        if not users:
            return
        # end if

        async with self.dbEngine.begin() as _:
            for user in users:
                pass
            # end for
        # end with

        # Merge users that are not in the database
        async with AsyncSession(self.dbEngine) as session:
            async with session.begin():
                for user in users:
                    await session.merge(user)
                # end for
            # end with
        # end with

        # Invalidate cache on upsert
        await self.cache.delete(CACHE_KEY_ALL_AD_USERS)

    async def getAllUsers(self) -> List[ADUser]:
        # Check cache first
        cachedUsers = await self.cache.get(CACHE_KEY_ALL_AD_USERS)
        if cachedUsers is not None:
            return cachedUsers
        # end if

        async with AsyncSession(self.dbEngine) as session:
            result = await session.execute(select(ADUser))
            users = result.scalars().all()

            # Update cache
            await self.cache.set(CACHE_KEY_ALL_AD_USERS, users, CACHE_TTL_SECONDS)
            return users
        # end with

    # end def

    async def getUserById(self, userId: str) -> Optional[ADUser]:
        # Utilizing the cached full list for efficiency
        allUsers = await self.getAllUsers()
        for user in allUsers:
            if str(user.userId) == str(userId):
                return user
        return None

    # end def

    async def getUserByEmail(self, email: str) -> Optional[ADUser]:
        # Utilizing the cached full list for efficiency
        allUsers = await self.getAllUsers()
        for user in allUsers:
            if user.userEmail and user.userEmail.lower() == email.lower():
                return user
        return None

    # end def


def newADUserRepository(dbEngine: AsyncEngine, cache: AsyncCache) -> ADUserRepository:
    return ADUserRepository(dbEngine, cache)


# end def
