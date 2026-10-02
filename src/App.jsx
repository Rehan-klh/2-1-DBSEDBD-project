import { useMemo, useState } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentViews from './pages/student/StudentViews'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminViews from './pages/admin/AdminViews'
import DashboardLayout from './components/DashboardLayout'
import { api, getAuthUser, getToken } from './api/client'

/* ─── Inline SVG icon helpers ────────────────────────────────────────────── */
const Icon = ({ d, children, viewBox = '0 0 24 24' }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="14"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox={viewBox}
    width="14"
  >
    {d ? <path d={d} /> : children}
  </svg>
)

const icons = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  ),
  students: (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  room: (
    <Icon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  ),
  rooms: (
    <Icon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  ),
  mess: (
    <Icon>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </Icon>
  ),
  complaints: (
    <Icon>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Icon>
  ),
  leave: (
    <Icon>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Icon>
  ),
  fees: (
    <Icon>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  ),
  visitors: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  ),
  announcements: (
    <Icon>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Icon>
  ),
  profile: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  ),
  allocations: (
    <Icon>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Icon>
  ),
  'room-changes': (
    <Icon>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Icon>
  ),
  logs: (
    <Icon>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </Icon>
  ),
}

/* ─── Nav definitions ────────────────────────────────────────────────────── */
const studentNavItems = [
  { id: 'dashboard',     label: 'Dashboard',    icon: icons.dashboard },
  { id: 'room',          label: 'My Room',       icon: icons.room },
  { id: 'mess',          label: 'Mess Menu',     icon: icons.mess },
  { id: 'complaints',    label: 'Complaints',    icon: icons.complaints },
  { id: 'leave',         label: 'Leave',         icon: icons.leave },
  { id: 'fees',          label: 'Fees',          icon: icons.fees },
  { id: 'visitors',      label: 'Visitors',      icon: icons.visitors },
  { id: 'announcements', label: 'Notices',       icon: icons.announcements },
  { id: 'profile',       label: 'Profile',       icon: icons.profile },
]

const adminNavItems = [
  { id: 'dashboard',     label: 'Dashboard',    icon: icons.dashboard },
  { id: 'students',      label: 'Students',     icon: icons.students },
  { id: 'rooms',         label: 'Rooms',        icon: icons.rooms },
  { id: 'allocations',   label: 'Allocations',  icon: icons.allocations },
  { id: 'room-changes',  label: 'Room Changes', icon: icons['room-changes'] },
  { id: 'leave',         label: 'Leave',        icon: icons.leave },
  { id: 'complaints',    label: 'Complaints',   icon: icons.complaints },
  { id: 'mess',          label: 'Mess',         icon: icons.mess },
  { id: 'fees',          label: 'Fees',         icon: icons.fees },
  { id: 'visitors',      label: 'Visitors',     icon: icons.visitors },
  { id: 'announcements', label: 'Notices',      icon: icons.announcements },
  { id: 'logs',          label: 'Activity',     icon: icons.logs },
]

const routeDefaults = {
  student: 'dashboard',
  admin: 'dashboard',
}

/* ─── Root component ────────────────────────────────────────────────────── */
function App() {
  const [session, setSession] = useState(() => {
    const token = getToken()
    const storedUser = getAuthUser()
    if (token && storedUser?.role) {
      return {
        isLoggedIn: true,
        role: storedUser.role.toLowerCase(),
        user: storedUser,
      }
    }
    return {
      isLoggedIn: false,
      role: 'student',
      user: null,
    }
  })
  const [activeView, setActiveView] = useState('dashboard')

  const navItems = useMemo(
    () => (session.role === 'admin' ? adminNavItems : studentNavItems),
    [session.role],
  )

  const handleLogin = (role, user) => {
    setSession({ isLoggedIn: true, role, user })
    setActiveView(routeDefaults[role] || 'dashboard')
  }

  const handleLogout = () => {
    api.auth.logout()
    setSession({ isLoggedIn: false, role: 'student', user: null })
    setActiveView('dashboard')
  }

  if (!session.isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  const isStudent = session.role === 'student'
  const title = isStudent ? 'Student Portal' : 'Admin Console'

  return (
    <DashboardLayout
      activeView={activeView}
      navItems={navItems}
      onLogout={handleLogout}
      onNavigate={setActiveView}
      role={session.role}
      title={title}
    >
      {isStudent ? (
        activeView === 'dashboard' ? (
          <StudentDashboard onNavigate={setActiveView} />
        ) : (
          <StudentViews activeView={activeView} />
        )
      ) : activeView === 'dashboard' ? (
        <AdminDashboard onNavigate={setActiveView} />
      ) : (
        <AdminViews activeView={activeView} />
      )}
    </DashboardLayout>
  )
}

export default App
