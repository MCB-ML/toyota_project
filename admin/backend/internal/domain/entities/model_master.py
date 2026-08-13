from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    Numeric,
    SmallInteger,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from internal.domain.entities.company import Base
from internal.helper.timeutil import nowUtc


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class ModelMaster(Base):
    """모델 스펙 카탈로그 (전역).

    "어떤 모델을 어떤 파라미터로 쓰는가" 만 담는다. 딜러사와 무관하다.
    접속 키는 실행 역할 하나로 통일했다. 사용량은 TokenUsage_log 로 집계한다.

    구 AzureDeployment_Master 를 개명한 것이다.
    테이블/컬럼명에 클라우드 벤더 이름을 넣지 않는다.
    """

    __tablename__ = "Model_master"
    __table_args__ = {"schema": "dbo"}

    id = Column(
        "id",
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    displayName = Column("display_name", String(100), nullable=False)
    provider = Column("provider", String(30), nullable=False, default="bedrock")
    modelKind = Column("model_kind", String(20), nullable=False, default="llm")

    # provider 별 호출 식별자. bedrock 예: anthropic.claude-sonnet-4-5-20250929-v1:0
    modelId = Column("model_id", String(200), nullable=False)
    apiVersion = Column("api_version", String(50))

    maxToken = Column("max_token", Integer)
    # 0.7 같은 소수를 담아야 하므로 numeric. smallint 로는 저장할 수 없다.
    temperature = Column("temperature", Numeric(3, 2))
    topP = Column("top_p", Numeric(3, 2))
    topK = Column("top_k", SmallInteger)
    reasoningEffort = Column("reasoning_effort", String(20))
    embeddingModel = Column("embedding_model", String(200))

    isActive = Column("is_active", Boolean, nullable=False, default=True)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=True, onupdate=nowUtc)

    deployments = relationship("CompanyInfoModelDeployment", back_populates="model")
