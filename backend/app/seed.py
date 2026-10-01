from datetime import datetime, date
from backend.app.database import engine, SessionLocal, Base
from backend.app.models import (
    User, Student, Hostel, HostelBlock, Room, RoomAllocation,
    LeaveRequest, Complaint, Fee, MessMenu, Announcement
)
from backend.app.security import hash_password
from backend.app.mongodb import mongo_db

def seed_database(force_reseed: bool = False):
    if force_reseed:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if not force_reseed:
            existing_admin = db.query(User).filter(User.email == "admin@klh.edu.in").first()
            if existing_admin:
                print("Database already contains seed data.")
                return

        print("Seeding database...")

        # 1. Admin User
        admin_user = User(
            email="admin@klh.edu.in",
            password_hash=hash_password("Admin@123"),
            role="ADMIN",
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        # 2. Student Users & Profiles
        students_data = [
            {
                "email": "aarav.sharma@klh.edu.in",
                "password": "Student@123",
                "name": "Aarav Sharma",
                "phone": "+91 98765 43012",
                "department": "Computer Science & Engineering",
                "year": 3
            },
            {
                "email": "student@klh.edu.in",
                "password": "Student@123",
                "name": "Aarav Sharma",
                "phone": "+91 98765 43012",
                "department": "Computer Science & Engineering",
                "year": 3
            },
            {
                "email": "meera.iyer@klh.edu.in",
                "password": "Student@123",
                "name": "Meera Iyer",
                "phone": "+91 98765 43013",
                "department": "Electronics & Communication",
                "year": 3
            },
            {
                "email": "kiran.reddy@klh.edu.in",
                "password": "Student@123",
                "name": "Kiran Reddy",
                "phone": "+91 98765 43014",
                "department": "Mechanical Engineering",
                "year": 2
            },
            {
                "email": "nisha.khan@klh.edu.in",
                "password": "Student@123",
                "name": "Nisha Khan",
                "phone": "+91 98765 43015",
                "department": "Computer Science & Engineering",
                "year": 2
            }
        ]

        created_students = []
        for s_data in students_data:
            # Check duplicate email
            if db.query(User).filter(User.email == s_data["email"]).first():
                continue
            u = User(
                email=s_data["email"],
                password_hash=hash_password(s_data["password"]),
                role="STUDENT",
                created_at=datetime.utcnow()
            )
            db.add(u)
            db.commit()
            db.refresh(u)

            s = Student(
                user_id=u.user_id,
                name=s_data["name"],
                phone=s_data["phone"],
                department=s_data["department"],
                year=s_data["year"]
            )
            db.add(s)
            db.commit()
            db.refresh(s)
            created_students.append(s)

        # 3. Hostels & Blocks
        hostel = Hostel(name="KLH University Residential Complex", location="Campus North Wing")
        db.add(hostel)
        db.commit()
        db.refresh(hostel)

        block_a = HostelBlock(hostel_id=hostel.hostel_id, block_name="Block A")
        block_b = HostelBlock(hostel_id=hostel.hostel_id, block_name="Block B")
        block_c = HostelBlock(hostel_id=hostel.hostel_id, block_name="Block C")
        db.add_all([block_a, block_b, block_c])
        db.commit()
        db.refresh(block_a)
        db.refresh(block_b)
        db.refresh(block_c)

        # 4. Rooms
        rooms_data = [
            # Block A
            {"block_id": block_a.block_id, "room_number": "A-101", "floor": 1, "capacity": 2},
            {"block_id": block_a.block_id, "room_number": "A-108", "floor": 1, "capacity": 2},
            {"block_id": block_a.block_id, "room_number": "A-207", "floor": 2, "capacity": 3},
            # Block B
            {"block_id": block_b.block_id, "room_number": "B-204", "floor": 2, "capacity": 3},
            {"block_id": block_b.block_id, "room_number": "B-214", "floor": 2, "capacity": 3},
            {"block_id": block_b.block_id, "room_number": "B-218", "floor": 2, "capacity": 2},
            {"block_id": block_b.block_id, "room_number": "B-305", "floor": 3, "capacity": 2},
            # Block C
            {"block_id": block_c.block_id, "room_number": "C-301", "floor": 3, "capacity": 2},
            {"block_id": block_c.block_id, "room_number": "C-302", "floor": 3, "capacity": 3},
        ]
        created_rooms = {}
        for r_data in rooms_data:
            r = Room(**r_data)
            db.add(r)
            db.commit()
            db.refresh(r)
            created_rooms[r.room_number] = r

        # 5. Allocations
        # Aarav Sharma -> B-214
        aarav = db.query(Student).filter(Student.name == "Aarav Sharma").first()
        if aarav and "B-214" in created_rooms:
            alloc1 = RoomAllocation(
                student_id=aarav.student_id,
                room_id=created_rooms["B-214"].room_id,
                status="ACTIVE",
                allocated_at=datetime.utcnow()
            )
            db.add(alloc1)

        # Meera Iyer -> A-108
        meera = db.query(Student).filter(Student.name == "Meera Iyer").first()
        if meera and "A-108" in created_rooms:
            alloc2 = RoomAllocation(
                student_id=meera.student_id,
                room_id=created_rooms["A-108"].room_id,
                status="ACTIVE",
                allocated_at=datetime.utcnow()
            )
            db.add(alloc2)

        # Nisha Khan -> A-207
        nisha = db.query(Student).filter(Student.name == "Nisha Khan").first()
        if nisha and "A-207" in created_rooms:
            alloc3 = RoomAllocation(
                student_id=nisha.student_id,
                room_id=created_rooms["A-207"].room_id,
                status="ACTIVE",
                allocated_at=datetime.utcnow()
            )
            db.add(alloc3)

        # Kiran Reddy -> C-302
        kiran = db.query(Student).filter(Student.name == "Kiran Reddy").first()
        if kiran and "C-302" in created_rooms:
            alloc4 = RoomAllocation(
                student_id=kiran.student_id,
                room_id=created_rooms["C-302"].room_id,
                status="ACTIVE",
                allocated_at=datetime.utcnow()
            )
            db.add(alloc4)

        db.commit()

        # 6. Mess Menu
        menu_items = [
            {"day": "Monday", "meal_type": "BREAKFAST", "menu_items": "Dosa, Sambar, Coconut Chutney, Coffee"},
            {"day": "Monday", "meal_type": "LUNCH", "menu_items": "Veg Pulao, Raita, Dal Tadka, Salad"},
            {"day": "Monday", "meal_type": "SNACKS", "menu_items": "Samosa, Mint Chutney, Tea"},
            {"day": "Monday", "meal_type": "DINNER", "menu_items": "Chapati, Dal Fry, Jeera Rice, Gulab Jamun"},

            {"day": "Tuesday", "meal_type": "BREAKFAST", "menu_items": "Poha, Sev, Boiled Eggs, Tea"},
            {"day": "Tuesday", "meal_type": "LUNCH", "menu_items": "Rajma Chawal, Curd, Mixed Veg, Papad"},
            {"day": "Tuesday", "meal_type": "SNACKS", "menu_items": "Biscuits, Banana, Lemon Tea"},
            {"day": "Tuesday", "meal_type": "DINNER", "menu_items": "Chapati, Mix Veg Curry, Steamed Rice, Rasam"},

            {"day": "Wednesday", "meal_type": "BREAKFAST", "menu_items": "Upma, Chutney, Fruit, Milk"},
            {"day": "Wednesday", "meal_type": "LUNCH", "menu_items": "Sambar Rice, Potato Fry, Curd, Pickle"},
            {"day": "Wednesday", "meal_type": "SNACKS", "menu_items": "Veg Puff, Tea"},
            {"day": "Wednesday", "meal_type": "DINNER", "menu_items": "Egg Curry / Paneer Butter Masala, Roti, Rice"},

            {"day": "Thursday", "meal_type": "BREAKFAST", "menu_items": "Aloo Paratha, Curd, Pickle, Tea"},
            {"day": "Thursday", "meal_type": "LUNCH", "menu_items": "Chole Bhature / Rice, Salad, Buttermilk"},
            {"day": "Thursday", "meal_type": "SNACKS", "menu_items": "Sweet Corn, Coffee"},
            {"day": "Thursday", "meal_type": "DINNER", "menu_items": "Paneer Masala, Chapati, Pulao, Kheer"},

            {"day": "Friday", "meal_type": "BREAKFAST", "menu_items": "Idli, Vada, Sambar, Filter Coffee"},
            {"day": "Friday", "meal_type": "LUNCH", "menu_items": "Dal Tadka, Steamed Rice, Bhindi Fry, Curd"},
            {"day": "Friday", "meal_type": "SNACKS", "menu_items": "Veg Cutlet, Green Chutney, Tea"},
            {"day": "Friday", "meal_type": "DINNER", "menu_items": "Veg Biryani, Mirchi Ka Salan, Raita, Custard"},

            {"day": "Saturday", "meal_type": "BREAKFAST", "menu_items": "Poori, Aloo Masala, Halwa, Tea"},
            {"day": "Saturday", "meal_type": "LUNCH", "menu_items": "Curd Rice, Lemon Rice, Potato Chips"},
            {"day": "Saturday", "meal_type": "SNACKS", "menu_items": "Cake, Tea"},
            {"day": "Saturday", "meal_type": "DINNER", "menu_items": "Veg Hakka Noodles, Manchurian, Fried Rice"}
        ]
        for m in menu_items:
            db.add(MessMenu(**m))
        db.commit()

        # 7. Fees
        if aarav:
            f1 = Fee(student_id=aarav.student_id, fee_type="Hostel Fee", amount=42000.0, paid_amount=42000.0, due_date=date(2026, 8, 4), status="PAID")
            f2 = Fee(student_id=aarav.student_id, fee_type="Mess Fee", amount=8500.0, paid_amount=0.0, due_date=date(2026, 9, 18), status="PENDING")
            f3 = Fee(student_id=aarav.student_id, fee_type="Security Deposit", amount=5000.0, paid_amount=5000.0, due_date=date(2026, 7, 10), status="PAID")
            db.add_all([f1, f2, f3])

        if meera:
            db.add(Fee(student_id=meera.student_id, fee_type="Hostel Fee", amount=42000.0, paid_amount=42000.0, status="PAID"))
            db.add(Fee(student_id=meera.student_id, fee_type="Mess Fee", amount=8500.0, paid_amount=8500.0, status="PAID"))

        if nisha:
            db.add(Fee(student_id=nisha.student_id, fee_type="Hostel Fee", amount=42000.0, paid_amount=0.0, due_date=date(2026, 10, 15), status="PENDING"))

        db.commit()

        # 8. Complaints
        if aarav:
            c1 = Complaint(
                student_id=aarav.student_id,
                category="Maintenance",
                subject="Ceiling fan speed issue",
                description="Fan regulator does not adjust speed on position 2 and 3.",
                priority="Medium",
                status="IN_PROGRESS"
            )
            c2 = Complaint(
                student_id=aarav.student_id,
                category="Housekeeping",
                subject="Washroom cleaning request",
                description="Scheduled housekeeping request for 2nd floor wing B.",
                priority="Low",
                status="RESOLVED",
                admin_response="Completed by morning housekeeping staff."
            )
            c3 = Complaint(
                student_id=aarav.student_id,
                category="Electrical",
                subject="Study table plug point not working",
                description="Bed 2 table electrical socket is loose and sparks.",
                priority="High",
                status="PENDING"
            )
            db.add_all([c1, c2, c3])

        if nisha:
            db.add(Complaint(
                student_id=nisha.student_id,
                category="Plumbing",
                subject="Shower tap leakage",
                description="Block A room 207 washroom tap leaking constantly.",
                priority="High",
                status="PENDING"
            ))

        db.commit()

        # 9. Leave Requests
        if aarav:
            db.add(LeaveRequest(
                student_id=aarav.student_id,
                leave_type="Home Visit",
                from_date=date(2026, 9, 13),
                to_date=date(2026, 9, 15),
                reason="Family function in Hyderabad",
                status="PENDING"
            ))
            db.add(LeaveRequest(
                student_id=aarav.student_id,
                leave_type="Medical",
                from_date=date(2026, 8, 28),
                to_date=date(2026, 8, 30),
                reason="Medical appointment at Vijayawada",
                status="APPROVED",
                admin_comment="Approved with parent confirmation."
            ))

        if meera:
            db.add(LeaveRequest(
                student_id=meera.student_id,
                leave_type="Home Visit",
                from_date=date(2026, 9, 12),
                to_date=date(2026, 9, 13),
                reason="Sister wedding prep in Guntur",
                status="PENDING"
            ))

        db.commit()

        # 10. Announcements
        announcements_data = [
            {"title": "Mess committee meeting scheduled for Friday at 4 PM", "content": "All block representatives must attend in the main dining hall.", "priority": "High"},
            {"title": "Water supply maintenance in Block B from 2 PM to 4 PM", "content": "Overhead tank cleaning in progress. Store adequate water.", "priority": "Medium"},
            {"title": "September mess fee payment window is open", "content": "Please clear mess dues before the 18th of this month to avoid fines.", "priority": "Normal"},
            {"title": "Room inspection starts next Monday", "content": "Wardens will inspect cleanliness, fixtures, and adherence to hostel regulations.", "priority": "Normal"},
        ]
        for a in announcements_data:
            ann = Announcement(
                created_by=admin_user.user_id,
                title=a["title"],
                content=a["content"],
                priority=a["priority"],
                published_at=datetime.utcnow()
            )
            db.add(ann)
        db.commit()

        # 11. Initial MongoDB documents
        if aarav:
            mongo_db.create_notification(
                user_id=aarav.user_id,
                title="Welcome to KLH Hostel Portal",
                message="Your residential student account has been activated.",
                type_="WELCOME"
            )
            mongo_db.create_notification(
                user_id=aarav.user_id,
                title="Mess Fee Window Open",
                message="Mess fee payment window for this month is active.",
                type_="FEE"
            )
            mongo_db.create_mess_feedback(
                student_id=aarav.student_id,
                meal_type="LUNCH",
                date="2026-09-10",
                rating=4,
                feedback="Good dal tadka and fresh curd today."
            )

        mongo_db.log_activity(
            user_id=admin_user.user_id,
            role="ADMIN",
            action="SYSTEM_INITIALIZED",
            entity="system",
            details={"message": "System seed data loaded successfully"}
        )

        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
