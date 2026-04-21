import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from bs4 import BeautifulSoup
from app.database import get_db
from app.auth import get_current_user_id
from app import crud
from app.schemas import (
    BookmarkCreate,
    BookmarkUpdate,
    BookmarkResponse,
    RequiredToggleRequest,
    ExportData,
    ExportBookmarkItem,
    ExportTagItem,
    SuggestionResponse,
    TagCreate,
)

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("/", response_model=List[BookmarkResponse])
async def list_bookmarks(
    tag_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.get_bookmarks(db, UUID(user_id), tag_id=tag_id)


@router.post("/", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.create_bookmark(db, data, UUID(user_id))


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: UUID,
    data: BookmarkUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    bookmark = await crud.update_bookmark(db, bookmark_id, data, UUID(user_id))
    if not bookmark:
        raise HTTPException(status_code=404, detail="书签不存在")
    return bookmark


@router.delete("/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ok = await crud.soft_delete_bookmark(db, bookmark_id, UUID(user_id))
    if not ok:
        raise HTTPException(status_code=404, detail="书签不存在")
    return {"detail": "已移至回收站"}


@router.post("/{bookmark_id}/click")
async def click_bookmark(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ok = await crud.record_click(db, bookmark_id, UUID(user_id))
    if not ok:
        raise HTTPException(status_code=404, detail="书签不存在")
    return {"detail": "点击已记录"}


@router.post("/{bookmark_id}/required", response_model=BookmarkResponse)
async def toggle_required(
    bookmark_id: UUID,
    req: RequiredToggleRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    try:
        bookmark = await crud.toggle_required(db, bookmark_id, req.is_required, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not bookmark:
        raise HTTPException(status_code=404, detail="书签不存在")
    return bookmark


@router.get("/required", response_model=List[BookmarkResponse])
async def get_required(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.get_required_bookmarks(db, UUID(user_id))


@router.get("/top", response_model=List[BookmarkResponse])
async def get_top(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.get_top_bookmarks(db, UUID(user_id))


@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    bookmarks = await crud.get_suggestions(db, UUID(user_id))
    now = datetime.now(timezone.utc)
    result = []
    for b in bookmarks:
        days = None
        if b.last_clicked_at:
            days = (now - b.last_clicked_at).days
        result.append(SuggestionResponse(bookmark=BookmarkResponse.model_validate(b), days_since_click=days))
    return result


@router.post("/{bookmark_id}/dismiss")
async def dismiss_suggestion(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ok = await crud.dismiss_suggestion(db, bookmark_id, UUID(user_id))
    if not ok:
        raise HTTPException(status_code=404, detail="书签不存在")
    return {"detail": "已忽略 30 天"}


@router.get("/deleted", response_model=List[BookmarkResponse])
async def list_deleted(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.get_bookmarks(db, UUID(user_id), include_deleted=True)


@router.post("/{bookmark_id}/restore", response_model=BookmarkResponse)
async def restore_bookmark(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ok = await crud.restore_bookmark(db, bookmark_id, UUID(user_id))
    if not ok:
        raise HTTPException(status_code=404, detail="书签不存在")
    bookmark = await crud.get_bookmark(db, bookmark_id, UUID(user_id))
    return bookmark


@router.delete("/{bookmark_id}/permanent")
async def permanent_delete(
    bookmark_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    ok = await crud.permanent_delete_bookmark(db, bookmark_id, UUID(user_id))
    if not ok:
        raise HTTPException(status_code=404, detail="书签不存在")
    return {"detail": "已彻底删除"}


@router.get("/export")
async def export_bookmarks(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    bookmarks = await crud.get_bookmarks(db, UUID(user_id))
    tags = await crud.get_tags(db, UUID(user_id))

    tag_map = {t.id: t.name for t in tags}
    export_bookmarks = []
    for b in bookmarks:
        export_bookmarks.append(
            ExportBookmarkItem(
                url=b.url,
                title=b.title,
                description=b.description,
                tags=[tag_map.get(t.id, t.name) for t in b.tags],
                click_count=b.click_count,
                last_clicked_at=b.last_clicked_at.isoformat() if b.last_clicked_at else None,
            )
        )
    export_tags = [ExportTagItem(name=t.name, description=t.description) for t in tags]

    data = ExportData(
        exported_at=datetime.now(timezone.utc).isoformat(),
        bookmarks=export_bookmarks,
        tags=export_tags,
    )
    return data


@router.post("/import")
async def import_bookmarks(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = UUID(user_id)
    content = await file.read()
    text = content.decode("utf-8")

    imported_count = 0
    created_tags = {}

    # Try JSON first
    try:
        data = json.loads(text)
        bookmarks_data = data.get("bookmarks", [])
        tags_data = data.get("tags", [])
        for t in tags_data:
            tag = await crud.create_tag(db, TagCreate(name=t["name"], description=t.get("description")), uid)
            created_tags[t["name"]] = tag
        for b in bookmarks_data:
            tag_ids = []
            for tag_name in b.get("tags", []):
                if tag_name not in created_tags:
                    tag = await crud.create_tag(db, TagCreate(name=tag_name), uid)
                    created_tags[tag_name] = tag
                tag_ids.append(created_tags[tag_name].id)
            await crud.create_bookmark(
                db,
                BookmarkCreate(url=b["url"], title=b["title"], description=b.get("description"), tag_ids=tag_ids),
                uid,
            )
            imported_count += 1
        return {"detail": f"成功导入 {imported_count} 个书签"}
    except (json.JSONDecodeError, KeyError):
        pass

    # Fallback to Netscape HTML
    soup = BeautifulSoup(text, "html.parser")
    links = soup.find_all("a")
    for link in links:
        href = link.get("href", "")
        title = link.get_text(strip=True) or href
        tags_attr = link.get("tags", "")
        tag_names = [t.strip() for t in tags_attr.split(",") if t.strip()]
        tag_ids = []
        for tag_name in tag_names:
            if tag_name not in created_tags:
                tag = await crud.create_tag(db, crud.schemas.TagCreate(name=tag_name), uid)
                created_tags[tag_name] = tag
            tag_ids.append(created_tags[tag_name].id)
        await crud.create_bookmark(
            db,
            BookmarkCreate(url=href, title=title, tag_ids=tag_ids if tag_ids else []),
            uid,
        )
        imported_count += 1

    return {"detail": f"成功导入 {imported_count} 个书签"}
