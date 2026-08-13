from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.ext.declarative import declarative_base
from internal.helper.timeutil import nowUtc

Base = declarative_base()


class ADUser(Base):
    __tablename__ = "User_AD_list"
    __table_args__ = {"schema": "dbo"}

    userId = Column("user_id", String(36), primary_key=True)
    userName = Column("user_name", String(255), nullable=False)
    userEmail = Column("user_email", String(255), nullable=False)
    userRole = Column("user_role", String(100), nullable=True)
    userDepartment = Column("user_department", String(100), nullable=True)
    userAvatar = Column("user_avatar", String, nullable=True)  # Base64 string

    createdAt = Column("created_at", DateTime, nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime, nullable=True, onupdate=nowUtc)
    deletedAt = Column("deleted_at", DateTime, nullable=True)


# end class
