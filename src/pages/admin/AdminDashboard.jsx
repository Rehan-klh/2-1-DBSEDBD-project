import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import {
  adminComplaints,
  feeRows,
  recentActivity,
  rooms,
} from '../../data/mockData'

function AdminDashboard({ leaveRequests, onNavigate, students }) {
  const totalRooms = rooms.reduce((sum, room) => sum + room.total, 0)
  const occupiedRooms = rooms.reduce((sum, room) => sum + room.occupied, 0)
  const vacantRooms = rooms.reduce((sum, room) => sum + room.vacant, 0)
  const pendingComplaints = adminComplaints.filter((item) => item.status === 'Pending').length
  const pendingLeave = leaveRequests.filter((item) => item.status === 'Pending').length

  return (
    <section className="content-stack">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Hostel operations overview"
        description="Monitor occupancy, student support, leave approvals, mess planning and fee collection."
        action={<button onClick={() => onNavigate('students')} type="button">Manage students</button>}
      />

      <div className="stats-grid admin-stats operations-strip">
        <StatCard label="Total students" value={students.length} helper="Active hostel records" />
        <StatCard label="Occupied rooms" value={occupiedRooms} helper={`${vacantRooms} vacant of ${totalRooms}`} tone="green" />
        <StatCard label="Pending complaints" value={pendingComplaints} helper="Need assignment" tone="orange" />
        <StatCard label="Pending leave" value={pendingLeave} helper="Awaiting approval" tone="red" />
      </div>

      <div className="dashboard-grid">
        <article className="panel wide admin-occupancy">
          <div className="panel-header">
            <h2>Room occupancy</h2>
            <button onClick={() => onNavigate('rooms')} type="button">View rooms</button>
          </div>
          <div className="occupancy-bars">
            {rooms.map((room) => (
              <div className="occupancy-row" key={room.block}>
                <span>Block {room.block}</span>
                <div className="progress-track">
                  <div style={{ width: `${(room.occupied / room.total) * 100}%` }} />
                </div>
                <strong>{room.vacant} vacant</strong>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'block', label: 'Block' },
              { key: 'total', label: 'Total' },
              { key: 'occupied', label: 'Occupied' },
              { key: 'vacant', label: 'Vacant' },
              { key: 'warden', label: 'Warden' },
            ]}
            rows={rooms}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Fee summary</h2>
            <button onClick={() => onNavigate('fees')} type="button">Open fees</button>
          </div>
          <div className="fee-stack">
            {feeRows.map((row) => (
              <div className="fee-item" key={row.category}>
                <div>
                  <strong>{row.category}</strong>
                  <span>{row.students} students pending</span>
                </div>
                <p>{row.pending}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Recent activity</h2>
          </div>
          <ul className="activity-list">
            {recentActivity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default AdminDashboard
