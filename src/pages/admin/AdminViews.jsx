import { useEffect, useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import { api } from '../../api/client'

function AdminViews({ activeView }) {
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')

  // Domain state
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [allocations, setAllocations] = useState([])
  const [roomChanges, setRoomChanges] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [complaints, setComplaints] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [messFeedbacks, setMessFeedbacks] = useState([])
  const [fees, setFees] = useState([])
  const [visitors, setVisitors] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [logs, setLogs] = useState([])

  // Form states
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: 'Student@123',
    department: 'Computer Science',
    year: 1,
    phone: '',
    room_id: '',
  })
  const [roomForm, setRoomForm] = useState({
    block_id: 1,
    room_number: '',
    floor: 1,
    capacity: 2,
  })
  const [menuForm, setMenuForm] = useState({
    day: 'Monday',
    meal_type: 'BREAKFAST',
    menu_items: '',
  })
  const [feeForm, setFeeForm] = useState({
    student_id: '',
    fee_type: 'Hostel Fee',
    amount: '',
    due_date: '',
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'Normal',
  })

  // Selected item modal or inline inputs
  const [responseInputs, setResponseInputs] = useState({})

  const clearMessages = () => {
    setFeedback('')
    setFormError('')
  }

  const loadData = useCallback(() => {
    if (activeView === 'students') {
      Promise.all([api.students.list(), api.rooms.list()])
        .then(([stList, rmList]) => {
          setStudents(stList)
          setRooms(rmList)
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'rooms') {
      api.rooms.list().then(setRooms).catch((err) => setFormError(err.message))
    } else if (activeView === 'allocations') {
      Promise.all([api.allocations.list(), api.students.list(), api.rooms.list()])
        .then(([alList, stList, rmList]) => {
          setAllocations(alList)
          setStudents(stList)
          setRooms(rmList)
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'room-changes') {
      api.roomChanges.list().then(setRoomChanges).catch((err) => setFormError(err.message))
    } else if (activeView === 'leave') {
      api.leave.list().then(setLeaveRequests).catch((err) => setFormError(err.message))
    } else if (activeView === 'complaints') {
      api.complaints.list().then(setComplaints).catch((err) => setFormError(err.message))
    } else if (activeView === 'mess') {
      Promise.all([api.mess.getMenu(), api.mess.listFeedback()])
        .then(([mList, fList]) => {
          setMenuItems(mList)
          setMessFeedbacks(fList)
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'fees') {
      Promise.all([api.fees.list(), api.students.list()])
        .then(([fList, stList]) => {
          setFees(fList)
          setStudents(stList)
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'visitors') {
      api.visitors.list().then(setVisitors).catch((err) => setFormError(err.message))
    } else if (activeView === 'announcements') {
      api.announcements.list().then(setAnnouncements).catch((err) => setFormError(err.message))
    } else if (activeView === 'logs') {
      api.activityLogs.list(50).then(setLogs).catch((err) => setFormError(err.message))
    }
  }, [activeView])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Handlers ---
  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!studentForm.name.trim() || !studentForm.email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    try {
      await api.students.create({
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        password: studentForm.password,
        department: studentForm.department,
        year: Number(studentForm.year),
        phone: studentForm.phone,
        initial_room_id: studentForm.room_id ? Number(studentForm.room_id) : null,
      })
      setFeedback('Student account created successfully.')
      setStudentForm({
        name: '',
        email: '',
        password: 'Student@123',
        department: 'Computer Science',
        year: 1,
        phone: '',
        room_id: '',
      })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!roomForm.room_number.trim() || !roomForm.capacity) {
      setFormError('Room number and capacity are required.')
      return
    }
    try {
      await api.rooms.create({
        block_id: Number(roomForm.block_id),
        room_number: roomForm.room_number.trim(),
        floor: Number(roomForm.floor),
        capacity: Number(roomForm.capacity),
      })
      setFeedback('Room created successfully.')
      setRoomForm({ block_id: 1, room_number: '', floor: 1, capacity: 2 })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleAdminAllocate = async (studentId, roomId) => {
    clearMessages()
    try {
      await api.allocations.adminAllocate(Number(studentId), Number(roomId))
      setFeedback('Student assigned to room.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleReleaseAllocation = async (allocationId) => {
    clearMessages()
    try {
      await api.allocations.release(allocationId)
      setFeedback('Room allocation released.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleTransferAllocation = async (allocationId, newRoomId) => {
    clearMessages()
    try {
      await api.allocations.transfer(allocationId, Number(newRoomId))
      setFeedback('Student transferred to new room.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleRoomChangeStatus = async (id, status) => {
    clearMessages()
    const comment = responseInputs[`rc_${id}`] || `Decision: ${status}`
    try {
      await api.roomChanges.updateStatus(id, status, comment)
      setFeedback(`Room change request ${status.toLowerCase()}.`)
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleLeaveStatus = async (id, status) => {
    clearMessages()
    const comment = responseInputs[`leave_${id}`] || `Approved/Reviewed by Warden`
    try {
      await api.leave.updateStatus(id, status, comment)
      setFeedback(`Leave request ${status.toLowerCase()}.`)
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleComplaintStatus = async (id, status) => {
    clearMessages()
    const response = responseInputs[`cmp_${id}`] || `Handled by hostel maintenance`
    try {
      await api.complaints.updateStatus(id, status, response)
      setFeedback(`Complaint updated to ${status}.`)
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleMenuSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!menuForm.menu_items.trim()) {
      setFormError('Please enter menu items.')
      return
    }
    try {
      await api.mess.createMenu({
        day: menuForm.day,
        meal_type: menuForm.meal_type,
        menu_items: menuForm.menu_items.trim(),
      })
      setFeedback('Menu item saved.')
      setMenuForm({ ...menuForm, menu_items: '' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleFeeSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!feeForm.student_id || !feeForm.amount) {
      setFormError('Please select a student and enter amount.')
      return
    }
    try {
      await api.fees.create({
        student_id: Number(feeForm.student_id),
        fee_type: feeForm.fee_type,
        amount: parseFloat(feeForm.amount),
        due_date: feeForm.due_date || null,
      })
      setFeedback('Fee record created.')
      setFeeForm({ student_id: '', fee_type: 'Hostel Fee', amount: '', due_date: '' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleMarkFeePaid = async (feeId, amount) => {
    clearMessages()
    try {
      await api.fees.update(feeId, { paid_amount: amount, status: 'PAID' })
      setFeedback('Fee marked as fully paid.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleVisitorStatus = async (id, status) => {
    clearMessages()
    const comment = responseInputs[`vis_${id}`] || `Gate pass ${status.toLowerCase()}`
    try {
      await api.visitors.updateStatus(id, status, comment)
      setFeedback(`Visitor pass ${status.toLowerCase()}.`)
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      setFormError('Title and content are required.')
      return
    }
    try {
      await api.announcements.create(announcementForm)
      setFeedback('Announcement published.')
      setAnnouncementForm({ title: '', content: '', priority: 'Normal' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDeleteAnnouncement = async (id) => {
    clearMessages()
    try {
      await api.announcements.delete(id)
      setFeedback('Announcement deleted.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  // --- RENDER VIEWS ---

  if (activeView === 'students') {
    return (
      <section className="content-stack">
        <PageHeader description="Student hostel records, contact info, and allocations." title="Students" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleStudentSubmit}>
          <h2>Add Student Account</h2>
          <div className="form-grid">
            <label>
              Full Name
              <input
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                placeholder="Student name"
                required
                value={studentForm.name}
              />
            </label>
            <label>
              Email Address
              <input
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                placeholder="student@klh.edu.in"
                required
                type="email"
                value={studentForm.email}
              />
            </label>
            <label>
              Department
              <input
                onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                placeholder="CSE, ECE, ME"
                value={studentForm.department}
              />
            </label>
            <label>
              Initial Room Assignment
              <select
                onChange={(e) => setStudentForm({ ...studentForm, room_id: e.target.value })}
                value={studentForm.room_id}
              >
                <option value="">No initial room</option>
                {rooms
                  .filter((r) => r.available_capacity > 0)
                  .map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.block_name} - {r.room_number} (Vacant: {r.available_capacity})
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Create Student</button>
        </form>

        <article className="panel">
          <h2>Enrolled Students</h2>
          <DataTable
            columns={[
              { key: 'student_id', label: 'ID', render: (row) => `KLH${String(row.student_id).padStart(4, '0')}` },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'department', label: 'Department' },
              {
                key: 'room',
                label: 'Allocated Room',
                render: (row) =>
                  row.current_room ? `${row.current_room.block_name} - ${row.current_room.room_number}` : 'None',
              },
            ]}
            rows={students}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'rooms') {
    return (
      <section className="content-stack">
        <PageHeader description="Block-wise occupancy, room capacities, and room creation." title="Rooms" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleRoomSubmit}>
          <h2>Create New Room</h2>
          <div className="form-grid">
            <label>
              Hostel Block
              <select
                onChange={(e) => setRoomForm({ ...roomForm, block_id: e.target.value })}
                value={roomForm.block_id}
              >
                <option value="1">Block A</option>
                <option value="2">Block B</option>
                <option value="3">Block C</option>
              </select>
            </label>
            <label>
              Room Number
              <input
                onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                placeholder="e.g. B-220"
                required
                value={roomForm.room_number}
              />
            </label>
            <label>
              Floor
              <input
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                type="number"
                value={roomForm.floor}
              />
            </label>
            <label>
              Bed Capacity
              <input
                min="1"
                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                type="number"
                value={roomForm.capacity}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Create Room</button>
        </form>

        <article className="panel">
          <h2>All Rooms List</h2>
          <DataTable
            columns={[
              { key: 'block_name', label: 'Block' },
              { key: 'room_number', label: 'Room' },
              { key: 'floor', label: 'Floor' },
              { key: 'capacity', label: 'Capacity' },
              { key: 'occupied_count', label: 'Occupied' },
              { key: 'available_capacity', label: 'Vacant Beds' },
            ]}
            rows={rooms}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'allocations') {
    return (
      <section className="content-stack">
        <PageHeader description="Allocate students, override assignments, and transfer rooms." title="Room Allocations" />
        <FormMessage error={formError} success={feedback} />

        {/* Direct Admin Allocate */}
        <article className="panel form-panel">
          <h2>Direct Allocation</h2>
          <div className="form-grid">
            <label>
              Student
              <select id="direct-student-select">
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} (KLH{String(s.student_id).padStart(4, '0')})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target Room
              <select id="direct-room-select">
                {rooms
                  .filter((r) => r.available_capacity > 0)
                  .map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.block_name} - {r.room_number} (Vacant: {r.available_capacity})
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <button
            className="primary-button form-submit"
            onClick={() => {
              const sId = document.getElementById('direct-student-select')?.value
              const rId = document.getElementById('direct-room-select')?.value
              if (sId && rId) handleAdminAllocate(sId, rId)
            }}
            type="button"
          >
            Allocate Student
          </button>
        </article>

        <article className="panel">
          <h2>Current & Historical Allocations</h2>
          <DataTable
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'block_name', label: 'Block' },
              { key: 'room_number', label: 'Room' },
              { key: 'allocated_at', label: 'Allocated Date', render: (row) => new Date(row.allocated_at).toLocaleDateString() },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) =>
                  row.status === 'ACTIVE' ? (
                    <div className="action-row">
                      <button onClick={() => handleReleaseAllocation(row.allocation_id)} type="button">
                        Release
                      </button>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleTransferAllocation(row.allocation_id, e.target.value)
                        }}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      >
                        <option value="">Transfer to...</option>
                        {rooms
                          .filter((r) => r.available_capacity > 0 && r.room_id !== row.room_id)
                          .map((r) => (
                            <option key={r.room_id} value={r.room_id}>
                              {r.room_number}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <span className="muted-text">Released</span>
                  ),
              },
            ]}
            rows={allocations}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'room-changes') {
    return (
      <section className="content-stack">
        <PageHeader description="Review and approve student room change requests." title="Room Change Requests" />
        <FormMessage error={formError} success={feedback} />

        <article className="panel">
          <h2>Requests Queue</h2>
          <DataTable
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'current_room_number', label: 'Current Room' },
              { key: 'requested_room_number', label: 'Requested Room' },
              { key: 'reason', label: 'Reason' },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Decide',
                render: (row) =>
                  row.status === 'PENDING' ? (
                    <div className="action-row">
                      <input
                        onChange={(e) => setResponseInputs({ ...responseInputs, [`rc_${row.request_id}`]: e.target.value })}
                        placeholder="Admin comment"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                      />
                      <button onClick={() => handleRoomChangeStatus(row.request_id, 'APPROVED')} type="button">
                        Approve
                      </button>
                      <button onClick={() => handleRoomChangeStatus(row.request_id, 'REJECTED')} type="button">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted-text">Decided ({row.admin_comment || 'No comment'})</span>
                  ),
              },
            ]}
            rows={roomChanges}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'leave') {
    return (
      <section className="content-stack">
        <PageHeader description="Review hostel leave requests awaiting warden decision." title="Leave Requests" />
        <FormMessage error={formError} success={feedback} />

        <article className="panel admin-ticket-board">
          <DataTable
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'leave_type', label: 'Type' },
              { key: 'dates', label: 'Dates', render: (row) => `${row.from_date} to ${row.to_date}` },
              { key: 'reason', label: 'Reason' },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) =>
                  row.status === 'PENDING' ? (
                    <div className="action-row">
                      <input
                        onChange={(e) => setResponseInputs({ ...responseInputs, [`leave_${row.leave_id}`]: e.target.value })}
                        placeholder="Note"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                      />
                      <button onClick={() => handleLeaveStatus(row.leave_id, 'APPROVED')} type="button">
                        Approve
                      </button>
                      <button onClick={() => handleLeaveStatus(row.leave_id, 'REJECTED')} type="button">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted-text">Completed</span>
                  ),
              },
            ]}
            rows={leaveRequests}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'complaints') {
    return (
      <section className="content-stack">
        <PageHeader description="Assign, update progress, and resolve student complaints." title="Complaints" />
        <FormMessage error={formError} success={feedback} />

        <article className="panel admin-ticket-board">
          <DataTable
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'category', label: 'Category' },
              { key: 'subject', label: 'Subject' },
              { key: 'description', label: 'Description' },
              { key: 'priority', label: 'Priority', badge: true },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Resolution',
                render: (row) => (
                  <div className="action-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                    {row.status !== 'RESOLVED' && (
                      <input
                        onChange={(e) => setResponseInputs({ ...responseInputs, [`cmp_${row.complaint_id}`]: e.target.value })}
                        placeholder="Resolution / notes"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem', width: '100%' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {row.status === 'PENDING' && (
                        <button onClick={() => handleComplaintStatus(row.complaint_id, 'IN_PROGRESS')} type="button">
                          In Progress
                        </button>
                      )}
                      {row.status !== 'RESOLVED' && (
                        <button onClick={() => handleComplaintStatus(row.complaint_id, 'RESOLVED')} type="button">
                          Resolve
                        </button>
                      )}
                    </div>
                    {row.admin_response && (
                      <span className="muted-text" style={{ fontSize: '0.8rem' }}>Response: {row.admin_response}</span>
                    )}
                  </div>
                ),
              },
            ]}
            rows={complaints}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'mess') {
    return (
      <section className="content-stack">
        <PageHeader description="Manage daily menu items and review student mess feedback." title="Mess & Feedback" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleMenuSubmit}>
          <h2>Add/Update Menu Entry</h2>
          <div className="form-grid">
            <label>
              Day
              <select onChange={(e) => setMenuForm({ ...menuForm, day: e.target.value })} value={menuForm.day}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Meal Type
              <select onChange={(e) => setMenuForm({ ...menuForm, meal_type: e.target.value })} value={menuForm.meal_type}>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="SNACKS">Snacks</option>
                <option value="DINNER">Dinner</option>
              </select>
            </label>
            <label className="full-field">
              Menu Items
              <textarea
                onChange={(e) => setMenuForm({ ...menuForm, menu_items: e.target.value })}
                placeholder="Items to serve"
                value={menuForm.menu_items}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Save Menu Entry</button>
        </form>

        <article className="panel meal-board">
          <h2>Current Mess Menu</h2>
          <DataTable
            columns={[
              { key: 'day', label: 'Day' },
              { key: 'meal_type', label: 'Meal' },
              { key: 'menu_items', label: 'Serving Items' },
            ]}
            rows={menuItems}
          />
        </article>

        {/* Mess Feedback from MongoDB Atlas */}
        <article className="panel">
          <h2>Student Mess Feedback (MongoDB Atlas)</h2>
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'meal_type', label: 'Meal' },
              { key: 'rating', label: 'Rating (1-5)' },
              { key: 'feedback', label: 'Student Comment' },
            ]}
            rows={messFeedbacks}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'fees') {
    return (
      <section className="content-stack">
        <PageHeader description="Manage student fee records, billing, and collection status." title="Fees" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleFeeSubmit}>
          <h2>Create Student Fee Record</h2>
          <div className="form-grid">
            <label>
              Student
              <select
                onChange={(e) => setFeeForm({ ...feeForm, student_id: e.target.value })}
                required
                value={feeForm.student_id}
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} (KLH{String(s.student_id).padStart(4, '0')})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fee Type
              <select onChange={(e) => setFeeForm({ ...feeForm, fee_type: e.target.value })} value={feeForm.fee_type}>
                <option>Hostel Fee</option>
                <option>Mess Fee</option>
                <option>Security Deposit</option>
              </select>
            </label>
            <label>
              Amount (Rs.)
              <input
                onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                placeholder="e.g. 42000"
                required
                type="number"
                value={feeForm.amount}
              />
            </label>
            <label>
              Due Date
              <input
                onChange={(e) => setFeeForm({ ...feeForm, due_date: e.target.value })}
                type="date"
                value={feeForm.due_date}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Create Fee Record</button>
        </form>

        <article className="panel">
          <h2>Fee Records</h2>
          <DataTable
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'fee_type', label: 'Type' },
              { key: 'amount', label: 'Total (Rs)', render: (row) => row.amount.toLocaleString('en-IN') },
              { key: 'paid_amount', label: 'Paid (Rs)', render: (row) => row.paid_amount.toLocaleString('en-IN') },
              { key: 'due_date', label: 'Due Date' },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'action',
                label: 'Collect',
                render: (row) =>
                  row.status !== 'PAID' ? (
                    <button onClick={() => handleMarkFeePaid(row.fee_id, row.amount)} type="button">
                      Mark Paid
                    </button>
                  ) : (
                    <span className="muted-text">Cleared</span>
                  ),
              },
            ]}
            rows={fees}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'visitors') {
    return (
      <section className="content-stack">
        <PageHeader description="Review and approve visitor access gate passes." title="Visitor Requests" />
        <FormMessage error={formError} success={feedback} />

        <article className="panel">
          <h2>Visitor Requests Queue</h2>
          <DataTable
            columns={[
              { key: 'student_name', label: 'Host Student' },
              { key: 'visitor_name', label: 'Visitor' },
              { key: 'relationship', label: 'Relationship' },
              { key: 'visit_date', label: 'Visit Date' },
              { key: 'purpose', label: 'Purpose' },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Action',
                render: (row) =>
                  row.status === 'PENDING' ? (
                    <div className="action-row">
                      <input
                        onChange={(e) => setResponseInputs({ ...responseInputs, [`vis_${row.visitor_request_id}`]: e.target.value })}
                        placeholder="Gate note"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                      />
                      <button onClick={() => handleVisitorStatus(row.visitor_request_id, 'APPROVED')} type="button">
                        Approve
                      </button>
                      <button onClick={() => handleVisitorStatus(row.visitor_request_id, 'REJECTED')} type="button">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted-text">{row.admin_comment || 'Completed'}</span>
                  ),
              },
            ]}
            rows={visitors}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'announcements') {
    return (
      <section className="content-stack">
        <PageHeader description="Publish and manage campus and hostel circulars." title="Announcements" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleAnnouncementSubmit}>
          <h2>Publish New Notice</h2>
          <div className="form-grid">
            <label>
              Title
              <input
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Notice headline"
                required
                value={announcementForm.title}
              />
            </label>
            <label>
              Priority
              <select
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                value={announcementForm.priority}
              >
                <option>Normal</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="full-field">
              Content
              <textarea
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="Full notice content..."
                required
                value={announcementForm.content}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Publish Notice</button>
        </form>

        <article className="panel">
          <h2>Active Announcements</h2>
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'priority', label: 'Priority', badge: true },
              { key: 'published_at', label: 'Date', render: (row) => new Date(row.published_at).toLocaleDateString() },
              {
                key: 'action',
                label: 'Action',
                render: (row) => (
                  <button onClick={() => handleDeleteAnnouncement(row.announcement_id)} type="button">
                    Delete
                  </button>
                ),
              },
            ]}
            rows={announcements}
          />
        </article>
      </section>
    )
  }

  // Logs view (MongoDB Atlas activity_logs)
  return (
    <section className="content-stack">
      <PageHeader description="System audit records and administrator activity trail." title="Audit & Activity Logs" />
      <article className="panel">
        <h2>Activity Logs (MongoDB Atlas)</h2>
        <DataTable
          columns={[
            { key: 'timestamp', label: 'Time', render: (row) => new Date(row.timestamp).toLocaleTimeString() },
            { key: 'role', label: 'Role' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
            { key: 'details', label: 'Payload', render: (row) => JSON.stringify(row.details) },
          ]}
          rows={logs}
        />
      </article>
    </section>
  )
}

function FormMessage({ error, success }) {
  if (!error && !success) return null
  return <p className={error ? 'form-message error' : 'form-message success'}>{error || success}</p>
}

export default AdminViews
