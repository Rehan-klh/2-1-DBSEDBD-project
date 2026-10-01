const statusTone = {
  Paid: 'success',
  Active: 'success',
  Approved: 'success',
  Resolved: 'success',
  Serving: 'success',
  Due: 'danger',
  Pending: 'warning',
  Rejected: 'danger',
  'In Progress': 'info',
  Upcoming: 'neutral',
  'On Leave': 'info',
  'Mess Due': 'warning',
  'Hostel Due': 'danger',
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

function Badge({ children, tone }) {
  const badgeTone = tone || statusTone[children] || 'neutral'
  return <span className={`badge badge-${badgeTone}`}>{children}</span>
}

export default Badge
