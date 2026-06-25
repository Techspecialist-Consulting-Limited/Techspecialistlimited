import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConversationSession(Base):
    __tablename__ = "conversation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Text, nullable=False, default="in_progress"
    )
    conversation_history: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    current_topic_index: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    turns_on_current_topic: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    topics: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    application = relationship("Application", back_populates="conversation_session")
