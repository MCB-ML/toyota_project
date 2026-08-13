from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.ext.declarative import declarative_base
from internal.helper.timeutil import nowUtc

Base = declarative_base()


class UserAssignment(Base):
    __tablename__ = "User_Assignment"
    __table_args__ = {"schema": "dbo"}

    assignmentId = Column("assignment_id", String(36), primary_key=True)
    userId = Column("user_id", String(36), nullable=False)
    workspaceId = Column("workspace_id", String(36), nullable=False)
    userType = Column("user_type", String(20), nullable=False)

    createdAt = Column("created_at", DateTime, nullable=False, default=nowUtc)


# end class
