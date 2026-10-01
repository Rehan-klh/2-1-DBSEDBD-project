from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Hostel, HostelBlock
from backend.app.schemas import HostelResponse, BlockResponse
from backend.app.dependencies import get_current_user

router = APIRouter(prefix="/hostels", tags=["Hostels"])

@router.get("", response_model=list[HostelResponse])
def list_hostels(_ = Depends(get_current_user), db: Session = Depends(get_db)):
    hostels = db.query(Hostel).all()
    return hostels

@router.get("/{id}/blocks", response_model=list[BlockResponse])
def list_blocks(id: int, _ = Depends(get_current_user), db: Session = Depends(get_db)):
    hostel = db.query(Hostel).filter(Hostel.hostel_id == id).first()
    if not hostel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hostel not found")
    blocks = db.query(HostelBlock).filter(HostelBlock.hostel_id == id).all()
    return blocks
