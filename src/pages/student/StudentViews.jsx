import { useEffect, useState, useCallback } from 'react'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import { api } from '../../api/client'

function StudentViews({ activeView }) {
  // Common states
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')

  // Domain data states
  const [profile, setProfile] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [roomChanges, setRoomChanges] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [myFeedbackList, setMyFeedbackList] = useState([])
  const [complaints, setComplaints] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [visitorRequests, setVisitorRequests] = useState([])
  const [announcements, setAnnouncements] = useState([])

  // Forms
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'Medium',
  })
  const [leaveForm, setLeaveForm] = useState({
    type: 'Home Visit',
    from: '',
    to: '',
    destination: '',
    contact: '',
    reason: '',
  })
  const [roomChangeForm, setRoomChangeForm] = useState({
    requested_room_id: '',
    reason: '',
  })
  const [feedbackForm, setFeedbackForm] = useState({
    meal_type: 'LUNCH',
    rating: 5,
    feedback: '',
  })
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    relationship: 'Parent',
    purpose: '',
    visit_date: '',
  })
  const [profileForm, setProfileForm] = useState({
    phone: '',
    department: '',
    year: 1,
  })

  const clearMessages = () => {
    setFeedback('')
    setFormError('')
  }

  // Fetch logic per view
  const loadData = useCallback(() => {
    if (activeView === 'room' || activeView === 'profile') {
      Promise.all([
        api.students.getMyProfile(),
        api.rooms.listAvailable(),
        api.roomChanges.getMine(),
      ])
        .then(([prof, avRooms, rChanges]) => {
          setProfile(prof)
          setAvailableRooms(avRooms)
          setRoomChanges(rChanges)
          setProfileForm({
            phone: prof.phone || '',
            department: prof.department || '',
            year: prof.year || 1,
          })
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'mess') {
      Promise.all([api.mess.getMenu(), api.mess.getMyFeedback()])
        .then(([menu, fbs]) => {
          setMenuItems(menu)
          setMyFeedbackList(fbs)
        })
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'complaints') {
      api.complaints.getMine()
        .then(setComplaints)
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'leave') {
      api.leave.getMine()
        .then(setLeaveRequests)
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'fees') {
      api.fees.getMine()
        .then(setFeeRecords)
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'visitors') {
      api.visitors.getMine()
        .then(setVisitorRequests)
        .catch((err) => setFormError(err.message))
    } else if (activeView === 'announcements') {
      api.announcements.list()
        .then(setAnnouncements)
        .catch((err) => setFormError(err.message))
    }
  }, [activeView])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Handlers ---
  const handleSelectRoom = async (roomId) => {
    clearMessages()
    try {
      await api.allocations.selectRoom(roomId)
      setFeedback('Room selected successfully!')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleRoomChangeSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!roomChangeForm.requested_room_id || !roomChangeForm.reason.trim()) {
      setFormError('Please select a target room and provide a reason.')
      return
    }
    try {
      await api.roomChanges.submit(
        Number(roomChangeForm.requested_room_id),
        roomChangeForm.reason.trim(),
      )
      setFeedback('Room change request submitted.')
      setRoomChangeForm({ requested_room_id: '', reason: '' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleComplaintSubmit = async (event) => {
    event.preventDefault()
    clearMessages()
    if (!complaintForm.category.trim() || !complaintForm.subject.trim() || !complaintForm.description.trim()) {
      setFormError('Please fill category, subject and description before submitting.')
      return
    }

    try {
      await api.complaints.submit({
        category: complaintForm.category.trim(),
        subject: complaintForm.subject.trim(),
        description: complaintForm.description.trim(),
        priority: complaintForm.priority,
      })
      setComplaintForm({ category: '', subject: '', description: '', priority: 'Medium' })
      setFeedback('Complaint submitted successfully.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleLeaveSubmit = async (event) => {
    event.preventDefault()
    clearMessages()
    if (!leaveForm.type || !leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) {
      setFormError('Please fill leave type, from date, to date and reason before submitting.')
      return
    }

    try {
      await api.leave.submit({
        leave_type: leaveForm.type,
        from_date: leaveForm.from,
        to_date: leaveForm.to,
        reason: `${leaveForm.destination ? `[${leaveForm.destination}] ` : ''}${leaveForm.reason.trim()}${leaveForm.contact ? ` (Contact: ${leaveForm.contact})` : ''}`,
      })
      setLeaveForm({
        type: 'Home Visit',
        from: '',
        to: '',
        destination: '',
        contact: '',
        reason: '',
      })
      setFeedback('Leave request submitted.')
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleMessFeedbackSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!feedbackForm.feedback.trim()) {
      setFormError('Please provide your feedback comments.')
      return
    }
    try {
      await api.mess.submitFeedback({
        meal_type: feedbackForm.meal_type,
        date: new Date().toISOString().split('T')[0],
        rating: Number(feedbackForm.rating),
        feedback: feedbackForm.feedback.trim(),
      })
      setFeedback('Mess feedback recorded in Atlas!')
      setFeedbackForm({ meal_type: 'LUNCH', rating: 5, feedback: '' })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleVisitorSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!visitorForm.visitor_name.trim() || !visitorForm.visit_date) {
      setFormError('Please provide visitor name and visit date.')
      return
    }
    try {
      await api.visitors.submit({
        visitor_name: visitorForm.visitor_name.trim(),
        visitor_phone: visitorForm.visitor_phone.trim(),
        relationship: visitorForm.relationship,
        purpose: visitorForm.purpose.trim(),
        visit_date: visitorForm.visit_date,
      })
      setFeedback('Visitor request submitted.')
      setVisitorForm({
        visitor_name: '',
        visitor_phone: '',
        relationship: 'Parent',
        purpose: '',
        visit_date: '',
      })
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      const updated = await api.students.updateMyProfile({
        phone: profileForm.phone,
        department: profileForm.department,
        year: Number(profileForm.year),
      })
      setProfile(updated)
      setFeedback('Profile updated successfully.')
    } catch (err) {
      setFormError(err.message)
    }
  }

  // --- RENDER VIEWS ---

  if (activeView === 'room') {
    const currentRoom = profile?.current_room
    return (
      <section className="content-stack">
        <PageHeader description="Your allocated hostel room, roommates, and available room selection." title="My Room" />
        <FormMessage error={formError} success={feedback} />

        {currentRoom ? (
          <>
            <section className="room-hero">
              <div>
                <span className="eyebrow">Room key</span>
                <h2>{currentRoom.room_number}</h2>
                <p>{currentRoom.block_name} - Floor {currentRoom.floor || 1} - {currentRoom.capacity} Sharing</p>
              </div>
              <div className="room-plan" aria-label="Room occupancy">
                <span className="bed active">You</span>
                {currentRoom.roommates?.map((name) => (
                  <span className="bed occupied" key={name}>{name.split(' ')[0]}</span>
                ))}
              </div>
            </section>

            <div className="two-column">
              <article className="panel room-details-panel">
                <h2>Room assignment</h2>
                <div className="detail-grid roomy">
                  <span>Room number<strong>{currentRoom.room_number}</strong></span>
                  <span>Block<strong>{currentRoom.block_name}</strong></span>
                  <span>Room capacity<strong>{currentRoom.capacity} Students</strong></span>
                  <span>Floor<strong>Floor {currentRoom.floor || 1}</strong></span>
                </div>
              </article>
              <article className="panel roommate-panel">
                <h2>Roommates</h2>
                <div className="person-list">
                  {currentRoom.roommates?.length ? (
                    currentRoom.roommates.map((name) => (
                      <div className="person-row" key={name}>
                        <span className="mini-avatar">{name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{name}</strong>
                          <p>{currentRoom.room_number}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No roommates assigned yet.</p>
                  )}
                </div>
              </article>
            </div>

            {/* Room Change Request Section */}
            <form className="panel form-panel" onSubmit={handleRoomChangeSubmit}>
              <h2>Request Room Change</h2>
              <p className="muted-text">Submit a request to change your current room. Requires warden approval.</p>
              <div className="form-grid">
                <label>
                  Requested Room
                  <select
                    onChange={(e) => setRoomChangeForm({ ...roomChangeForm, requested_room_id: e.target.value })}
                    value={roomChangeForm.requested_room_id}
                  >
                    <option value="">Select an available room</option>
                    {availableRooms
                      .filter((r) => r.room_id !== currentRoom.room_id)
                      .map((r) => (
                        <option key={r.room_id} value={r.room_id}>
                          {r.block_name} - {r.room_number} (Vacant: {r.available_capacity}/{r.capacity})
                        </option>
                      ))}
                  </select>
                </label>
                <label className="full-field">
                  Reason for Change
                  <textarea
                    onChange={(e) => setRoomChangeForm({ ...roomChangeForm, reason: e.target.value })}
                    placeholder="Explain the reason for requesting a change"
                    value={roomChangeForm.reason}
                  />
                </label>
              </div>
              <button className="primary-button form-submit" type="submit">Submit Change Request</button>
            </form>
          </>
        ) : (
          /* Student has no active room: immediate selection without approval */
          <article className="panel">
            <h2>Select Your Room</h2>
            <p>You do not currently have an active room allocation. Choose an available room below:</p>
            <div className="detail-grid" style={{ marginTop: '1rem' }}>
              {availableRooms.length > 0 ? (
                availableRooms.map((r) => (
                  <div className="panel" key={r.room_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{r.block_name} - Room {r.room_number}</strong>
                      <p>Floor {r.floor} • Available: {r.available_capacity} / {r.capacity}</p>
                    </div>
                    <button className="primary-button" onClick={() => handleSelectRoom(r.room_id)} type="button">
                      Select Room
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted-text">No available rooms at this moment.</p>
              )}
            </div>
          </article>
        )}

        {/* Existing Room Change Requests */}
        {roomChanges.length > 0 && (
          <article className="panel timeline-panel">
            <h2>My Room Change Requests</h2>
            <div className="status-timeline">
              {roomChanges.map((item) => (
                <div className="timeline-item" key={item.request_id}>
                  <span className={`timeline-dot ${item.status.toLowerCase()}`} />
                  <div>
                    <div className="timeline-title">
                      <strong>To Room {item.requested_room_number}</strong>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p>{item.reason} {item.admin_comment ? `• Admin Comment: ${item.admin_comment}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}
      </section>
    )
  }

  if (activeView === 'mess') {
    return (
      <section className="content-stack">
        <PageHeader description="Daily serving schedule, weekly menu plan and mess feedback." title="Mess Menu" />
        <FormMessage error={formError} success={feedback} />

        <article className="panel meal-board today-board">
          <h2>Serving Menu</h2>
          <div className="meal-list">
            {menuItems.map((meal) => (
              <div className="meal-item" key={meal.menu_id}>
                <div>
                  <strong>{meal.day} - {meal.meal_type}</strong>
                  <p>{meal.menu_items}</p>
                </div>
                <Badge>{meal.meal_type}</Badge>
              </div>
            ))}
          </div>
        </article>

        {/* Mess Feedback Form (MongoDB Atlas) */}
        <form className="panel form-panel" onSubmit={handleMessFeedbackSubmit}>
          <h2>Submit Meal Feedback</h2>
          <div className="form-grid">
            <label>
              Meal Type
              <select
                onChange={(e) => setFeedbackForm({ ...feedbackForm, meal_type: e.target.value })}
                value={feedbackForm.meal_type}
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="SNACKS">Snacks</option>
                <option value="DINNER">Dinner</option>
              </select>
            </label>
            <label>
              Rating (1 to 5)
              <select
                onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: e.target.value })}
                value={feedbackForm.rating}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>
            <label className="full-field">
              Feedback Comments
              <textarea
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                placeholder="Share your feedback about the meal quality, taste or hygiene"
                value={feedbackForm.feedback}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Submit Feedback</button>
        </form>

        {myFeedbackList.length > 0 && (
          <article className="panel timeline-panel">
            <h2>My Feedback History</h2>
            <div className="status-timeline">
              {myFeedbackList.map((item) => (
                <div className="timeline-item" key={item.id || item.created_at}>
                  <span className="timeline-dot approved" />
                  <div>
                    <div className="timeline-title">
                      <strong>{item.meal_type} — {item.rating} Stars</strong>
                      <span>{item.date}</span>
                    </div>
                    <p>{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}
      </section>
    )
  }

  if (activeView === 'complaints') {
    return (
      <section className="content-stack">
        <PageHeader description="Raise and monitor maintenance or hostel service issues." title="Complaints" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleComplaintSubmit}>
          <h2>New complaint</h2>
          <div className="form-grid">
            <label>
              Category
              <input
                onChange={(event) => setComplaintForm({ ...complaintForm, category: event.target.value })}
                placeholder="Electrical, housekeeping, plumbing"
                value={complaintForm.category}
              />
            </label>
            <label>
              Priority
              <select
                onChange={(event) => setComplaintForm({ ...complaintForm, priority: event.target.value })}
                value={complaintForm.priority}
              >
                <option>Medium</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </label>
            <label className="full-field">
              Subject
              <input
                onChange={(event) => setComplaintForm({ ...complaintForm, subject: event.target.value })}
                placeholder="Short issue title"
                value={complaintForm.subject}
              />
            </label>
            <label className="full-field">
              Description
              <textarea
                onChange={(event) => setComplaintForm({ ...complaintForm, description: event.target.value })}
                placeholder="Describe the issue clearly"
                value={complaintForm.description}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Submit Complaint</button>
        </form>

        <article className="panel timeline-panel">
          <h2>Complaint history</h2>
          <div className="status-timeline">
            {complaints.length > 0 ? (
              complaints.map((item) => (
                <div className="timeline-item" key={item.complaint_id}>
                  <span className={`timeline-dot ${item.status.toLowerCase().replaceAll('_', '-')}`} />
                  <div>
                    <div className="timeline-title">
                      <strong>{item.subject}</strong>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p>CMP-{item.complaint_id} • {item.category} • {item.description}</p>
                    {item.admin_response && (
                      <p style={{ marginTop: '0.25rem', color: '#047857' }}>
                        <b>Warden Response:</b> {item.admin_response}
                      </p>
                    )}
                  </div>
                  <Badge>{item.priority}</Badge>
                </div>
              ))
            ) : (
              <p className="muted-text">No complaints logged.</p>
            )}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'leave') {
    return (
      <section className="content-stack">
        <PageHeader description="Submit outing or home leave requests for approval." title="Leave Requests" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleLeaveSubmit}>
          <h2>Request leave</h2>
          <div className="form-grid">
            <label>
              Leave type
              <select
                onChange={(event) => setLeaveForm({ ...leaveForm, type: event.target.value })}
                value={leaveForm.type}
              >
                <option>Home Visit</option>
                <option>Medical</option>
                <option>Academic Event</option>
                <option>Emergency</option>
              </select>
            </label>
            <label>
              From
              <input
                onChange={(event) => setLeaveForm({ ...leaveForm, from: event.target.value })}
                type="date"
                value={leaveForm.from}
              />
            </label>
            <label>
              To
              <input
                onChange={(event) => setLeaveForm({ ...leaveForm, to: event.target.value })}
                type="date"
                value={leaveForm.to}
              />
            </label>
            <label>
              Destination
              <input
                onChange={(event) => setLeaveForm({ ...leaveForm, destination: event.target.value })}
                placeholder="City or address"
                value={leaveForm.destination}
              />
            </label>
            <label className="full-field">
              Contact information
              <input
                onChange={(event) => setLeaveForm({ ...leaveForm, contact: event.target.value })}
                placeholder="Parent or emergency contact number"
                value={leaveForm.contact}
              />
            </label>
            <label className="full-field">
              Reason
              <textarea
                onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })}
                placeholder="Reason for leave"
                value={leaveForm.reason}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Submit Leave Request</button>
        </form>

        <article className="panel timeline-panel">
          <h2>Previous requests</h2>
          <div className="status-timeline">
            {leaveRequests.length > 0 ? (
              leaveRequests.map((item) => (
                <div className="timeline-item leave-item" key={item.leave_id}>
                  <span className={`timeline-dot ${item.status.toLowerCase()}`} />
                  <div>
                    <div className="timeline-title">
                      <strong>{item.leave_type}</strong>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p>{item.from_date} to {item.to_date} — {item.reason}</p>
                    {item.admin_comment && (
                      <p style={{ marginTop: '0.25rem', color: '#047857' }}>
                        <b>Admin Comment:</b> {item.admin_comment}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-text">No leave requests found.</p>
            )}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'fees') {
    const totalAmount = feeRecords.reduce((acc, f) => acc + f.amount, 0)
    const paidAmount = feeRecords.reduce((acc, f) => acc + f.paid_amount, 0)
    const pendingAmount = Math.max(0, totalAmount - paidAmount)

    return (
      <section className="content-stack">
        <PageHeader description="Hostel, mess and deposit payment status." title="Fees" />
        <div className="fee-overview">
          <article className="fee-hero">
            <span>Outstanding balance</span>
            <strong>Rs. {pendingAmount.toLocaleString('en-IN')}</strong>
            <p>Total billed: Rs. {totalAmount.toLocaleString('en-IN')}</p>
            <Badge>{pendingAmount === 0 ? 'PAID' : 'PENDING'}</Badge>
          </article>
          <article className="panel">
            <h2>Payment health</h2>
            <div className="fee-meter">
              <div
                style={{
                  width: `${totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 100}%`,
                  height: '100%',
                  background: '#047857',
                  borderRadius: '4px',
                }}
              />
            </div>
            <p className="muted-text" style={{ marginTop: '0.5rem' }}>
              Rs. {paidAmount.toLocaleString('en-IN')} paid of Rs. {totalAmount.toLocaleString('en-IN')}.
            </p>
          </article>
        </div>
        <article className="panel">
          <DataTable
            columns={[
              { key: 'fee_type', label: 'Fee type' },
              { key: 'amount', label: 'Total (Rs)', render: (row) => row.amount.toLocaleString('en-IN') },
              { key: 'paid_amount', label: 'Paid (Rs)', render: (row) => row.paid_amount.toLocaleString('en-IN') },
              { key: 'due_date', label: 'Due date' },
              { key: 'status', label: 'Status', badge: true },
            ]}
            rows={feeRecords}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'visitors') {
    return (
      <section className="content-stack">
        <PageHeader description="Submit and monitor visitor entry requests." title="Visitor Requests" />
        <FormMessage error={formError} success={feedback} />

        <form className="panel form-panel" onSubmit={handleVisitorSubmit}>
          <h2>Register Visitor Pass</h2>
          <div className="form-grid">
            <label>
              Visitor Name
              <input
                onChange={(e) => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })}
                placeholder="Full name"
                value={visitorForm.visitor_name}
              />
            </label>
            <label>
              Phone Number
              <input
                onChange={(e) => setVisitorForm({ ...visitorForm, visitor_phone: e.target.value })}
                placeholder="+91..."
                value={visitorForm.visitor_phone}
              />
            </label>
            <label>
              Relationship
              <select
                onChange={(e) => setVisitorForm({ ...visitorForm, relationship: e.target.value })}
                value={visitorForm.relationship}
              >
                <option>Parent</option>
                <option>Sibling</option>
                <option>Guardian</option>
                <option>Friend</option>
                <option>Relative</option>
              </select>
            </label>
            <label>
              Visit Date
              <input
                onChange={(e) => setVisitorForm({ ...visitorForm, visit_date: e.target.value })}
                type="date"
                value={visitorForm.visit_date}
              />
            </label>
            <label className="full-field">
              Purpose of Visit
              <textarea
                onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                placeholder="Reason or purpose for visiting campus"
                value={visitorForm.purpose}
              />
            </label>
          </div>
          <button className="primary-button form-submit" type="submit">Submit Visitor Request</button>
        </form>

        <article className="panel timeline-panel">
          <h2>Visitor Requests History</h2>
          <div className="status-timeline">
            {visitorRequests.length > 0 ? (
              visitorRequests.map((item) => (
                <div className="timeline-item" key={item.visitor_request_id}>
                  <span className={`timeline-dot ${item.status.toLowerCase()}`} />
                  <div>
                    <div className="timeline-title">
                      <strong>{item.visitor_name} ({item.relationship})</strong>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p>Visit date: {item.visit_date} • {item.purpose}</p>
                    {item.admin_comment && (
                      <p style={{ marginTop: '0.25rem', color: '#047857' }}>
                        <b>Gate Note:</b> {item.admin_comment}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-text">No visitor passes requested.</p>
            )}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'announcements') {
    return (
      <section className="content-stack">
        <PageHeader description="Official notices, hostel updates, and notifications." title="Hostel Announcements" />
        <div className="status-timeline">
          {announcements.length > 0 ? (
            announcements.map((item) => (
              <article className="panel" key={item.announcement_id} style={{ marginBottom: '1rem' }}>
                <div className="panel-header">
                  <h2>{item.title}</h2>
                  <Badge>{item.priority || 'Normal'}</Badge>
                </div>
                <p style={{ margin: '0.75rem 0', lineHeight: '1.5' }}>{item.content}</p>
                <span className="muted-text">Published: {new Date(item.published_at).toLocaleDateString()}</span>
              </article>
            ))
          ) : (
            <p className="muted-text">No active announcements.</p>
          )}
        </div>
      </section>
    )
  }

  // Profile view
  const currentRoom = profile?.current_room
  const avatar = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ST'

  return (
    <section className="content-stack">
      <PageHeader description="Student profile details maintained by hostel administration." title="Profile" />
      <FormMessage error={formError} success={feedback} />

      <article className="panel profile-card profile-page-card">
        <div className="avatar">{avatar}</div>
        <div>
          <h2>{profile?.name}</h2>
          <p>Roll No: KLH{profile?.student_id ? String(profile.student_id).padStart(4, '0') : '0000'}</p>
          <div className="detail-grid roomy">
            <span>Email<strong>{profile?.email}</strong></span>
            <span>Phone<strong>{profile?.phone || 'Not set'}</strong></span>
            <span>Course / Dept<strong>{profile?.department || 'Not set'}</strong></span>
            <span>Academic Year<strong>Year {profile?.year || 1}</strong></span>
            <span>Allocated Room<strong>{currentRoom?.room_number || 'None'}</strong></span>
            <span>Block<strong>{currentRoom?.block_name || 'None'}</strong></span>
          </div>
        </div>
      </article>

      <form className="panel form-panel" onSubmit={handleProfileSubmit}>
        <h2>Update Profile Info</h2>
        <div className="form-grid">
          <label>
            Phone Number
            <input
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+91..."
              value={profileForm.phone}
            />
          </label>
          <label>
            Department
            <input
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              placeholder="e.g. Computer Science"
              value={profileForm.department}
            />
          </label>
          <label>
            Academic Year
            <select
              onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
              value={profileForm.year}
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </label>
        </div>
        <button className="primary-button form-submit" type="submit">Save Profile</button>
      </form>
    </section>
  )
}

function FormMessage({ error, success }) {
  if (!error && !success) return null
  return <p className={error ? 'form-message error' : 'form-message success'}>{error || success}</p>
}

export default StudentViews
