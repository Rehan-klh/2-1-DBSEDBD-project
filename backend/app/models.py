from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Date, Time, DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # STUDENT or ADMIN
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="creator")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)

    user = relationship("User", back_populates="student")
    allocations = relationship("RoomAllocation", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="student", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="student", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="student", cascade="all, delete-orphan")
    room_change_requests = relationship("RoomChangeRequest", back_populates="student", cascade="all, delete-orphan")
    visitor_requests = relationship("VisitorRequest", back_populates="student", cascade="all, delete-orphan")


class Hostel(Base):
    __tablename__ = "hostels"

    hostel_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)

    blocks = relationship("HostelBlock", back_populates="hostel", cascade="all, delete-orphan")


class HostelBlock(Base):
    __tablename__ = "hostel_blocks"

    block_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hostel_id = Column(Integer, ForeignKey("hostels.hostel_id"), nullable=False)
    block_name = Column(String(100), nullable=False)

    hostel = relationship("Hostel", back_populates="blocks")
    rooms = relationship("Room", back_populates="block", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    block_id = Column(Integer, ForeignKey("hostel_blocks.block_id"), nullable=False)
    room_number = Column(String(20), nullable=False)
    floor = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=False)

    block = relationship("HostelBlock", back_populates="rooms")
    allocations = relationship("RoomAllocation", back_populates="room", cascade="all, delete-orphan")


class RoomAllocation(Base):
    __tablename__ = "room_allocations"

    allocation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    allocated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE or RELEASED

    student = relationship("Student", back_populates="allocations")
    room = relationship("Room", back_populates="allocations")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    leave_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    leave_type = Column(String(50), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="leave_requests")


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    category = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=True)  # Low, Medium, High
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, IN_PROGRESS, RESOLVED
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="complaints")


class Fee(Base):
    __tablename__ = "fees"

    fee_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    fee_type = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, PARTIAL, PAID
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship("Student", back_populates="fees")


class MessMenu(Base):
    __tablename__ = "mess_menu"

    menu_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    day = Column(String(20), nullable=False)
    meal_type = Column(String(30), nullable=False)  # BREAKFAST, LUNCH, SNACKS, DINNER
    menu_items = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)


class RoomChangeRequest(Base):
    __tablename__ = "room_change_requests"

    request_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    current_room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    requested_room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="room_change_requests")
    current_room = relationship("Room", foreign_keys=[current_room_id])
    requested_room = relationship("Room", foreign_keys=[requested_room_id])


class VisitorRequest(Base):
    __tablename__ = "visitor_requests"

    visitor_request_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    visitor_name = Column(String(150), nullable=False)
    visitor_phone = Column(String(20), nullable=True)
    visitor_relation = Column("relationship", String(50), nullable=True)
    purpose = Column(Text, nullable=True)
    visit_date = Column(Date, nullable=False)
    entry_time = Column(Time, nullable=True)
    exit_time = Column(Time, nullable=True)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship("Student", back_populates="visitor_requests")


class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), nullable=True)
    published_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    creator = relationship("User", back_populates="announcements")
