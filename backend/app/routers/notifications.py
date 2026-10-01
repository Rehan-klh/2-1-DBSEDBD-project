from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.models import User
from backend.app.schemas import NotificationResponse
from backend.app.dependencies import get_current_user
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=list[NotificationResponse])
def get_my_notifications(current_user: User = Depends(get_current_user)):
    docs = mongo_db.get_notifications(current_user.user_id)
    return [
        NotificationResponse(
            id=d.get("_id"),
            user_id=d["user_id"],
            title=d["title"],
            message=d["message"],
            type=d.get("type", "GENERAL"),
            is_read=d.get("is_read", False),
            created_at=d.get("created_at", "")
        )
        for d in docs
    ]

@router.patch("/{id}/read")
def mark_read(id: str, current_user: User = Depends(get_current_user)):
    success = mongo_db.mark_notification_read(id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification marked as read"}
