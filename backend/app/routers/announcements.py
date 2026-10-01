from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Announcement, User
from backend.app.schemas import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from backend.app.dependencies import get_current_user, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("", response_model=list[AnnouncementResponse])
def list_announcements(_ = Depends(get_current_user), db: Session = Depends(get_db)):
    announcements = db.query(Announcement).order_by(Announcement.published_at.desc()).all()
    return announcements

@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = Announcement(
        created_by=admin.user_id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        priority=payload.priority or "Normal",
        published_at=datetime.utcnow(),
        expires_at=payload.expires_at
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ANNOUNCEMENT_CREATED",
        entity="announcement",
        entity_id=announcement.announcement_id,
        details={"title": announcement.title}
    )

    return announcement

@router.put("/{id}", response_model=AnnouncementResponse)
def update_announcement(
    id: int,
    payload: AnnouncementUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == id).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    if payload.title is not None:
        announcement.title = payload.title.strip()
    if payload.content is not None:
        announcement.content = payload.content.strip()
    if payload.priority is not None:
        announcement.priority = payload.priority
    if payload.expires_at is not None:
        announcement.expires_at = payload.expires_at

    db.commit()
    db.refresh(announcement)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ANNOUNCEMENT_UPDATED",
        entity="announcement",
        entity_id=announcement.announcement_id,
        details={"title": announcement.title}
    )

    return announcement

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.announcement_id == id).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    db.delete(announcement)
    db.commit()

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ANNOUNCEMENT_DELETED",
        entity="announcement",
        entity_id=id
    )
    return None
