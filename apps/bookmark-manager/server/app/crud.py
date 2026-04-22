from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, delete, insert, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Bookmark, Tag, ClickLog, bookmark_tags
from app.schemas import BookmarkCreate, BookmarkUpdate, TagCreate, TagUpdate

MAX_REQUIRED_BOOKMARKS = 5


# ---------- Bookmarks ----------

async def get_bookmarks(
    db: AsyncSession,
    user_id: UUID,
    tag_id: Optional[UUID] = None,
    include_deleted: bool = False,
) -> List[Bookmark]:
    stmt = select(Bookmark).options(selectinload(Bookmark.tags)).where(Bookmark.user_id == user_id)
    if not include_deleted:
        stmt = stmt.where(Bookmark.is_deleted == False)
    if tag_id:
        stmt = stmt.where(Bookmark.tags.any(Tag.id == tag_id))
    stmt = stmt.order_by(Bookmark.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_bookmark(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> Optional[Bookmark]:
    stmt = (
        select(Bookmark)
        .options(selectinload(Bookmark.tags))
        .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == False)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_bookmark(db: AsyncSession, data: BookmarkCreate, user_id: UUID) -> Bookmark:
    bookmark = Bookmark(
        user_id=user_id,
        url=str(data.url),
        title=data.title,
        description=data.description,
    )
    db.add(bookmark)
    await db.flush()
    if data.tag_ids:
        for tag_id in data.tag_ids:
            tag = await db.get(Tag, tag_id)
            if tag and tag.user_id == user_id:
                await db.execute(
                    insert(bookmark_tags).values(bookmark_id=bookmark.id, tag_id=tag.id)
                )
    await db.commit()
    result = await db.execute(
        select(Bookmark).options(selectinload(Bookmark.tags)).where(Bookmark.id == bookmark.id)
    )
    return result.scalar_one()


async def update_bookmark(
    db: AsyncSession, bookmark_id: UUID, data: BookmarkUpdate, user_id: UUID
) -> Optional[Bookmark]:
    bookmark = await get_bookmark(db, bookmark_id, user_id)
    if not bookmark:
        return None
    if data.url is not None:
        bookmark.url = str(data.url)
    if data.title is not None:
        bookmark.title = data.title
    if data.description is not None:
        bookmark.description = data.description
    if data.tag_ids is not None:
        await db.execute(
            delete(bookmark_tags).where(bookmark_tags.c.bookmark_id == bookmark_id)
        )
        for tag_id in data.tag_ids:
            tag = await db.get(Tag, tag_id)
            if tag and tag.user_id == user_id:
                await db.execute(
                    insert(bookmark_tags).values(bookmark_id=bookmark.id, tag_id=tag.id)
                )
    await db.commit()
    result = await db.execute(
        select(Bookmark).options(selectinload(Bookmark.tags)).where(Bookmark.id == bookmark.id)
    )
    return result.scalar_one()


async def soft_delete_bookmark(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        update(Bookmark)
        .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == False)
        .values(is_deleted=True, deleted_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return result.rowcount > 0


async def restore_bookmark(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        update(Bookmark)
        .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == True)
        .values(is_deleted=False, deleted_at=None)
    )
    await db.commit()
    return result.rowcount > 0


async def permanent_delete_bookmark(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    stmt = delete(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == True)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


async def record_click(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        update(Bookmark)
        .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == False)
        .values(
            click_count=Bookmark.click_count + 1,
            last_clicked_at=datetime.now(timezone.utc),
        )
    )
    if result.rowcount == 0:
        return False
    log = ClickLog(bookmark_id=bookmark_id, user_id=user_id)
    db.add(log)
    await db.commit()
    return True


async def toggle_required(db: AsyncSession, bookmark_id: UUID, is_required: bool, user_id: UUID) -> Optional[Bookmark]:
    bookmark = await get_bookmark(db, bookmark_id, user_id)
    if not bookmark:
        return None
    if is_required and not bookmark.is_required:
        count_result = await db.execute(
            select(func.count(Bookmark.id)).where(
                Bookmark.user_id == user_id,
                Bookmark.is_required == True,
                Bookmark.is_deleted == False,
            )
        )
        current_count = count_result.scalar()
        if current_count >= MAX_REQUIRED_BOOKMARKS:
            raise ValueError("必点书签最多 5 个，请先取消其他必点")
    bookmark.is_required = is_required
    await db.commit()
    await db.refresh(bookmark, attribute_names=["tags"])
    return bookmark


async def get_required_bookmarks(db: AsyncSession, user_id: UUID) -> List[Bookmark]:
    stmt = (
        select(Bookmark)
        .options(selectinload(Bookmark.tags))
        .where(Bookmark.user_id == user_id, Bookmark.is_required == True, Bookmark.is_deleted == False)
        .order_by(Bookmark.last_clicked_at.asc().nullsfirst())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_top_bookmarks(db: AsyncSession, user_id: UUID, limit: int = 5) -> List[Bookmark]:
    stmt = (
        select(Bookmark)
        .options(selectinload(Bookmark.tags))
        .where(Bookmark.user_id == user_id, Bookmark.is_deleted == False)
        .order_by(Bookmark.click_count.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_suggestions(db: AsyncSession, user_id: UUID) -> List[Bookmark]:
    threshold = datetime.now(timezone.utc) - timedelta(days=30)
    stmt = (
        select(Bookmark)
        .options(selectinload(Bookmark.tags))
        .where(
            Bookmark.user_id == user_id,
            Bookmark.is_deleted == False,
            and_(
                (Bookmark.last_clicked_at < threshold) | (Bookmark.last_clicked_at.is_(None)),
                (Bookmark.dismissed_until.is_(None)) | (Bookmark.dismissed_until < datetime.now(timezone.utc)),
            ),
        )
        .order_by(Bookmark.last_clicked_at.asc().nullsfirst())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def dismiss_suggestion(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    until = datetime.now(timezone.utc) + timedelta(days=30)
    result = await db.execute(
        update(Bookmark)
        .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id, Bookmark.is_deleted == False)
        .values(dismissed_until=until)
    )
    await db.commit()
    return result.rowcount > 0


# ---------- Tags ----------

async def get_tags(db: AsyncSession, user_id: UUID) -> List[Tag]:
    stmt = select(Tag).where(Tag.user_id == user_id).order_by(Tag.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_tag(db: AsyncSession, tag_id: UUID, user_id: UUID) -> Optional[Tag]:
    stmt = select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_tag(db: AsyncSession, data: TagCreate, user_id: UUID) -> Tag:
    tag = Tag(user_id=user_id, name=data.name, description=data.description)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


async def get_or_create_tag(db: AsyncSession, data: TagCreate, user_id: UUID) -> Tag:
    stmt = select(Tag).where(Tag.user_id == user_id, Tag.name == data.name)
    result = await db.execute(stmt)
    tag = result.scalar_one_or_none()
    if tag:
        return tag
    return await create_tag(db, data, user_id)


async def update_tag(db: AsyncSession, tag_id: UUID, data: TagUpdate, user_id: UUID) -> Optional[Tag]:
    tag = await get_tag(db, tag_id, user_id)
    if not tag:
        return None
    if data.name is not None:
        tag.name = data.name
    if data.description is not None:
        tag.description = data.description
    await db.commit()
    await db.refresh(tag)
    return tag


async def delete_tag(db: AsyncSession, tag_id: UUID, user_id: UUID) -> bool:
    tag = await get_tag(db, tag_id, user_id)
    if not tag:
        return False
    stmt = select(Bookmark).where(Bookmark.tags.any(Tag.id == tag_id), Bookmark.is_deleted == False)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ValueError("该标签下存在书签，请先移除关联")
    await db.delete(tag)
    await db.commit()
    return True
