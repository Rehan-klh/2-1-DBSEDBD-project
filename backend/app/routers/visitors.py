from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import VisitorRequest, Student, User
from backend.app.schemas import VisitorCreate, VisitorUpdateStatus, VisitorResponse
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/visitors", tags=["Visitors"])

def _format_visitor(v: VisitorRequest, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == v.student_id).first()
    return {
        "visitor_request_id": v.visitor_request_id,
        "student_id": v.student_id,
        "student_name": student.name if student else None,
        "visitor_name": v.visitor_name,
        "visitor_phone": v.visitor_phone,
        "relationship": v.visitor_relation,
        "purpose": v.purpose,
        "visit_date": v.visit_date,
        "entry_time": v.entry_time,
        "exit_time": v.exit_time,
        "status": v.status,
        "admin_comment": v.admin_comment,
        "created_at": v.created_at
    }

@router.post("", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
def submit_visitor_request(
    payload: VisitorCreate,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db)
):
    req = VisitorRequest(
        student_id=student.student_id,
        visitor_name=payload.visitor_name.strip(),
        visitor_phone=payload.visitor_phone,
        visitor_relation=payload.relationship,
        purpose=payload.purpose,
        visit_date=payload.visit_date,
        entry_time=payload.entry_time,
        exit_time=payload.exit_time,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Visitor Request Submitted",
        message=f"Visitor request for {req.visitor_name} on {req.visit_date} submitted.",
        type_="VISITOR"
    )

    return _format_visitor(req, db)

@router.get("/me", response_model=list[VisitorResponse])
def get_my_visitor_requests(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    reqs = (
        db.query(VisitorRequest)
        .filter(VisitorRequest.student_id == student.student_id)
        .order_by(VisitorRequest.created_at.desc())
        .all()
    )
    return [_format_visitor(r, db) for r in reqs]

@router.get("", response_model=list[VisitorResponse])
def list_visitor_requests(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    reqs = db.query(VisitorRequest).order_by(VisitorRequest.created_at.desc()).all()
    return [_format_visitor(r, db) for r in reqs]

@router.patch("/{id}", response_model=VisitorResponse)
def update_visitor_status(
    id: int,
    payload: VisitorUpdateStatus,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(VisitorRequest).filter(VisitorRequest.visitor_request_id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor request not found")

    new_status = payload.status.upper().strip()
    if new_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be APPROVED or REJECTED")

    req.status = new_status
    if payload.admin_comment is not None:
        req.admin_comment = payload.admin_comment
    db.commit()
    db.refresh(req)

    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title=f"Visitor Request {new_status}",
            message=f"Your visitor request for {req.visitor_name} has been {new_status.lower()}.",
            type_="VISITOR"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action=f"VISITOR_{new_status}",
        entity="visitor_request",
        entity_id=req.visitor_request_id,
        details={"visitor_name": req.visitor_name, "status": new_status}
    )

    return _format_visitor(req, db)
