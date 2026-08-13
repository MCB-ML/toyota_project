from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from internal.helper.timeutil import nowUtc

Base = declarative_base()


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class Company(Base):
    __tablename__ = "CompanyInfo_master"
    __table_args__ = {"schema": "dbo"}

    companyId = Column(
        "company_info_id",
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # 딜러사는 토요타 산하 자회사 개념이라 업종/주소 같은 법인 정보를 두지 않는다.
    companyName = Column("company_info_name", String(255), nullable=False)
    description = Column("description", Text, nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=True, onupdate=nowUtc)
    deletedAt = Column("deleted_at", DateTime(timezone=True), nullable=True)

    deployments = relationship(
        "CompanyInfoModelDeployment",
        back_populates="company",
        passive_deletes=True,
    )

    # 아래 관계들은 스키마에서 제거되었다. 해당 테이블이 더 이상 존재하지 않는다.
    #   systemPrompts  -> 프롬프트는 전역이 되어 딜러사에 매달리지 않는다
    #   connections    -> 데이터 소스 연결은 에이전트 백엔드 담당
    #   branch         -> 딜러사 = Company 단일 계층
    #   datasetSource  -> Dataset 기능 미사용


# end class
