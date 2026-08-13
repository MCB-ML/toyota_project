from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from internal.helper.timeutil import nowUtc

Base = declarative_base()


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class ADUserMaster(Base):
    __tablename__ = "User_AD_master"
    __table_args__ = {"schema": "dbo"}

    userId = Column("user_id", UUID(as_uuid=True), primary_key=True)
    userName = Column("user_name", String(255), nullable=False)
    userEmail = Column("user_email", String(255), nullable=False)
    userRole = Column("user_role", String(100), nullable=True)
    userAccess = Column("user_access", String(255), nullable=True)

    userDepartment = Column("user_department", String(100), nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
    userAvatar = Column("user_avatar", String, nullable=True)  # Base64 string
    defaultCompany = Column("default_company", UUID(as_uuid=True), nullable=True)
    defaultLanguage = Column("default_language", String(10), nullable=True)

    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=True, onupdate=nowUtc)
    deletedAt = Column("deleted_at", DateTime(timezone=True), nullable=True)


# end class
