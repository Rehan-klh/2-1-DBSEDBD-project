from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import RoomAllocation, Room, Student, HostelBlock, User
from backend.app.schemas import (
    AllocationCreateStudent, AllocationCreateAdmin, AllocationTransferAdmin, AllocationResponse
)
from backend.app.dependencies import require_student, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/allocations", tags=["Allocations"])

def _format_allocation(alloc: RoomAllocation, db: Session) -> dict:
    student = db.query(Student).filter(Student.student_id == alloc.student_id).first()
    room = db.query(Room).filter(Room.room_id == alloc.room_id).first()
    block = db.query(HostelBlock).filter(HostelBlock.block_id == room.block_id).first() if room else None
    return {
        "allocation_id": alloc.allocation_id,
        "student_id": alloc.student_id,
        "student_name": student.name if student else None,
        "room_id": alloc.room_id,
        "room_number": room.room_number if room else None,
        "block_name": block.block_name if block else None,
        "allocated_at": alloc.allocated_at,
        "released_at": alloc.released_at,
        "status": alloc.status
    }

@router.get("/me", response_model=AllocationResponse)
def get_my_allocation(student: Student = Depends(require_student), db: Session = Depends(get_db)):
    alloc = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.student_id == student.student_id, RoomAllocation.status == "ACTIVE")
        .first()
    )
    if not alloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active room allocation found")
    return _format_allocation(alloc, db)

@router.post("", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def student_select_room(
    payload: AllocationCreateStudent,
    student: Student = Depends(require_student),
    db: Session = Depends(get_db)
):
    # Check if student already has active allocation
    existing = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.student_id == student.student_id, RoomAllocation.status == "ACTIVE")
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already has an active room allocation. Use Room Change Request to change rooms."
        )

    # Check room exists
    room = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Check capacity
    occupied = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.room_id == room.room_id, RoomAllocation.status == "ACTIVE")
        .count()
    )
    if occupied >= room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is already at full capacity"
        )

    alloc = RoomAllocation(
        student_id=student.student_id,
        room_id=room.room_id,
        status="ACTIVE",
        allocated_at=datetime.utcnow()
    )
    db.add(alloc)
    db.commit()
    db.refresh(alloc)

    # Create MongoDB notification & activity log
    mongo_db.create_notification(
        user_id=student.user_id,
        title="Room Allocated",
        message=f"You have successfully selected room {room.room_number}.",
        type_="ALLOCATION"
    )
    mongo_db.log_activity(
        user_id=student.user_id,
        role="STUDENT",
        action="ROOM_SELECTED",
        entity="room_allocation",
        entity_id=alloc.allocation_id,
        details={"room_id": room.room_id, "room_number": room.room_number}
    )

    return _format_allocation(alloc, db)

@router.get("", response_model=list[AllocationResponse])
def list_allocations(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    allocs = db.query(RoomAllocation).order_by(RoomAllocation.allocated_at.desc()).all()
    return [_format_allocation(a, db) for a in allocs]

@router.post("/admin", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def admin_allocate_student(
    payload: AllocationCreateAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    room = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Check capacity
    occupied = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.room_id == room.room_id, RoomAllocation.status == "ACTIVE")
        .count()
    )
    if occupied >= room.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected room is full")

    # Safely release any existing active allocation for this student
    existing_alloc = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.student_id == student.student_id, RoomAllocation.status == "ACTIVE")
        .first()
    )
    if existing_alloc:
        existing_alloc.status = "RELEASED"
        existing_alloc.released_at = datetime.utcnow()

    new_alloc = RoomAllocation(
        student_id=student.student_id,
        room_id=room.room_id,
        status="ACTIVE",
        allocated_at=datetime.utcnow()
    )
    db.add(new_alloc)
    db.commit()
    db.refresh(new_alloc)

    mongo_db.create_notification(
        user_id=student.user_id,
        title="Room Assigned",
        message=f"Administrator allocated you to room {room.room_number}.",
        type_="ALLOCATION"
    )
    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ADMIN_ROOM_ALLOCATED",
        entity="room_allocation",
        entity_id=new_alloc.allocation_id,
        details={"student_id": student.student_id, "room_id": room.room_id}
    )

    return _format_allocation(new_alloc, db)

@router.patch("/{id}/transfer", response_model=AllocationResponse)
def admin_transfer_allocation(
    id: int,
    payload: AllocationTransferAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alloc = db.query(RoomAllocation).filter(RoomAllocation.allocation_id == id).first()
    if not alloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    if alloc.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only transfer active allocations")

    new_room = db.query(Room).filter(Room.room_id == payload.new_room_id).first()
    if not new_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target room not found")

    occupied = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.room_id == new_room.room_id, RoomAllocation.status == "ACTIVE")
        .count()
    )
    if occupied >= new_room.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target room is full")

    old_room_id = alloc.room_id
    alloc.status = "RELEASED"
    alloc.released_at = datetime.utcnow()

    new_alloc = RoomAllocation(
        student_id=alloc.student_id,
        room_id=new_room.room_id,
        status="ACTIVE",
        allocated_at=datetime.utcnow()
    )
    db.add(new_alloc)
    db.commit()
    db.refresh(new_alloc)

    student = db.query(Student).filter(Student.student_id == alloc.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title="Room Transferred",
            message=f"You have been transferred to room {new_room.room_number}.",
            type_="ALLOCATION"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ROOM_ALLOCATION_TRANSFERRED",
        entity="room_allocation",
        entity_id=new_alloc.allocation_id,
        details={"old_room_id": old_room_id, "new_room_id": new_room.room_id, "student_id": alloc.student_id}
    )

    return _format_allocation(new_alloc, db)

@router.delete("/{id}", response_model=AllocationResponse)
def release_allocation(id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    alloc = db.query(RoomAllocation).filter(RoomAllocation.allocation_id == id).first()
    if not alloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    if alloc.status == "RELEASED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation already released")

    alloc.status = "RELEASED"
    alloc.released_at = datetime.utcnow()
    db.commit()
    db.refresh(alloc)

    student = db.query(Student).filter(Student.student_id == alloc.student_id).first()
    if student:
        mongo_db.create_notification(
            user_id=student.user_id,
            title="Room Released",
            message="Your room allocation has been released.",
            type_="ALLOCATION"
        )

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ROOM_ALLOCATION_RELEASED",
        entity="room_allocation",
        entity_id=alloc.allocation_id,
        details={"student_id": alloc.student_id, "room_id": alloc.room_id}
    )

    return _format_allocation(alloc, db)
