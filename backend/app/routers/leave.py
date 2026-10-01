from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import LeaveRequest, Student, User
from backend.app.schemas import LeaveCreate, LeaveUpdateStatus, LeaveResponse
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/leave", tags=["Leave"])

def _format_leave(leave: LeaveRequest, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == leave.student_id).first()
    return {
        "leave_id": leave.leave_id,
        "student_id": leave.student_id,
        "student_name": student.name if student else None,
        "leave_type": leave.leave_type,
        "from_date": leave.from_date,
        "to_date": leave.to_date,
        "reason": leave.reason,
        "status": leave.status,
        "admin_comment": leave.admin_comment,
        "created_at": leave.created_at,
        "updated_at": leave.updated_at
    }

@router.post("", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def submit_leave(payload: LeaveCreate, student: Student = Depends(require_student), db: Session = Depends(get_db)):
    if payload.to_date < payload.from_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="To date cannot be earlier than from date")

    leave = LeaveRequest(
        student_id=student.student_id,
        leave_type=payload.leave_type.strip(),
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason.strip(),
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Leave Request Submitted",
        message=f"Your {leave.leave_type} request from {leave.from_date} has been submitted.",
        type_="LEAVE"
    )

    return _format_leave(leave, db)

@router.get("/me", response_model=list[LeaveResponse])
def get_my_leaves(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.student_id == student.student_id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )
    return [_format_leave(l, db) for l in leaves]

@router.get("", response_model=list[LeaveResponse])
def list_leaves(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    return [_format_leave(l, db) for l in leaves]

@router.patch("/{id}", response_model=LeaveResponse)
def update_leave_status(
    id: int,
    payload: LeaveUpdateStatus,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.leave_id == id).first()
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    new_status = payload.status.upper().strip()
    if new_status not in ["APPROVED", "REJECTED", "PENDING"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be APPROVED or REJECTED")

    leave.status = new_status
    if payload.admin_comment is not None:
        leave.admin_comment = payload.admin_comment
    leave.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(leave)

    student = db.query(Student).filter(Student.student_id == leave.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title=f"Leave Request {new_status}",
            message=f"Your leave request has been {new_status.lower()}.",
            type_="LEAVE"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action=f"LEAVE_{new_status}",
        entity="leave_request",
        entity_id=leave.leave_id,
        details={"student_id": leave.student_id, "status": new_status}
    )

    return _format_leave(leave, db)
