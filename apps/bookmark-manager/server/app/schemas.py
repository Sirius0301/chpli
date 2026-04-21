from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, HttpUrl, Field, ConfigDict


class TagBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    created_at: datetime


class BookmarkBase(BaseModel):
    url: str = Field(..., max_length=2048)
    title: str = Field(..., max_length=255)
    description: Optional[str] = None


class BookmarkCreate(BookmarkBase):
    tag_ids: Optional[List[UUID]] = []


class BookmarkUpdate(BaseModel):
    url: Optional[str] = Field(None, max_length=2048)
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tag_ids: Optional[List[UUID]] = None


class BookmarkResponse(BookmarkBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    click_count: int
    last_clicked_at: Optional[datetime]
    is_required: bool
    is_deleted: bool
    deleted_at: Optional[datetime]
    dismissed_until: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []


class RequiredToggleRequest(BaseModel):
    is_required: bool


class ClickLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    bookmark_id: UUID
    user_id: UUID
    clicked_at: datetime


class ExportBookmarkItem(BaseModel):
    url: str
    title: str
    description: Optional[str]
    tags: List[str]
    click_count: int
    last_clicked_at: Optional[str]


class ExportTagItem(BaseModel):
    name: str
    description: Optional[str]


class ExportData(BaseModel):
    version: str = "1.0"
    exported_at: str
    bookmarks: List[ExportBookmarkItem]
    tags: List[ExportTagItem]


class SuggestionResponse(BaseModel):
    bookmark: BookmarkResponse
    days_since_click: Optional[int]
