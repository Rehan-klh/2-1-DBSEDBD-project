from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Complaint, Student, User
from backend.app.schemas import ComplaintCreate, ComplaintUpdateStatus, ComplaintResponse
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def _format_complaint(c: Complaint, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == c.student_id).first()
    return {
        "complaint_id": c.complaint_id,
        "student_id": c.student_id,
        "student_name": student.name if student else None,
        "category": c.category,
        "subject": c.subject,
        "description": c.description,
        "priority": c.priority,
        "status": c.status,
        "admin_response": c.admin_response,
        "created_at": c.created_at,
        "updated_at": c.updated_at
    }

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(payload: ComplaintCreate, student: Student = Depends(require_student), db: Session = Depends(get_db)):
    complaint = Complaint(
        student_id=student.student_id,
        category=payload.category.strip(),
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        priority=payload.priority or "Medium",
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Complaint Submitted",
        message=f"Complaint '{complaint.subject}' logged successfully.",
        type_="COMPLAINT"
    )

    return _format_complaint(complaint, db)

@router.get("/me", response_model=list[ComplaintResponse])
def get_my_complaints(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    complaints = (
        db.query(Complaint)
        .filter(Complaint.student_id == student.student_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return [_format_complaint(c, db) for c in complaints]

@router.get("", response_model=list[ComplaintResponse])
def list_complaints(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [_format_complaint(c, db) for c in complaints]

@router.patch("/{id}", response_model=ComplaintResponse)
def update_complaint_status(
    id: int,
    payload: ComplaintUpdateStatus,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    new_status = payload.status.upper().strip()
    if new_status not in ["PENDING", "IN_PROGRESS", "RESOLVED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be PENDING, IN_PROGRESS, or RESOLVED")

    complaint.status = new_status
    if payload.admin_response is not None:
        complaint.admin_response = payload.admin_response
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)

    student = db.query(Student).filter(Student.student_id == complaint.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title="Complaint Updated",
            message=f"Your complaint '{complaint.subject}' is now {new_status}.",
            type_="COMPLAINT"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action=f"COMPLAINT_{new_status}",
        entity="complaint",
        entity_id=complaint.complaint_id,
        details={"status": new_status, "student_id": complaint.student_id}
    )

    return _format_complaint(complaint, db)
