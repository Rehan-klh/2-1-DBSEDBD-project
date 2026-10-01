from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Room, HostelBlock, RoomAllocation, User
from backend.app.schemas import RoomCreate, RoomUpdate, RoomResponse
from backend.app.dependencies import get_current_user, require_admin
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/rooms", tags=["Rooms"])

def _format_room(room: Room, db: Session) -> dict:
    occupied = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.room_id == room.room_id, RoomAllocation.status == "ACTIVE")
        .count()
    )
    block = db.query(HostelBlock).filter(HostelBlock.block_id == room.block_id).first()
    return {
        "room_id": room.room_id,
        "block_id": room.block_id,
        "block_name": block.block_name if block else "Unknown",
        "room_number": room.room_number,
        "floor": room.floor,
        "capacity": room.capacity,
        "occupied_count": occupied,
        "available_capacity": max(0, room.capacity - occupied)
    }

@router.get("", response_model=list[RoomResponse])
def list_rooms(_ = Depends(get_current_user), db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    return [_format_room(r, db) for r in rooms]

@router.get("/available", response_model=list[RoomResponse])
def list_available_rooms(_ = Depends(get_current_user), db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    formatted = [_format_room(r, db) for r in rooms]
    return [r for r in formatted if r["available_capacity"] > 0]

@router.get("/{id}", response_model=RoomResponse)
def get_room(id: int, _ = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.room_id == id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return _format_room(room, db)

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    block = db.query(HostelBlock).filter(HostelBlock.block_id == payload.block_id).first()
    if not block:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hostel block does not exist")

    existing = db.query(Room).filter(
        Room.block_id == payload.block_id,
        Room.room_number == payload.room_number.strip()
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists in this block")

    room = Room(
        block_id=payload.block_id,
        room_number=payload.room_number.strip(),
        floor=payload.floor,
        capacity=payload.capacity
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ROOM_CREATED",
        entity="room",
        entity_id=room.room_id,
        details={"room_number": room.room_number, "capacity": room.capacity}
    )

    return _format_room(room, db)

@router.put("/{id}", response_model=RoomResponse)
def update_room(id: int, payload: RoomUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.room_id == id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    occupied = (
        db.query(RoomAllocation)
        .filter(RoomAllocation.room_id == room.room_id, RoomAllocation.status == "ACTIVE")
        .count()
    )

    if payload.capacity is not None:
        if payload.capacity < occupied:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Capacity cannot be less than currently occupied spaces ({occupied})"
            )
        room.capacity = payload.capacity

    if payload.block_id is not None:
        block = db.query(HostelBlock).filter(HostelBlock.block_id == payload.block_id).first()
        if not block:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Block does not exist")
        room.block_id = payload.block_id

    if payload.room_number is not None:
        room.room_number = payload.room_number.strip()
    if payload.floor is not None:
        room.floor = payload.floor

    db.commit()
    db.refresh(room)

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ROOM_UPDATED",
        entity="room",
        entity_id=room.room_id,
        details={"room_number": room.room_number, "capacity": room.capacity}
    )

    return _format_room(room, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.room_id == id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    active_allocs = db.query(RoomAllocation).filter(
        RoomAllocation.room_id == room.room_id,
        RoomAllocation.status == "ACTIVE"
    ).count()
    if active_allocs > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete room with active student allocations. Release or transfer students first."
        )

    db.delete(room)
    db.commit()

    mongo_db.log_activity(
        user_id=admin.user_id,
        role="ADMIN",
        action="ROOM_DELETED",
        entity="room",
        entity_id=id
    )
    return None
