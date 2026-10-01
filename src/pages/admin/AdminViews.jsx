import { useState } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import { adminComplaints, feeRows, rooms } from '../../data/mockData'

function AdminViews({
  activeView,
  leaveRequests,
  menuItems,
  onAddStudent,
  onUpdateLeaveRequests,
  onUpdateMenuItems,
  onUpdateWeeklyMenu,
  students,
  weeklyMenu,
}) {
  const [studentForm, setStudentForm] = useState({ name: '', id: '', course: '', room: '' })
  const [menuForm, setMenuForm] = useState({ day: 'Friday', meal: 'Breakfast', items: '' })
  const [savedMenuEntries, setSavedMenuEntries] = useState([])
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')

  const clearMessages = () => {
    setFeedback('')
    setFormError('')
  }

  const updateStudentForm = (field, value) => {
    clearMessages()
    setStudentForm((current) => ({ ...current, [field]: value }))
  }

  const updateMenuForm = (field, value) => {
    clearMessages()
    setMenuForm((current) => ({ ...current, [field]: value }))
  }

  const handleStudentSubmit = (event) => {
    event.preventDefault()
    if (!studentForm.name.trim() || !studentForm.id.trim() || !studentForm.course.trim() || !studentForm.room.trim()) {
      setFormError('Please fill all student fields before adding the record.')
      setFeedback('')
      return
    }

    onAddStudent((current) => [
      {
        id: studentForm.id.trim(),
        name: studentForm.name.trim(),
        room: studentForm.room.trim(),
        course: studentForm.course.trim(),
        fee: 'Paid',
        status: 'Active',
      },
      ...current,
    ])
    setStudentForm({ name: '', id: '', course: '', room: '' })
    setFeedback('Student record added.')
    setFormError('')
  }

  const updateLeaveStatus = (id, status) => {
    onUpdateLeaveRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    )
    setFeedback(`Leave request ${status.toLowerCase()}.`)
    setFormError('')
  }

  const handleMenuSubmit = (event) => {
    event.preventDefault()
    if (!menuForm.day || !menuForm.meal || !menuForm.items.trim()) {
      setFormError('Please choose day, meal type and enter menu items.')
      setFeedback('')
      return
    }

    const mealKey = menuForm.meal.toLowerCase()
    if (['breakfast', 'lunch', 'dinner'].includes(mealKey)) {
      onUpdateWeeklyMenu((current) =>
        current.map((day) =>
          day.day === menuForm.day ? { ...day, [mealKey]: menuForm.items.trim() } : day,
        ),
      )
    }

    onUpdateMenuItems((current) =>
      current.map((meal) =>
        meal.meal === menuForm.meal ? { ...meal, items: menuForm.items.trim(), status: 'Updated' } : meal,
      ),
    )

    setSavedMenuEntries((current) => [
      { id: `${menuForm.day}-${menuForm.meal}-${current.length}`, ...menuForm, items: menuForm.items.trim() },
      ...current,
    ])
    setMenuForm((current) => ({ ...current, items: '' }))
    setFeedback('Menu saved and reflected below.')
    setFormError('')
  }

  if (activeView === 'students') {
    return (
      <section className="content-stack">
        <PageHeader title="Students" description="Student hostel records and allocation status." />
        <form className="panel form-panel" onSubmit={handleStudentSubmit}>
          <h2>Add student record</h2>
          <div className="form-grid">
            <label>
              Name
              <input
                onChange={(event) => updateStudentForm('name', event.target.value)}
                placeholder="Student name"
                value={studentForm.name}
              />
            </label>
            <label>
              Roll number
              <input
                onChange={(event) => updateStudentForm('id', event.target.value)}
                placeholder="KLH22CS000"
                value={studentForm.id}
              />
            </label>
            <label>
              Course
              <input
                onChange={(event) => updateStudentForm('course', event.target.value)}
                placeholder="Department"
                value={studentForm.course}
              />
            </label>
            <label>
              Room
              <input
                onChange={(event) => updateStudentForm('room', event.target.value)}
                placeholder="Block-room"
                value={studentForm.room}
              />
            </label>
          </div>
          <FormMessage error={formError} success={feedback} />
          <button className="primary-button form-submit" type="submit">Add Student</button>
        </form>
        <article className="panel">
          <DataTable
            columns={[
              { key: 'id', label: 'Roll No' },
              { key: 'name', label: 'Name' },
              { key: 'room', label: 'Room' },
              { key: 'course', label: 'Course' },
              { key: 'fee', label: 'Fee', badge: true },
              { key: 'status', label: 'Status', badge: true },
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
        <PageHeader title="Rooms" description="Block-wise occupancy and warden allocation." />
        <div className="stats-grid">
          {rooms.map((room) => (
            <article className="panel occupancy-card" key={room.block}>
              <div className="panel-header">
                <h2>Block {room.block}</h2>
                <span>{Math.round((room.occupied / room.total) * 100)}%</span>
              </div>
              <div className="progress-track">
                <div style={{ width: `${(room.occupied / room.total) * 100}%` }} />
              </div>
              <p>{room.vacant} rooms available</p>
            </article>
          ))}
        </div>
        <article className="panel">
          <DataTable
            columns={[
              { key: 'block', label: 'Block' },
              { key: 'total', label: 'Total rooms' },
              { key: 'occupied', label: 'Occupied' },
              { key: 'vacant', label: 'Vacant' },
              { key: 'warden', label: 'Warden' },
            ]}
            rows={rooms}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'complaints') {
    return (
      <section className="content-stack">
        <PageHeader title="Complaints" description="Assign and track student support tickets." />
        <article className="panel admin-ticket-board">
          <DataTable
            columns={[
              { key: 'id', label: 'Ticket' },
              { key: 'student', label: 'Student' },
              { key: 'room', label: 'Room' },
              { key: 'category', label: 'Category' },
              { key: 'priority', label: 'Priority', badge: true },
              { key: 'status', label: 'Status', badge: true },
            ]}
            rows={adminComplaints}
          />
        </article>
      </section>
    )
  }

  if (activeView === 'leave') {
    return (
      <section className="content-stack">
        <PageHeader title="Leave Requests" description="Review hostel leave requests awaiting warden decision." />
        <article className="panel admin-ticket-board">
          <DataTable
            columns={[
              { key: 'id', label: 'Request' },
              { key: 'student', label: 'Student' },
              { key: 'dates', label: 'Dates' },
              { key: 'destination', label: 'Destination' },
              { key: 'status', label: 'Status', badge: true },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) =>
                  row.status === 'Pending' ? (
                    <div className="action-row">
                      <button onClick={() => updateLeaveStatus(row.id, 'Approved')} type="button">Approve</button>
                      <button onClick={() => updateLeaveStatus(row.id, 'Rejected')} type="button">Reject</button>
                    </div>
                  ) : (
                    <span className="muted-text">Completed</span>
                  ),
              },
            ]}
            rows={leaveRequests}
          />
        </article>
        <FormMessage error={formError} success={feedback} />
      </section>
    )
  }

  if (activeView === 'mess') {
    return (
      <section className="content-stack">
        <PageHeader title="Mess" description="Manage daily menu and weekly planning." />
        <form className="panel form-panel" onSubmit={handleMenuSubmit}>
          <h2>Update menu item</h2>
          <div className="form-grid">
            <label>
              Day
              <select onChange={(event) => updateMenuForm('day', event.target.value)} value={menuForm.day}>
                {weeklyMenu.map((day) => (
                  <option key={day.day}>{day.day}</option>
                ))}
              </select>
            </label>
            <label>
              Meal type
              <select onChange={(event) => updateMenuForm('meal', event.target.value)} value={menuForm.meal}>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Snacks</option>
                <option>Dinner</option>
              </select>
            </label>
            <label className="full-field">
              Menu items
              <textarea
                onChange={(event) => updateMenuForm('items', event.target.value)}
                placeholder="Enter menu items"
                value={menuForm.items}
              />
            </label>
          </div>
          <FormMessage error={formError} success={feedback} />
          <button className="primary-button form-submit" type="submit">Save Menu</button>
        </form>
        <article className="panel meal-board">
          <h2>Today's menu</h2>
          <DataTable
            columns={[
              { key: 'meal', label: 'Meal' },
              { key: 'time', label: 'Time' },
              { key: 'items', label: 'Items' },
              { key: 'status', label: 'Status', badge: true },
            ]}
            rows={menuItems}
          />
        </article>
        {savedMenuEntries.length > 0 ? (
          <article className="panel saved-menu-panel">
            <h2>Recently saved entries</h2>
            <div className="saved-menu-grid">
              {savedMenuEntries.map((entry) => (
                <div className="saved-menu-card" key={entry.id}>
                  <strong>{entry.day} - {entry.meal}</strong>
                  <p>{entry.items}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}
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

  return (
    <section className="content-stack">
      <PageHeader title="Fees" description="Collection summary and pending fee categories." />
      <div className="fee-overview admin-fees">
        <article className="fee-hero">
          <span>Pending collections</span>
          <strong>Rs. 5.8L</strong>
          <p>Across hostel, mess and deposit categories</p>
        </article>
        <article className="panel">
          <h2>Collection progress</h2>
          <div className="fee-meter">
            <div />
          </div>
          <p className="muted-text">Most payments collected, follow-up needed for pending students.</p>
        </article>
      </div>
      <article className="panel">
        <DataTable
          columns={[
            { key: 'category', label: 'Category' },
            { key: 'collected', label: 'Collected' },
            { key: 'pending', label: 'Pending' },
            { key: 'students', label: 'Students pending' },
          ]}
          rows={feeRows}
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
