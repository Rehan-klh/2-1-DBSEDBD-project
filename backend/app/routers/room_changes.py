from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import RoomChangeRequest, RoomAllocation, Room, Student, User
from backend.app.schemas import RoomChangeCreate, RoomChangeUpdateStatus, RoomChangeResponse
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/room-changes", tags=["Room Changes"])

def _format_room_change(rc: RoomChangeRequest, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == rc.student_id).first()
    curr_room = db.query(Room).filter(Room.room_id == rc.current_room_id).first()
    req_room = db.query(Room).filter(Room.room_id == rc.requested_room_id).first()
    return {
        "request_id": rc.request_id,
        "student_id": rc.student_id,
        "student_name": student.name if student else None,
        "current_room_id": rc.current_room_id,
        "current_room_number": curr_room.room_number if curr_room else None,
        "requested_room_id": rc.requested_room_id,
        "requested_room_number": req_room.room_number if req_room else None,
        "reason": rc.reason,
        "status": rc.status,
        "admin_comment": rc.admin_comment,
        "created_at": rc.created_at,
        "updated_at": rc.updated_at
    }

@router.post("", response_model=RoomChangeResponse, status_code=status.HTTP_201_CREATED)
def submit_room_change(
    payload: RoomChangeCreate,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db)
):
    current_alloc = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.student_id == student.student_id, RoomAllocation.status == "ACTIVE")
        .first()
    )
    if not current_alloc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must have an active room allocation to request a room change"
        )

    if current_alloc.room_id == payload.requested_room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested room must be different from current room"
        )

    req_room = db.query(Room).filter(Room.room_id == payload.requested_room_id).first()
    if not req_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requested room does not exist")

    req = RoomChangeRequest(
        student_id=student.student_id,
        current_room_id=current_alloc.room_id,
        requested_room_id=payload.requested_room_id,
        reason=payload.reason.strip(),
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Room Change Requested",
        message=f"Request to change to room {req_room.room_number} submitted.",
        type_="ROOM_CHANGE"
    )

    return _format_room_change(req, db)

@router.get("/me", response_model=list[RoomChangeResponse])
def get_my_room_changes(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    reqs = (
        db.query(RoomChangeRequest)
        .filter(RoomChangeRequest.student_id == student.student_id)
        .order_by(RoomChangeRequest.created_at.desc())
        .all()
    )
    return [_format_room_change(r, db) for r in reqs]

@router.get("", response_model=list[RoomChangeResponse])
def list_all_room_changes(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    reqs = db.query(RoomChangeRequest).order_by(RoomChangeRequest.created_at.desc()).all()
    return [_format_room_change(r, db) for r in reqs]

@router.patch("/{id}", response_model=RoomChangeResponse)
def update_room_change_status(
    id: int,
    payload: RoomChangeUpdateStatus,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(RoomChangeRequest).filter(RoomChangeRequest.request_id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room change request not found")

    new_status = payload.status.upper().strip()
    if new_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be APPROVED or REJECTED")

    if new_status == "APPROVED":
        # Check capacity of requested room
        target_room = db.query(Room).filter(Room.room_id == req.requested_room_id).first()
        if not target_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target room does not exist")

        occupied = (
            db.query(RoomAllocation)
            .filter(RoomAllocation.room_id == target_room.room_id, RoomAllocation.status == "ACTIVE")
            .count()
        )
        if occupied >= target_room.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve: requested room is already full"
            )

        # Safely release old active allocation
        active_alloc = (
            db.query(RoomAllocation)
            .filter(RoomAllocation.student_id == req.student_id, RoomAllocation.status == "ACTIVE")
            .first()
        )
        if active_alloc:
            active_alloc.status = "RELEASED"
            active_alloc.released_at = datetime.utcnow()

        # Create new active allocation
        new_alloc = RoomAllocation(
            student_id=req.student_id,
            room_id=target_room.room_id,
            status="ACTIVE",
            allocated_at=datetime.utcnow()
        )
        db.add(new_alloc)

    req.status = new_status
    if payload.admin_comment is not None:
        req.admin_comment = payload.admin_comment
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title=f"Room Change {new_status}",
            message=f"Your room change request has been {new_status.lower()}.",
            type_="ROOM_CHANGE"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action=f"ROOM_CHANGE_{new_status}",
        entity="room_change_request",
        entity_id=req.request_id,
        details={"student_id": req.student_id, "new_room_id": req.requested_room_id}
    )

    return _format_room_change(req, db)
