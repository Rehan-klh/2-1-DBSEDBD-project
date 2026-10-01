# Hostel & Mess Management System — ER Diagram

## Database Model

The PostgreSQL database contains 13 relational tables:

1. `users`
2. `students`
3. `hostels`
4. `hostel_blocks`
5. `rooms`
6. `room_allocations`
7. `leave_requests`
8. `complaints`
9. `fees`
10. `mess_menu`
11. `room_change_requests`
12. `visitor_requests`
13. `announcements`

MongoDB Atlas is intentionally separate from this relational ERD and contains three document collections:

- `notifications`
- `mess_feedback`
- `activity_logs`

## PostgreSQL DBML

```dbml
// Hostel & Mess Management System
// PostgreSQL ER Diagram

Table users {
  user_id integer [primary key, increment]
  email varchar(255) [not null, unique]
  password_hash varchar(255) [not null]
  role varchar(20) [not null, note: 'STUDENT or ADMIN']
  created_at timestamp [not null]
}

Table students {
  student_id integer [primary key, increment]
  user_id integer [not null, unique]
  name varchar(150) [not null]
  phone varchar(20)
  department varchar(100)
  year integer
}

Table hostels {
  hostel_id integer [primary key, increment]
  name varchar(100) [not null]
  location varchar(255)
}

Table hostel_blocks {
  block_id integer [primary key, increment]
  hostel_id integer [not null]
  block_name varchar(100) [not null]
}

Table rooms {
  room_id integer [primary key, increment]
  block_id integer [not null]
  room_number varchar(20) [not null]
  floor integer
  capacity integer [not null]
}

Table room_allocations {
  allocation_id integer [primary key, increment]
  student_id integer [not null]
  room_id integer [not null]
  allocated_at timestamp [not null]
  released_at timestamp
  status varchar(20) [not null, note: 'ACTIVE or RELEASED']
}

Table leave_requests {
  leave_id integer [primary key, increment]
  student_id integer [not null]
  leave_type varchar(50) [not null]
  from_date date [not null]
  to_date date [not null]
  reason text [not null]
  status varchar(20) [not null, note: 'PENDING, APPROVED, or REJECTED']
  admin_comment text
  created_at timestamp [not null]
  updated_at timestamp
}

Table complaints {
  complaint_id integer [primary key, increment]
  student_id integer [not null]
  category varchar(100) [not null]
  subject varchar(200) [not null]
  description text [not null]
  priority varchar(20)
  status varchar(20) [not null, note: 'PENDING, IN_PROGRESS, or RESOLVED']
  admin_response text
  created_at timestamp [not null]
  updated_at timestamp
}

Table fees {
  fee_id integer [primary key, increment]
  student_id integer [not null]
  fee_type varchar(50) [not null]
  amount decimal(10,2) [not null]
  paid_amount decimal(10,2) [not null]
  due_date date
  status varchar(20) [not null, note: 'PENDING, PARTIAL, or PAID']
  created_at timestamp [not null]
}

Table mess_menu {
  menu_id integer [primary key, increment]
  day varchar(20) [not null]
  meal_type varchar(30) [not null, note: 'BREAKFAST, LUNCH, SNACKS, or DINNER']
  menu_items text [not null]
  created_at timestamp [not null]
  updated_at timestamp
}

Table room_change_requests {
  request_id integer [primary key, increment]
  student_id integer [not null]
  current_room_id integer [not null]
  requested_room_id integer [not null]
  reason text [not null]
  status varchar(20) [not null, note: 'PENDING, APPROVED, or REJECTED']
  admin_comment text
  created_at timestamp [not null]
  updated_at timestamp
}

Table visitor_requests {
  visitor_request_id integer [primary key, increment]
  student_id integer [not null]
  visitor_name varchar(150) [not null]
  visitor_phone varchar(20)
  relationship varchar(50)
  purpose text
  visit_date date [not null]
  entry_time time
  exit_time time
  status varchar(20) [not null, note: 'PENDING, APPROVED, or REJECTED']
  admin_comment text
  created_at timestamp [not null]
}

Table announcements {
  announcement_id integer [primary key, increment]
  created_by integer [not null]
  title varchar(200) [not null]
  content text [not null]
  priority varchar(20)
  published_at timestamp [not null]
  expires_at timestamp
}

Ref user_student: users.user_id - students.user_id
Ref hostel_blocks_hostel: hostel_blocks.hostel_id > hostels.hostel_id
Ref rooms_block: rooms.block_id > hostel_blocks.block_id
Ref allocations_student: room_allocations.student_id > students.student_id
Ref allocations_room: room_allocations.room_id > rooms.room_id
Ref leave_student: leave_requests.student_id > students.student_id
Ref complaint_student: complaints.student_id > students.student_id
Ref fee_student: fees.student_id > students.student_id
Ref visitor_student: visitor_requests.student_id > students.student_id
Ref room_change_student: room_change_requests.student_id > students.student_id
Ref room_change_current_room: room_change_requests.current_room_id > rooms.room_id
Ref room_change_requested_room: room_change_requests.requested_room_id > rooms.room_id
Ref announcement_creator: announcements.created_by > users.user_id
```

## Locked Business Rules

- A student can have historical room allocations but only one `ACTIVE` allocation at a time.
- Room capacity must never be exceeded.
- Initial room selection by a student is immediate when capacity is available; it does not require admin approval.
- Admin can directly allocate, remove, transfer, or override a student's room allocation.
- A student room-change request is a separate workflow and requires admin approval/rejection.
- `users` handles authentication and role; there is no separate `admins` table.
