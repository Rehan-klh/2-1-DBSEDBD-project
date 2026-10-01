from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import MessMenu, Student, User
from backend.app.schemas import (
    MessMenuCreate, MessMenuUpdate, MessMenuResponse,
    MessFeedbackCreate, MessFeedbackResponse
)
from backend.app.dependencies import get_current_user, require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/mess", tags=["Mess"])

@router.get("/menu", response_model=list[MessMenuResponse])
def get_menu(_ = Depends(get_current_user), db: Session = Depends(get_db)):
    menu = db.query(MessMenu).all()
    return menu

@router.post("/menu", response_model=MessMenuResponse, status_code=status.HTTP_201_CREATED)
def create_menu_entry(
    payload: MessMenuCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    valid_meals = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]
    if payload.meal_type.upper() not in valid_meals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Meal type must be one of {valid_meals}"
        )

    entry = MessMenu(
        day=payload.day.capitalize().strip(),
        meal_type=payload.meal_type.upper().strip(),
        menu_items=payload.menu_items.strip(),
        created_at=datetime.utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="MENU_ENTRY_CREATED",
        entity="mess_menu",
        entity_id=entry.menu_id,
        details={"day": entry.day, "meal_type": entry.meal_type}
    )

    return entry

@router.put("/menu/{id}", response_model=MessMenuResponse)
def update_menu_entry(
    id: int,
    payload: MessMenuUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    entry = db.query(MessMenu).filter(MessMenu.menu_id == id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu entry not found")

    if payload.day is not None:
        entry.day = payload.day.capitalize().strip()
    if payload.meal_type is not None:
        valid_meals = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]
        if payload.meal_type.upper() not in valid_meals:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Meal type must be one of {valid_meals}")
        entry.meal_type = payload.meal_type.upper().strip()
    if payload.menu_items is not None:
        entry.menu_items = payload.menu_items.strip()

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="MENU_ENTRY_UPDATED",
        entity="mess_menu",
        entity_id=entry.menu_id,
        details={"day": entry.day, "meal_type": entry.meal_type}
    )

    return entry

@router.delete("/menu/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_entry(id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    entry = db.query(MessMenu).filter(MessMenu.menu_id == id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu entry not found")

    db.delete(entry)
    db.commit()

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="MENU_ENTRY_DELETED",
        entity="mess_menu",
        entity_id=id
    )
    return None

# --- Mess Feedback (MongoDB Atlas) ---

@router.post("/feedback", response_model=MessFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: MessFeedbackCreate, student: Student = Depends(require_student)):
    doc = mongo_db.create_mess_feedback(
        student_id=student.student_id,
        meal_type=payload.meal_type.upper(),
        date=payload.date,
        rating=payload.rating,
        feedback=payload.feedback.strip()
    )
    return MessFeedbackResponse(
        id=doc.get("_id"),
        student_id=doc["student_id"],
        meal_type=doc["meal_type"],
        date=doc["date"],
        rating=doc["rating"],
        feedback=doc["feedback"],
        created_at=doc["created_at"]
    )

@router.get("/feedback/me", response_model=list[MessFeedbackResponse])
def get_my_feedback(student: Student = Depends(require_student)):
    docs = mongo_db.get_student_mess_feedback(student.student_id)
    return [
        MessFeedbackResponse(
            id=d.get("_id"),
            student_id=d["student_id"],
            meal_type=d["meal_type"],
            date=d["date"],
            rating=d["rating"],
            feedback=d["feedback"],
            created_at=d["created_at"]
        )
        for d in docs
    ]

@router.get("/feedback", response_model=list[MessFeedbackResponse])
def list_all_feedback(_: User = Depends(require_admin)):
    docs = mongo_db.get_all_mess_feedback()
    return [
        MessFeedbackResponse(
            id=d.get("_id"),
            student_id=d["student_id"],
            meal_type=d["meal_type"],
            date=d["date"],
            rating=d["rating"],
            feedback=d["feedback"],
            created_at=d["created_at"]
        )
        for d in docs
    ]
