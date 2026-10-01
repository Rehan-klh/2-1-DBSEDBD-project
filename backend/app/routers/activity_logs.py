from fastapi import APIRouter, Depends, Query
from backend.app.models import User
from backend.app.schemas import ActivityLogResponse
from backend.app.dependencies import require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

@router.get("", response_model=list[ActivityLogResponse])
def get_activity_logs(
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(require_admin)
):
    docs = mongo_db.get_activity_logs(limit=limit)
    return [
        ActivityLogResponse(
            id=d.get("_id"),
            user_id=d.get("user_id", 0),
            role=d.get("role", ""),
            action=d.get("action", ""),
            entity=d.get("entity", ""),
            entity_id=d.get("entity_id"),
            details=d.get("details", {}),
            timestamp=d.get("timestamp", "")
        )
        for d in docs
    ]
