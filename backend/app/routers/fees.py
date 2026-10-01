from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Fee, Student, User
from backend.app.schemas import FeeCreate, FeeUpdate, FeeResponse
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/fees", tags=["Fees"])

def _format_fee(f: Fee, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == f.student_id).first()
    return {
        "fee_id": f.fee_id,
        "student_id": f.student_id,
        "student_name": student.name if student else None,
        "fee_type": f.fee_type,
        "amount": float(f.amount),
        "paid_amount": float(f.paid_amount),
        "due_date": f.due_date,
        "status": f.status,
        "created_at": f.created_at
    }

@router.get("/me", response_model=list[FeeResponse])
def get_my_fees(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    fees = db.query(Fee).filter(Fee.student_id == student.student_id).order_by(Fee.created_at.desc()).all()
    return [_format_fee(f, db) for f in fees]

@router.get("", response_model=list[FeeResponse])
def list_fees(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    fees = db.query(Fee).order_by(Fee.created_at.desc()).all()
    return [_format_fee(f, db) for f in fees]

@router.post("", response_model=FeeResponse, status_code=status.HTTP_201_CREATED)
def create_fee_record(
    payload: FeeCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    valid_statuses = ["PENDING", "PARTIAL", "PAID"]
    status_val = payload.status.upper().strip()
    if status_val not in valid_statuses:
        status_val = "PENDING"

    fee = Fee(
        student_id=student.student_id,
        fee_type=payload.fee_type.strip(),
        amount=payload.amount,
        paid_amount=payload.paid_amount,
        due_date=payload.due_date,
        status=status_val,
        created_at=datetime.utcnow()
    )
    db.add(fee)
    db.commit()
    db.refresh(fee)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Fee Record Added",
        message=f"{fee.fee_type} fee of Rs. {fee.amount} recorded.",
        type_="FEE"
    )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="FEE_RECORD_CREATED",
        entity="fee",
        entity_id=fee.fee_id,
        details={"student_id": student.student_id, "amount": float(fee.amount)}
    )

    return _format_fee(fee, db)

@router.patch("/{id}", response_model=FeeResponse)
def update_fee_record(
    id: int,
    payload: FeeUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    fee = db.query(Fee).filter(Fee.fee_id == id).first()
    if not fee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fee record not found")

    if payload.paid_amount is not None:
        fee.paid_amount = payload.paid_amount
        if float(fee.paid_amount) >= float(fee.amount):
            fee.status = "PAID"
        elif float(fee.paid_amount) > 0:
            fee.status = "PARTIAL"
        else:
            fee.status = "PENDING"

    if payload.status is not None:
        valid_statuses = ["PENDING", "PARTIAL", "PAID"]
        s = payload.status.upper().strip()
        if s in valid_statuses:
            fee.status = s

    if payload.due_date is not None:
        fee.due_date = payload.due_date

    db.commit()
    db.refresh(fee)

    student = db.query(Student).filter(Student.student_id == fee.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title="Fee Updated",
            message=f"Your {fee.fee_type} fee status is now {fee.status}.",
            type_="FEE"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="FEE_RECORD_UPDATED",
        entity="fee",
        entity_id=fee.fee_id,
        details={"status": fee.status, "paid_amount": float(fee.paid_amount)}
    )

    return _format_fee(fee, db)
