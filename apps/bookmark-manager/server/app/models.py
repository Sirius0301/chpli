from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, ForeignKey, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


bookmark_tags = Table(
    "bm_bookmark_tags",
    Base.metadata,
    Column("bookmark_id", UUID(as_uuid=True), ForeignKey("bm_bookmarks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("bm_tags.id", ondelete="CASCADE"), primary_key=True),
)


class Bookmark(Base):
    __tablename__ = "bm_bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    click_count = Column(Integer, default=0, nullable=False)
    last_clicked_at = Column(DateTime(timezone=True), nullable=True)
    is_required = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tags = relationship("Tag", secondary=bookmark_tags, back_populates="bookmarks")
    click_logs = relationship("ClickLog", back_populates="bookmark", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "bm_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bookmarks = relationship("Bookmark", secondary=bookmark_tags, back_populates="tags")


class ClickLog(Base):
    __tablename__ = "bm_click_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    bookmark_id = Column(UUID(as_uuid=True), ForeignKey("bm_bookmarks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bookmark = relationship("Bookmark", back_populates="click_logs")
