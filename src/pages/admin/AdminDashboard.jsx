import { useEffect, useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { api } from '../../api/client'

function AdminDashboard({ onNavigate }) {
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [complaints, setComplaints] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [fees, setFees] = useState([])
  const [activityLogs, setActivityLogs] = useState([])

  const loadDashboardData = useCallback(() => {
    Promise.all([
      api.students.list().catch(() => []),
      api.rooms.list().catch(() => []),
      api.complaints.list().catch(() => []),
      api.leave.list().catch(() => []),
      api.fees.list().catch(() => []),
      api.activityLogs.list(10).catch(() => []),
    ]).then(([stList, rmList, cmList, lvList, feList, actList]) => {
      setStudents(stList)
      setRooms(rmList)
      setComplaints(cmList)
      setLeaveRequests(lvList)
      setFees(feList)
      setActivityLogs(actList)
    })
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupiedSpaces = rooms.reduce((sum, r) => sum + r.occupied_count, 0)
  const vacantSpaces = Math.max(0, totalCapacity - occupiedSpaces)
  const pendingComplaints = complaints.filter((item) => item.status === 'PENDING').length
  const pendingLeave = leaveRequests.filter((item) => item.status === 'PENDING').length

  // Group rooms by block for occupancy visualizer
  const blockMap = {}
  rooms.forEach((r) => {
    const bName = r.block_name || 'Block A'
    if (!blockMap[bName]) {
      blockMap[bName] = { block: bName, total: 0, occupied: 0, vacant: 0 }
    }
    blockMap[bName].total += r.capacity
    blockMap[bName].occupied += r.occupied_count
    blockMap[bName].vacant += r.available_capacity
  })
  const blockStats = Object.values(blockMap)

  // Fee categories summary
  const feeSummary = [
    {
      category: 'Hostel Fee',
      pending: `Rs. ${fees.filter((f) => f.fee_type.toLowerCase().includes('hostel') && f.status !== 'PAID').reduce((sum, f) => sum + (f.amount - f.paid_amount), 0).toLocaleString('en-IN')}`,
      count: fees.filter((f) => f.fee_type.toLowerCase().includes('hostel') && f.status !== 'PAID').length,
    },
    {
      category: 'Mess Fee',
      pending: `Rs. ${fees.filter((f) => f.fee_type.toLowerCase().includes('mess') && f.status !== 'PAID').reduce((sum, f) => sum + (f.amount - f.paid_amount), 0).toLocaleString('en-IN')}`,
      count: fees.filter((f) => f.fee_type.toLowerCase().includes('mess') && f.status !== 'PAID').length,
    },
    {
      category: 'Security Deposit',
      pending: `Rs. ${fees.filter((f) => f.fee_type.toLowerCase().includes('deposit') && f.status !== 'PAID').reduce((sum, f) => sum + (f.amount - f.paid_amount), 0).toLocaleString('en-IN')}`,
      count: fees.filter((f) => f.fee_type.toLowerCase().includes('deposit') && f.status !== 'PAID').length,
    },
  ]

  return (
    <section className="content-stack">
      <PageHeader
        action={<button onClick={() => onNavigate('students')} type="button">Manage students</button>}
        description="Monitor occupancy, student support, leave approvals, mess planning and fee collection."
        eyebrow="Admin dashboard"
        title="Hostel operations overview"
      />

      <div className="stats-grid admin-stats operations-strip">
        <StatCard helper="Active hostel records" label="Total students" value={students.length} />
        <StatCard
          helper={`${vacantSpaces} vacant of ${totalCapacity} beds`}
          label="Occupied capacity"
          tone="green"
          value={occupiedSpaces}
        />
        <StatCard helper="Need review" label="Pending complaints" tone="orange" value={pendingComplaints} />
        <StatCard helper="Awaiting decision" label="Pending leave" tone="red" value={pendingLeave} />
      </div>

      <div className="dashboard-grid">
        <article className="panel wide admin-occupancy">
          <div className="panel-header">
            <h2>Room occupancy</h2>
            <button onClick={() => onNavigate('rooms')} type="button">View rooms</button>
          </div>
          <div className="occupancy-bars">
            {blockStats.map((b) => (
              <div className="occupancy-row" key={b.block}>
                <span>{b.block}</span>
                <div className="progress-track">
                  <div style={{ width: `${b.total > 0 ? (b.occupied / b.total) * 100 : 0}%` }} />
                </div>
                <strong>{b.vacant} vacant</strong>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'block', label: 'Block' },
              { key: 'total', label: 'Capacity' },
              { key: 'occupied', label: 'Occupied' },
              { key: 'vacant', label: 'Vacant' },
            ]}
            rows={blockStats}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Fee summary</h2>
            <button onClick={() => onNavigate('fees')} type="button">Open fees</button>
          </div>
          <div className="fee-stack">
            {feeSummary.map((row) => (
              <div className="fee-item" key={row.category}>
                <div>
                  <strong>{row.category}</strong>
                  <span>{row.count} records pending</span>
                </div>
                <p>{row.pending}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Audit & Activity logs</h2>
          </div>
          <ul className="activity-list">
            {activityLogs.length > 0 ? (
              activityLogs.map((log) => (
                <li key={log.id || log.timestamp}>
                  <strong>[{log.role}] {log.action}: </strong>
                  <span>{JSON.stringify(log.details)}</span>
                </li>
              ))
            ) : (
              <li>No recent activity logs.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default AdminDashboard
