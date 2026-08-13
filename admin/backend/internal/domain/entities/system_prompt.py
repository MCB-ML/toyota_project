from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID

from internal.domain.entities.company import Base
from internal.helper.timeutil import nowUtc


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class SystemPrompt(Base):
    """전역 시스템 프롬프트.

    프롬프트는 전 딜러사가 동일한 것을 사용하므로 companyId 를 갖지 않는다.
    딜러사별로 달라지는 것은 모델 접속 키뿐이다.

    카테고리 3종(semantic / ontology / metrics) 이고
    카테고리마다 yaml/md 파일을 여러 개 둘 수 있다.
    한 카테고리의 파일들을 어떻게 조합해 쓸지는 에이전트 백엔드가 결정한다.

    파일 자체는 스토리지에 두지 않는다. 업로드 시 브라우저가 읽은 텍스트 본문만 value 에 저장한다.
    """

    __tablename__ = "SystemPrompt_Configuration"
    __table_args__ = (
        # 같은 카테고리 안에서 이름이 겹치면 어느 것을 고친 건지 알 수 없다
        UniqueConstraint("category", "name", name="uq_prompt_name"),
        {"schema": "dbo"},
    )

    id = Column(
        "id",
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    category = Column("category", String(20), nullable=False)
    name = Column("name", String(200), nullable=False)
    fileName = Column("file_name", String(255))
    fileType = Column("file_type", String(10), nullable=False, default="yaml")
    value = Column("value", Text, nullable=False)

    isActive = Column("is_active", Boolean, nullable=False, default=True)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=True, onupdate=nowUtc)
