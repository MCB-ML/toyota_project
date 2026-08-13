from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from internal.helper.timeutil import nowUtc

Base = declarative_base()


class Workspace(Base):
    __tablename__ = "Workspace_master"
    __table_args__ = {"schema": "dbo"}

    workspaceId = Column("workspace_id", String(36), primary_key=True)
    workspaceName = Column("workspace_name", String(255), nullable=False)
    workspaceDepartment = Column("workspace_department", String(100), nullable=True)
    workspaceType = Column("workspace_type", String(100), nullable=True)
    branchId = Column("branch_id", String(36), nullable=False)
    seq = Column("seq", Integer, nullable=True)
    createdAt = Column("created_at", DateTime, nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime, nullable=True, onupdate=nowUtc)
    deletedAt = Column("deleted_at", DateTime, nullable=True)


# end class
