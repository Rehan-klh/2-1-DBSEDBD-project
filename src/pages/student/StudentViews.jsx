import { useState } from 'react'
import Badge from '../../components/Badge'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import { fees, messMenu, student, weeklyMenu } from '../../data/mockData'

const feeRows = [
  { type: 'Hostel Fee', amount: fees.hostel.amount, dueDate: fees.hostel.dueDate, status: fees.hostel.status },
  { type: 'Mess Fee', amount: fees.mess.amount, dueDate: fees.mess.dueDate, status: fees.mess.status },
  { type: 'Security Deposit', amount: fees.deposit.amount, dueDate: fees.deposit.dueDate, status: fees.deposit.status },
]

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function StudentViews({ activeView, complaints, leaveRequests, onAddComplaint, onAddLeaveRequest }) {
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
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')

  const clearMessages = () => {
    setFeedback('')
    setFormError('')
  }

  const updateComplaintForm = (field, value) => {
    clearMessages()
    setComplaintForm((current) => ({ ...current, [field]: value }))
  }

  const updateLeaveForm = (field, value) => {
    clearMessages()
    setLeaveForm((current) => ({ ...current, [field]: value }))
  }

  const handleComplaintSubmit = (event) => {
    event.preventDefault()
    if (!complaintForm.category.trim() || !complaintForm.subject.trim() || !complaintForm.description.trim()) {
      setFormError('Please fill category, subject and description before submitting.')
      setFeedback('')
      return
    }

    const newComplaint = {
      id: `CMP-${1100 + complaints.length}`,
      category: complaintForm.category.trim(),
      subject: complaintForm.subject.trim(),
      date: '11 Sep 2026',
      status: 'Pending',
      priority: complaintForm.priority,
    }

    onAddComplaint((current) => [newComplaint, ...current])
    setComplaintForm({ category: '', subject: '', description: '', priority: 'Medium' })
    setFeedback('Complaint submitted successfully.')
    setFormError('')
  }

  const handleLeaveSubmit = (event) => {
    event.preventDefault()
    if (!leaveForm.type || !leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) {
      setFormError('Please fill leave type, from date, to date and reason before submitting.')
      setFeedback('')
      return
    }

    const newLeaveRequest = {
      id: `LR-${240 + leaveRequests.length}`,
      destination: leaveForm.destination.trim() || 'Not specified',
      from: formatDate(leaveForm.from),
      to: formatDate(leaveForm.to),
      reason: `${leaveForm.type}: ${leaveForm.reason.trim()}${leaveForm.contact ? ` Contact ${leaveForm.contact.trim()}` : ''}`,
      status: 'Pending',
    }

    onAddLeaveRequest((current) => [newLeaveRequest, ...current])
    setLeaveForm({
      type: 'Home Visit',
      from: '',
      to: '',
      destination: '',
      contact: '',
      reason: '',
    })
    setFeedback('Leave request submitted.')
    setFormError('')
  }

  if (activeView === 'room') {
    return (
      <section className="content-stack">
        <PageHeader title="My Room" description="Your allocated hostel room and roommate details." />
        <section className="room-hero">
          <div>
            <span className="eyebrow">Room key</span>
            <h2>{student.room.roomNo}</h2>
            <p>{student.room.block} - {student.room.floor} - {student.room.type}</p>
          </div>
          <div className="room-plan" aria-label="Three bed room occupancy">
            <span className="bed occupied">Rohan</span>
            <span className="bed active">You</span>
            <span className="bed occupied">Vikram</span>
          </div>
        </section>
        <div className="two-column">
          <article className="panel room-details-panel">
            <h2>Room assignment</h2>
            <div className="detail-grid roomy">
              <span>Room number<strong>{student.room.roomNo}</strong></span>
              <span>Block<strong>{student.room.block}</strong></span>
              <span>Room type<strong>{student.room.type}</strong></span>
              <span>Bed<strong>{student.room.bed}</strong></span>
              <span>Floor<strong>{student.room.floor}</strong></span>
              <span>Warden<strong>{student.room.warden}</strong></span>
            </div>
          </article>
          <article className="panel roommate-panel">
            <h2>Roommates</h2>
            <div className="person-list">
              {student.room.roommates.map((name) => (
                <div className="person-row" key={name}>
                  <span className="mini-avatar">{name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{name}</strong>
                    <p>{student.room.roomNo}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    )
  }

  if (activeView === 'mess') {
    return (
      <section className="content-stack">
        <PageHeader title="Mess Menu" description="Daily serving schedule and weekly menu plan." />
        <article className="panel meal-board today-board">
          <h2>Today</h2>
          <div className="meal-list">
            {messMenu.map((meal) => (
              <div className="meal-item" key={meal.meal}>
                <div>
                  <strong>{meal.meal}</strong>
                  <span>{meal.time}</span>
                  <p>{meal.items}</p>
                </div>
                <Badge>{meal.status}</Badge>
              </div>
            ))}
          </div>
        </article>
        <article className="panel weekly-board-panel">
          <h2>Weekly plan</h2>
          <div className="weekly-meal-board">
            {weeklyMenu.map((day) => (
              <div className={day.day === 'Friday' ? 'day-card today' : 'day-card'} key={day.day}>
                <strong>{day.day}</strong>
                <span><b>Breakfast</b>{day.breakfast}</span>
                <span><b>Lunch</b>{day.lunch}</span>
                <span><b>Dinner</b>{day.dinner}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'complaints') {
    return (
      <section className="content-stack">
        <PageHeader title="Complaints" description="Raise and monitor maintenance or hostel service issues." />
        <form className="panel form-panel" onSubmit={handleComplaintSubmit}>
          <h2>New complaint</h2>
          <div className="form-grid">
            <label>
              Category
              <input
                onChange={(event) => updateComplaintForm('category', event.target.value)}
                placeholder="Electrical, housekeeping, plumbing"
                value={complaintForm.category}
              />
            </label>
            <label>
              Priority
              <select
                onChange={(event) => updateComplaintForm('priority', event.target.value)}
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
                onChange={(event) => updateComplaintForm('subject', event.target.value)}
                placeholder="Short issue title"
                value={complaintForm.subject}
              />
            </label>
            <label className="full-field">
              Description
              <textarea
                onChange={(event) => updateComplaintForm('description', event.target.value)}
                placeholder="Describe the issue clearly"
                value={complaintForm.description}
              />
            </label>
          </div>
          <FormMessage error={formError} success={feedback} />
          <button className="primary-button form-submit" type="submit">Submit Complaint</button>
        </form>
        <article className="panel timeline-panel">
          <h2>Complaint history</h2>
          <div className="status-timeline">
            {complaints.map((item) => (
              <div className="timeline-item" key={item.id}>
                <span className={`timeline-dot ${item.status.toLowerCase().replaceAll(' ', '-')}`} />
                <div>
                  <div className="timeline-title">
                    <strong>{item.subject}</strong>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p>{item.id} - {item.category} - {item.date}</p>
                </div>
                <Badge>{item.priority}</Badge>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'leave') {
    return (
      <section className="content-stack">
        <PageHeader title="Leave Requests" description="Submit outing or home leave requests for approval." />
        <form className="panel form-panel" onSubmit={handleLeaveSubmit}>
          <h2>Request leave</h2>
          <div className="form-grid">
            <label>
              Leave type
              <select onChange={(event) => updateLeaveForm('type', event.target.value)} value={leaveForm.type}>
                <option>Home Visit</option>
                <option>Medical</option>
                <option>Academic Event</option>
                <option>Emergency</option>
              </select>
            </label>
            <label>
              From
              <input onChange={(event) => updateLeaveForm('from', event.target.value)} type="date" value={leaveForm.from} />
            </label>
            <label>
              To
              <input onChange={(event) => updateLeaveForm('to', event.target.value)} type="date" value={leaveForm.to} />
            </label>
            <label>
              Destination
              <input
                onChange={(event) => updateLeaveForm('destination', event.target.value)}
                placeholder="City or address"
                value={leaveForm.destination}
              />
            </label>
            <label className="full-field">
              Contact information
              <input
                onChange={(event) => updateLeaveForm('contact', event.target.value)}
                placeholder="Parent or local contact number"
                value={leaveForm.contact}
              />
            </label>
            <label className="full-field">
              Reason
              <textarea
                onChange={(event) => updateLeaveForm('reason', event.target.value)}
                placeholder="Reason for leave"
                value={leaveForm.reason}
              />
            </label>
          </div>
          <FormMessage error={formError} success={feedback} />
          <button className="primary-button form-submit" type="submit">Submit Leave Request</button>
        </form>
        <article className="panel timeline-panel">
          <h2>Previous requests</h2>
          <div className="status-timeline">
            {leaveRequests.map((item) => (
              <div className="timeline-item leave-item" key={item.id}>
                <span className={`timeline-dot ${item.status.toLowerCase()}`} />
                <div>
                  <div className="timeline-title">
                    <strong>{item.destination}</strong>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p>{item.from} to {item.to} - {item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  if (activeView === 'fees') {
    return (
      <section className="content-stack">
        <PageHeader title="Fees" description="Hostel, mess and deposit payment status." />
        <div className="fee-overview">
          <article className="fee-hero">
            <span>Amount due</span>
            <strong>{fees.mess.amount}</strong>
            <p>{fees.mess.dueDate}</p>
            <Badge>{fees.mess.status}</Badge>
          </article>
          <article className="panel">
            <h2>Payment health</h2>
            <div className="fee-meter">
              <div />
            </div>
            <p className="muted-text">2 of 3 fee categories are paid.</p>
          </article>
        </div>
        <article className="panel">
          <DataTable
            columns={[
              { key: 'type', label: 'Fee type' },
              { key: 'amount', label: 'Amount' },
              { key: 'dueDate', label: 'Due date' },
              { key: 'status', label: 'Status', badge: true },
            ]}
            rows={feeRows}
          />
        </article>
      </section>
    )
  }

  return (
    <section className="content-stack">
      <PageHeader title="Profile" description="Student profile details maintained by hostel administration." />
      <article className="panel profile-card profile-page-card">
        <div className="avatar">{student.avatar}</div>
        <div>
          <h2>{student.name}</h2>
          <p>{student.id}</p>
          <div className="detail-grid roomy">
            <span>Email<strong>{student.email}</strong></span>
            <span>Phone<strong>{student.phone}</strong></span>
            <span>Course<strong>{student.course}</strong></span>
            <span>Semester<strong>{student.semester}</strong></span>
            <span>Guardian<strong>{student.guardian}</strong></span>
            <span>Room<strong>{student.room.roomNo}</strong></span>
          </div>
        </div>
      </article>
    </section>
  )
}

function FormMessage({ error, success }) {
  if (!error && !success) return null

  return <p className={error ? 'form-message error' : 'form-message success'}>{error || success}</p>
}

export default StudentViews
