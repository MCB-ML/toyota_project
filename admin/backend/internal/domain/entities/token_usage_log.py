from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID

from internal.domain.entities.company import Base
from internal.helper.timeutil import nowUtc


# DDL 의 시각 컬럼은 전부 timestamptz 다.
# 여기서 DateTime 을 그냥 쓰면 TIMESTAMP WITHOUT TIME ZONE 으로 바인딩되고,
# 타임존이 붙은 값(Asia/Seoul)을 넣는 순간 asyncpg 가 거부한다.

class TokenUsageLog(Base):
    """토큰 사용량 로그. 에이전트 호출 한 건이 한 행이다.

    AWS 키를 딜러사마다 발급하지 않는 이유:
      키를 나눠도 청구서가 딜러사별로 갈라지지 않는다. 어차피 토큰 수를 집계해야 하고,
      그 숫자는 에이전트가 응답에서 바로 얻는다. 키 16개를 보관·교체하는 부담만 남는다.
      게다가 키 단위로는 "어느 사용자가 어느 용도로 썼나" 를 알 수 없다.
    """

    # agent 스키마다. INSERT 하는 쪽이 에이전트이기 때문이다.
    # 어드민은 사용량 화면에서 읽기만 한다.
    __tablename__ = "TokenUsage_log"
    __table_args__ = {"schema": "agent"}

    id = Column("id", BigInteger, primary_key=True, autoincrement=True)

    companyId = Column(
        "company_info_id",
        UUID(as_uuid=True),
        ForeignKey("dbo.CompanyInfo_master.company_info_id", ondelete="CASCADE"),
        nullable=False,
    )

    # 누가 썼는지. 에이전트는 로그인 계정의 이메일을 그대로 들고 있으므로
    # uuid 를 되찾는 조회를 강요하지 않는다. FK 도 걸지 않는다 —
    # 계정이 삭제돼도 지난 사용량은 남아야 한다. 없으면 배치·시스템 호출.
    userEmail = Column("user_email", String(255), nullable=True)

    # 용도. 키 단위 집계로는 얻을 수 없는 분해축이라 여기에 남긴다.
    # 어느 대화를 처리하다 쓴 토큰인가. 없어도 된다(배치·사전 색인 등).
    #
    # ForeignKey 를 선언하지 않는다. 대화 테이블은 에이전트 백엔드가 소유하고
    # 어드민 쪽에는 매핑이 없어서, 여기서 FK 를 걸면 매퍼가 대상 테이블을 못 찾는다.
    # 실제 제약(ON DELETE SET NULL)은 DDL 이 걸어둔다.
    sessionId = Column("session_id", UUID(as_uuid=True), nullable=True)
    messageId = Column("message_id", UUID(as_uuid=True), nullable=True)

    agentType = Column("agent_type", String(20), nullable=True)

    modelId = Column(
        "model_id",
        UUID(as_uuid=True),
        ForeignKey("dbo.Model_master.id", ondelete="SET NULL"),
        nullable=True,
    )

    inputTokens = Column("input_tokens", Integer, nullable=False, default=0)
    outputTokens = Column("output_tokens", Integer, nullable=False, default=0)
    latencyMs = Column("latency_ms", Integer, nullable=True)

    succeeded = Column("succeeded", Boolean, nullable=False, default=True)
    errorMessage = Column("error_message", Text, nullable=True)

    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=nowUtc)
