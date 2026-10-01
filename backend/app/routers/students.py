from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Student, RoomAllocation, Room, HostelBlock, Complaint, LeaveRequest, Fee, MessMenu
from backend.app.schemas import (
    StudentResponse, StudentProfileUpdate, StudentCreate, StudentUpdate
)
from backend.app.dependencies import require_student, require_admin
from backend.app.security import hash_password
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/students", tags=["Students"])

def _format_student(student: Student, db: Session) -> dict:
    active_alloc = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.student_id == student.student_id, RoomAllocation.status == "ACTIVE")
        .first()
    )
    current_room = None
    if active_alloc:
        room = db.query(Room).filter(Room.room_id == active_alloc.room_id).first()
        if room:
            block = db.query(HostelBlock).filter(HostelBlock.block_id == room.block_id).first()
            # Find roommates
            roommates_allocs = (
                db.query(RoomAllocation)
                .filter(
                    RoomAllocation.room_id == room.room_id,
                    RoomAllocation.status == "ACTIVE",
                    RoomAllocation.student_id != student.student_id
                )
                .all()
            )
            roommate_names = []
            for a in roommates_allocs:
                s = db.query(Student).filter(Student.student_id == a.student_id).first()
                if s:
                    roommate_names.append(s.name)

            current_room = {
                "allocation_id": active_alloc.allocation_id,
                "room_id": room.room_id,
                "room_number": room.room_number,
                "block_name": block.block_name if block else "Unknown",
                "floor": room.floor,
                "capacity": room.capacity,
                "allocated_at": active_alloc.allocated_at.isoformat() if active_alloc.allocated_at else None,
                "roommates": roommate_names
            }

    return {
        "student_id": student.student_id,
        "user_id": student.user_id,
        "name": student.name,
        "phone": student.phone,
        "department": student.department,
        "year": student.year,
        "email": student.user.email if student.user else None,
        "current_room": current_room
    }

@router.get("/me", response_model=StudentResponse)
def get_my_profile(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    return _format_student(student, db)

@router.put("/me", response_model=StudentResponse)
def update_my_profile(payload: StudentProfileUpdate, student: Student = Depends(require_student), db: Session = Depends(get_db)):
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.department is not None:
        student.department = payload.department
    if payload.year is not None:
        student.year = payload.year
    db.commit()
    db.refresh(student)
    return _format_student(student, db)

@router.get("/me/dashboard")
def get_student_dashboard(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    student_data = _format_student(student, db)

    # Complaints
    complaints = (
        db.query(Complaint)
        .filter(Complaint.student_id == student.student_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    pending_complaints_count = sum(1 for c in complaints if c.status != "RESOLVED")

    # Leave requests
    leave_requests = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.student_id == student.student_id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )
    active_leave = leave_requests[0] if leave_requests else None

    # Fees
    fees = (
        db.query(Fee)
        .filter(Fee.student_id == student.student_id)
        .order_by(Fee.created_at.desc())
        .all()
    )

    # Mess Menu
    menu_items = db.query(MessMenu).all()

    # Notifications from MongoDB
    notifications = mongo_db.get_notifications(student.user_id)

    return {
        "student": student_data,
        "pending_complaints_count": pending_complaints_count,
        "active_leave": {
            "leave_id": active_leave.leave_id,
            "leave_type": active_leave.leave_type,
            "status": active_leave.status,
            "from_date": active_leave.from_date.isoformat(),
            "to_date": active_leave.to_date.isoformat(),
            "reason": active_leave.reason
        } if active_leave else None,
        "complaints": [
            {
                "complaint_id": c.complaint_id,
                "category": c.category,
                "subject": c.subject,
                "description": c.description,
                "priority": c.priority,
                "status": c.status,
                "created_at": c.created_at.isoformat()
            } for c in complaints
        ],
        "leave_requests": [
            {
                "leave_id": lr.leave_id,
                "leave_type": lr.leave_type,
                "from_date": lr.from_date.isoformat(),
                "to_date": lr.to_date.isoformat(),
                "reason": lr.reason,
                "status": lr.status,
                "created_at": lr.created_at.isoformat()
            } for lr in leave_requests
        ],
        "fees": [
            {
                "fee_id": f.fee_id,
                "fee_type": f.fee_type,
                "amount": float(f.amount),
                "paid_amount": float(f.paid_amount),
                "due_date": f.due_date.isoformat() if f.due_date else None,
                "status": f.status
            } for f in fees
        ],
        "menu": [
            {
                "menu_id": m.menu_id,
                "day": m.day,
                "meal_type": m.meal_type,
                "menu_items": m.menu_items
            } for m in menu_items
        ],
        "notifications": notifications[:10]
    }

@router.get("", response_model=list[StudentResponse])
def list_students(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return [_format_student(s, db) for s in students]

@router.get("/{id}", response_model=StudentResponse)
def get_student_by_id(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _format_student(student, db)

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role="STUDENT"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student = Student(
        user_id=user.user_id,
        name=payload.name.strip(),
        phone=payload.phone,
        department=payload.department,
        year=payload.year
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    if payload.initial_room_id:
        room = db.query(Room).filter(Room.room_id == payload.initial_room_id).first()
        if room:
            active_count = db.query(RoomAllocation).filter(
                RoomAllocation.room_id == room.room_id,
                RoomAllocation.status == "ACTIVE"
            ).count()
            if active_count < room.capacity:
                alloc = RoomAllocation(
                    student_id=student.student_id,
                    room_id=room.room_id,
                    status="ACTIVE"
                )
                db.add(alloc)
                db.commit()

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="STUDENT_CREATED",
        entity="student",
        entity_id=student.student_id,
        details={"name": student.name, "email": user.email}
    )

    return _format_student(student, db)

@router.put("/{id}", response_model=StudentResponse)
def update_student(id: int, payload: StudentUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if payload.name is not None:
        student.name = payload.name
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.department is not None:
        student.department = payload.department
    if payload.year is not None:
        student.year = payload.year

    db.commit()
    db.refresh(student)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="STUDENT_UPDATED",
        entity="student",
        entity_id=student.student_id,
        details={"name": student.name}
    )

    return _format_student(student, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    user = student.user
    db.delete(student)
    if user:
        db.delete(user)
    db.commit()

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="STUDENT_DELETED",
        entity="student",
        entity_id=id
    )
    return None
