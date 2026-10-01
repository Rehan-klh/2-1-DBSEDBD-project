import { useEffect, useState } from 'react'
import Badge from '../../components/Badge'
import StatCard from '../../components/StatCard'
import { api } from '../../api/client'

function StudentDashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.students.getDashboard()
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load dashboard data')
      })
    return () => {
      active = false
    }
  }, [])

  if (!data && !error) {
    return (
      <section className="content-stack">
        <p className="muted-text">Loading dashboard data...</p>
      </section>
    )
  }

  if (error && !data) {
    return (
      <section className="content-stack">
        <div className="form-message error">{error}</div>
      </section>
    )
  }

  const student = data?.student || {}
  const currentRoom = student.current_room
  const pendingComplaintsCount = data?.pending_complaints_count ?? 0
  const activeLeave = data?.active_leave
  const feesList = data?.fees || []
  const messFee = feesList.find((f) => f.fee_type.toLowerCase().includes('mess')) || {
    status: 'No dues',
    due_date: 'Up to date',
  }
  const menuList = data?.menu || []
  const notifs = data?.notifications || []

  const avatar = student.name
    ? student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ST'

  return (
    <section className="content-stack">
      <section className="student-hero">
        <div>
          <span className="eyebrow">Student dashboard</span>
          <h1>Welcome back, {student.name || 'Student'}</h1>
          <p>Room, mess, leave and fee updates for your hostel day.</p>
          <div className="hero-actions">
            <button onClick={() => onNavigate('complaints')} type="button">New complaint</button>
            <button onClick={() => onNavigate('leave')} type="button">Request leave</button>
          </div>
        </div>
        <div className="room-key-card">
          <span>Current room</span>
          <strong>{currentRoom ? currentRoom.room_number : 'Not Allocated'}</strong>
          <p>
            {currentRoom
              ? `${currentRoom.block_name} - Floor ${currentRoom.floor || 1} - ${currentRoom.capacity} Sharing`
              : 'Browse available rooms to allocate'}
          </p>
          <div className="bed-row" aria-label="Room occupancy">
            {currentRoom ? (
              Array.from({ length: currentRoom.capacity }).map((_, i) => (
                <span
                  className={i === 0 ? 'bed active' : i <= (currentRoom.roommates?.length || 0) ? 'bed occupied' : 'bed'}
                  key={i}
                >
                  {i + 1}
                </span>
              ))
            ) : (
              <span className="bed">None</span>
            )}
          </div>
        </div>
      </section>

      <div className="status-strip">
        <StatCard
          helper="Maintenance queue"
          label="Pending complaints"
          tone="orange"
          value={pendingComplaintsCount}
        />
        <StatCard
          helper={activeLeave ? `${activeLeave.from_date} to ${activeLeave.to_date}` : 'No active requests'}
          label="Leave status"
          tone="green"
          value={activeLeave ? activeLeave.status : 'None'}
        />
        <StatCard
          helper={messFee.due_date ? `Due: ${messFee.due_date}` : 'Status'}
          label="Mess fee"
          tone={messFee.status === 'PAID' ? 'green' : 'red'}
          value={messFee.status}
        />
      </div>

      <div className="dashboard-grid">
        <article className="panel profile-card profile-band">
          <div className="avatar">{avatar}</div>
          <div>
            <h2>{student.name}</h2>
            <p>Roll No: KLH{student.student_id ? String(student.student_id).padStart(4, '0') : '0000'}</p>
            <div className="profile-meta">
              <span>{student.department || 'Department'}</span>
              <span>Year {student.year || 1}</span>
              <span>{student.email}</span>
            </div>
          </div>
        </article>

        <article className="panel room-snapshot">
          <div className="panel-header">
            <h2>Room information</h2>
            <Badge>{currentRoom ? `${currentRoom.capacity} Sharing` : 'Unassigned'}</Badge>
          </div>
          <div className="detail-grid">
            <span>Block<strong>{currentRoom?.block_name || 'N/A'}</strong></span>
            <span>Room<strong>{currentRoom?.room_number || 'None'}</strong></span>
            <span>Floor<strong>{currentRoom?.floor ? `Floor ${currentRoom.floor}` : 'N/A'}</strong></span>
            <span>Roommates<strong>{currentRoom?.roommates?.length ? currentRoom.roommates.join(', ') : 'None'}</strong></span>
          </div>
        </article>

        <article className="panel wide meal-board today-board">
          <div className="panel-header">
            <h2>Today's mess menu</h2>
            <button onClick={() => onNavigate('mess')} type="button">View week</button>
          </div>
          <div className="meal-list">
            {menuList.length > 0 ? (
              menuList.slice(0, 4).map((meal) => (
                <div className="meal-item" key={meal.menu_id || meal.meal_type}>
                  <div>
                    <strong>{meal.meal_type}</strong>
                    <span>{meal.day}</span>
                    <p>{meal.menu_items}</p>
                  </div>
                  <Badge>{meal.meal_type}</Badge>
                </div>
              ))
            ) : (
              <p className="muted-text">Menu will be served shortly.</p>
            )}
          </div>
        </article>

        <article className="panel update-panel">
          <div className="panel-header">
            <h2>Recent notifications</h2>
          </div>
          <ul className="activity-list">
            {notifs.length > 0 ? (
              notifs.map((item) => (
                <li key={item.id || item.created_at}>
                  <strong>{item.title}: </strong>{item.message}
                </li>
              ))
            ) : (
              <li>No new notifications.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default StudentDashboard
