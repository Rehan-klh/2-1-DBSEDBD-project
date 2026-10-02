from datetime import datetime, date, time
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="Role selected on frontend: student or admin")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    student_id: Optional[int] = None
    name: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Student ---
class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    initial_room_id: Optional[int] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class StudentResponse(BaseModel):
    student_id: int
    user_id: int
    name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    email: Optional[str] = None
    current_room: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Hostels & Blocks ---
class BlockResponse(BaseModel):
    block_id: int
    hostel_id: int
    block_name: str

    model_config = ConfigDict(from_attributes=True)

class HostelResponse(BaseModel):
    hostel_id: int
    name: str
    location: Optional[str] = None
    blocks: List[BlockResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Rooms ---
class RoomCreate(BaseModel):
    block_id: int
    room_number: str
    floor: Optional[int] = None
    capacity: int = Field(gt=0)

class RoomUpdate(BaseModel):
    block_id: Optional[int] = None
    room_number: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = Field(default=None, gt=0)

class RoomResponse(BaseModel):
    room_id: int
    block_id: int
    block_name: Optional[str] = None
    room_number: str
    floor: Optional[int] = None
    capacity: int
    occupied_count: int = 0
    available_capacity: int = 0

    model_config = ConfigDict(from_attributes=True)

# --- Allocations ---
class AllocationCreateStudent(BaseModel):
    room_id: int

class AllocationCreateAdmin(BaseModel):
    student_id: int
    room_id: int

class AllocationTransferAdmin(BaseModel):
    new_room_id: int

class AllocationResponse(BaseModel):
    allocation_id: int
    student_id: int
    student_name: Optional[str] = None
    room_id: int
    room_number: Optional[str] = None
    block_name: Optional[str] = None
    allocated_at: datetime
    released_at: Optional[datetime] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- Room Changes ---
class RoomChangeCreate(BaseModel):
    requested_room_id: int
    reason: str

class RoomChangeUpdateStatus(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    admin_comment: Optional[str] = None

class RoomChangeResponse(BaseModel):
    request_id: int
    student_id: int
    student_name: Optional[str] = None
    current_room_id: int
    current_room_number: Optional[str] = None
    requested_room_id: int
    requested_room_number: Optional[str] = None
    reason: str
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Leave Requests ---
class LeaveCreate(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    reason: str

class LeaveUpdateStatus(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    admin_comment: Optional[str] = None

class LeaveResponse(BaseModel):
    leave_id: int
    student_id: int
    student_name: Optional[str] = None
    leave_type: str
    from_date: date
    to_date: date
    reason: str
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Complaints ---
class ComplaintCreate(BaseModel):
    category: str
    subject: str
    description: str
    priority: Optional[str] = "Medium"

class ComplaintUpdateStatus(BaseModel):
    status: str = Field(..., description="PENDING, IN_PROGRESS, or RESOLVED")
    admin_response: Optional[str] = None

class ComplaintResponse(BaseModel):
    complaint_id: int
    student_id: int
    student_name: Optional[str] = None
    category: str
    subject: str
    description: str
    priority: Optional[str] = None
    status: str
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Mess Menu ---
class MessMenuCreate(BaseModel):
    day: str
    meal_type: str  # BREAKFAST, LUNCH, SNACKS, DINNER
    menu_items: str

class MessMenuUpdate(BaseModel):
    day: Optional[str] = None
    meal_type: Optional[str] = None
    menu_items: Optional[str] = None

class MessMenuResponse(BaseModel):
    menu_id: int
    day: str
    meal_type: str
    menu_items: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Mess Feedback (MongoDB Atlas) ---
class MessFeedbackCreate(BaseModel):
    meal_type: str
    date: str
    rating: int = Field(ge=1, le=5)
    feedback: str

class MessFeedbackResponse(BaseModel):
    id: Optional[str] = None
    student_id: int
    meal_type: str
    date: str
    rating: int
    feedback: str
    created_at: str

# --- Fees ---
class FeeCreate(BaseModel):
    student_id: int
    fee_type: str
    amount: float
    paid_amount: float = 0.0
    due_date: Optional[date] = None
    status: str = "PENDING"

class FeeUpdate(BaseModel):
    paid_amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

class FeeResponse(BaseModel):
    fee_id: int
    student_id: int
    student_name: Optional[str] = None
    fee_type: str
    amount: float
    paid_amount: float
    due_date: Optional[date] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Visitor Requests ---
class VisitorCreate(BaseModel):
    visitor_name: str
    visitor_phone: Optional[str] = None
    relationship: Optional[str] = None
    purpose: Optional[str] = None
    visit_date: date
    entry_time: Optional[time] = None
    exit_time: Optional[time] = None

class VisitorUpdateStatus(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    admin_comment: Optional[str] = None

class VisitorResponse(BaseModel):
    visitor_request_id: int
    student_id: int
    student_name: Optional[str] = None
    visitor_name: str
    visitor_phone: Optional[str] = None
    relationship: Optional[str] = None
    purpose: Optional[str] = None
    visit_date: date
    entry_time: Optional[time] = None
    exit_time: Optional[time] = None
    status: str
    admin_comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Announcements ---
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: Optional[str] = "Normal"
    expires_at: Optional[datetime] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    expires_at: Optional[datetime] = None

class AnnouncementResponse(BaseModel):
    announcement_id: int
    created_by: int
    title: str
    content: str
    priority: Optional[str] = None
    published_at: datetime
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Notifications (MongoDB Atlas) ---
class NotificationResponse(BaseModel):
    id: Optional[str] = None
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

# --- Activity Logs (MongoDB Atlas) ---
class ActivityLogResponse(BaseModel):
    id: Optional[str] = None
    user_id: int
    role: str
    action: str
    entity: str
    entity_id: Optional[int] = None
    details: Dict[str, Any] = {}
    timestamp: str
