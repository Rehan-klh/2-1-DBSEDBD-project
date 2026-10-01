import Badge from '../../components/Badge'
import StatCard from '../../components/StatCard'
import { fees, messMenu, notifications, student } from '../../data/mockData'

function StudentDashboard({ complaints, leaveRequests, onNavigate }) {
  const pendingComplaints = complaints.filter((item) => item.status !== 'Resolved')
  const activeLeave = leaveRequests[0]

  return (
    <section className="content-stack">
      <section className="student-hero">
        <div>
          <span className="eyebrow">Student dashboard</span>
          <h1>Welcome back, {student.name}</h1>
          <p>Room, mess, leave and fee updates for your hostel day.</p>
          <div className="hero-actions">
            <button onClick={() => onNavigate('complaints')} type="button">New complaint</button>
            <button onClick={() => onNavigate('leave')} type="button">Request leave</button>
          </div>
        </div>
        <div className="room-key-card">
          <span>Current room</span>
          <strong>{student.room.roomNo}</strong>
          <p>{student.room.block} - {student.room.floor} - {student.room.type}</p>
          <div className="bed-row" aria-label="Room occupancy">
            <span className="bed occupied">1</span>
            <span className="bed active">2</span>
            <span className="bed occupied">3</span>
          </div>
        </div>
      </section>

      <div className="status-strip">
        <StatCard label="Pending complaints" value={pendingComplaints.length} helper="Maintenance queue" tone="orange" />
        <StatCard label="Leave status" value={activeLeave.status} helper={`${activeLeave.from} to ${activeLeave.to}`} tone="green" />
        <StatCard label="Mess fee" value={fees.mess.status} helper={fees.mess.dueDate} tone="red" />
      </div>

      <div className="dashboard-grid">
        <article className="panel profile-card profile-band">
          <div className="avatar">{student.avatar}</div>
          <div>
            <h2>{student.name}</h2>
            <p>{student.id}</p>
            <div className="profile-meta">
              <span>{student.course}</span>
              <span>{student.semester}</span>
              <span>{student.email}</span>
            </div>
          </div>
        </article>

        <article className="panel room-snapshot">
          <div className="panel-header">
            <h2>Room information</h2>
            <Badge>{student.room.bed}</Badge>
          </div>
          <div className="detail-grid">
            <span>Block<strong>{student.room.block}</strong></span>
            <span>Room<strong>{student.room.roomNo}</strong></span>
            <span>Floor<strong>{student.room.floor}</strong></span>
            <span>Warden<strong>{student.room.warden}</strong></span>
          </div>
        </article>

        <article className="panel wide meal-board today-board">
          <div className="panel-header">
            <h2>Today's mess menu</h2>
            <button onClick={() => onNavigate('mess')} type="button">View week</button>
          </div>
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

        <article className="panel update-panel">
          <div className="panel-header">
            <h2>Recent activity</h2>
          </div>
          <ul className="activity-list">
            {notifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default StudentDashboard
