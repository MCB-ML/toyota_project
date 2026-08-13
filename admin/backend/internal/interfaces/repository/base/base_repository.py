from contextlib import nullcontext
from typing import Generic, TypeVar

from sqlalchemy import and_, delete, select, update
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from sqlalchemy.orm import Load, selectinload

T = TypeVar("T")


class BaseRepository:
    def __init__(self, member_class: Generic[T], dbEngine: AsyncEngine):
        self.dbEngine = dbEngine
        self.member_class = member_class

    async def get(
        self,
        where_condition: list | None = None,
        limit: int | None = None,
        order_by=None,
        group_by: list | None = None,
        distinct: bool = False,
        columns: list | None = None,
        include=None,
        custom_session: AsyncSession = None,
    ):
        stmt = select(*columns) if columns else select(self.member_class)

        if include:
                if not isinstance(include, (list, tuple)):
                    include = [include]

                opts = []
                for rel in include:
                    if isinstance(rel, Load):   # already a loader option
                        opts.append(rel)
                    else:                       # plain relationship attribute
                        opts.append(selectinload(rel))

                stmt = stmt.options(*opts)

        if where_condition:
            stmt = stmt.where(and_(*where_condition))

        if group_by:
            stmt = stmt.group_by(*group_by)

        if distinct:
            stmt = stmt.distinct()

        if order_by is not None:
            stmt = stmt.order_by(order_by)

        if limit is not None:
            stmt = stmt.limit(limit)

        if custom_session is None:
            async with AsyncSession(self.dbEngine) as session:
                result = await session.execute(stmt)
        else:
            result = await custom_session.execute(stmt)

        return result.all() if columns else result.scalars().all()

    async def insert(self, entity, custom_session: AsyncSession = None):
        if custom_session is None:
            async with AsyncSession(self.dbEngine) as session:
                async with session.begin():
                    session.add(entity)
                    await session.flush()  
                    return entity
        else:
            custom_session.add(entity)
            await custom_session.flush()
            return entity

    async def update(
        self, where_conditions: list, values: dict, custom_session: AsyncSession = None
    ):
        if where_conditions:
            stmt = (
                update(self.member_class)
                .where(and_(*where_conditions))
                .values(**values)
            )
        else:
            stmt = update(self.member_class).values(**values)

        if custom_session is None:
            async with AsyncSession(self.dbEngine) as session:
                async with session.begin():
                    await session.execute(stmt)

        else:
            await custom_session.execute(stmt)

    async def delete(
        self, where_conditions: list = None, custom_session: AsyncSession = None
    ):
        statement = delete(self.member_class)

        if where_conditions is not None:
            statement = statement.where(and_(*where_conditions))

        if custom_session is None:
            async with AsyncSession(self.dbEngine) as session:
                async with session.begin():
                    await session.execute(statement)

        else:
            await custom_session.execute(statement)

    async def check(
        self, where_conditions: list, custom_session: AsyncSession = None
    ) -> bool:
        stmt = select(1).where(and_(*where_conditions)).limit(1)

        session = custom_session or AsyncSession(self.dbEngine)
        async with session if custom_session is None else nullcontext(session):
            result = await session.execute(stmt)

        return result.scalar() is not None
