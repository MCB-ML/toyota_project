from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    LargeBinary,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from internal.domain.entities.company import Base
from internal.helper.timeutil import nowUtc


class Branch(Base):
    __tablename__ = "Branch_master"
    __table_args__ = {"schema": "dbo"}

    branchId = Column(
        "branch_id",
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    branchName = Column("branch_name", String(255), nullable=False)
    branchType = Column("branch_type", String(100), nullable=True)
    branchLocation = Column("branch_location", String(255), nullable=True)
    companyId = Column(
        "company_info_id",
        UUID(as_uuid=True),
        ForeignKey("dbo.CompanyInfo_master.company_info_id", ondelete="CASCADE"),
        nullable=False,
    )

    branchAllowUserAccess = Column("branch_allow_user_access", Boolean, nullable=True)
    dataAgentBotName = Column("data_agent_botname", String(150), nullable=True)
    dataAgentWelcomeprompt = Column(
        "data_agent_welcomeprompt", String(250), nullable=True
    )
    branchLogo = Column("branch_logo", LargeBinary, nullable=True)
    bgImg = Column("background_image", LargeBinary, nullable=True)

    isActive = Column("is_active", Boolean, nullable=True)
    isDefault = Column("is_default", Boolean, nullable=True)
    branchLogo = Column("branch_logo", LargeBinary, nullable=True)
    createdAt = Column("created_at", DateTime, nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime, nullable=True, onupdate=nowUtc)
    deletedAt = Column("deleted_at", DateTime, nullable=True)

    # Company 쪽에 대응하는 branch 관계가 없다(Branch 계층은 제거됨).
    # 그런데 이 파일이 핸들러 체인을 타고 여전히 import 되고,
    # 로드되는 순간 back_populates 해석에 실패해 Company 매퍼 전체가 깨진다.
    # -> 회사 목록 조회가 "Mapper[Company] has no property 'branch'" 로 죽는다.
    # 관계만 끊어둔다. 테이블 자체는 스키마에 없으므로 조회할 일도 없다.
    # company = relationship("Company", back_populates="branch")

    # branchConfigurations = relationship(
    #     "BranchConfiguration",
    #     back_populates="branch",
    #     # cascade="all, delete-orphan",
    #     passive_deletes=True,
    # )
