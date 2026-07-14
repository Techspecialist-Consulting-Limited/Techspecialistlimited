import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JobPosting(Base):
    __tablename__ = "job_postings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="Full-time")
    screening_instructions: Mapped[str] = mapped_column(
        Text, nullable=False, default=""
    )
    stage2_instructions: Mapped[str] = mapped_column(
        Text, nullable=False, default=""
    )
    stage2_questions: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    stage2_topic_labels: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )
    is_deleted: Mapped[bool] = mapped_column(nullable=False, default=False)
    is_closed: Mapped[bool] = mapped_column(nullable=False, default=False)
    auto_advance_enabled: Mapped[bool] = mapped_column(nullable=False, default=False)
    auto_advance_pass_mark: Mapped[float] = mapped_column(Float, nullable=False, default=70.0)
    auto_advance_delay_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    applications = relationship("Application", back_populates="job")
