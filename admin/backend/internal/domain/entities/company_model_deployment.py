from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from internal.domain.entities.company import Base

# relationship("ModelMaster") 가 문자열이라 이 모듈이 먼저 로드돼 있어야 이름이 풀린다.
# import 순서에 기대면 어느 날 import 하나가 빠졌을 때 첫 조회에서 죽는다.
from internal.domain.entities.model_master import ModelMaster  # noqa: F401
from internal.helper.timeutil import nowUtc


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class CompanyInfoModelDeployment(Base):
    """딜러사 x 용도 -> 모델 스펙.

    "이 딜러사의 Text2SQL 은 이 모델을 쓴다" 가 한 행이다.

    접속 키는 딜러사별로 나누지 않는다. 에이전트 실행 역할 하나로 호출하고,
    딜러사별 사용량은 TokenUsage_log 로 집계한다.
    """

    __tablename__ = "CompanyInfo_ModelDeployment"
    __table_args__ = (
        # 딜러사 x 용도 당 모델 1개.
        # 중복되면 설정 로드 시 조용히 덮어써지므로 DB 에서 막는다.
        UniqueConstraint("company_info_id", "agent_type", name="uq_company_deployment"),
        {"schema": "dbo"},
    )

    id = Column(
        "id",
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    companyId = Column(
        "company_info_id",
        UUID(as_uuid=True),
        ForeignKey("dbo.CompanyInfo_master.company_info_id", ondelete="CASCADE"),
        nullable=False,
    )

    modelId = Column(
        "model_id",
        UUID(as_uuid=True),
        ForeignKey("dbo.Model_master.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # 용도: main | sql | sql_2 | rag | powerbi | chart
    agentType = Column("agent_type", String(20), nullable=False)

    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=True, onupdate=nowUtc)

    model = relationship("ModelMaster", back_populates="deployments", lazy="joined")
    company = relationship("Company", back_populates="deployments")


# end class
