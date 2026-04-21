from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth import get_current_user_id
from app import crud
from app.schemas import TagCreate, TagUpdate, TagResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.get_tags(db, UUID(user_id))


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    data: TagCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await crud.create_tag(db, data, UUID(user_id))


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: UUID,
    data: TagUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    tag = await crud.update_tag(db, tag_id, data, UUID(user_id))
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    return tag


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    try:
        ok = await crud.delete_tag(db, tag_id, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not ok:
        raise HTTPException(status_code=404, detail="标签不存在")
    return {"detail": "标签已删除"}
