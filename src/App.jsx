import { useMemo, useState } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentViews from './pages/student/StudentViews'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminViews from './pages/admin/AdminViews'
import DashboardLayout from './components/DashboardLayout'
import { api, getAuthUser, getToken } from './api/client'

const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
  { id: 'room', label: 'My Room', icon: 'RM' },
  { id: 'mess', label: 'Mess Menu', icon: 'MS' },
  { id: 'complaints', label: 'Complaints', icon: 'CP' },
  { id: 'leave', label: 'Leave Requests', icon: 'LV' },
  { id: 'fees', label: 'Fees', icon: 'FE' },
  { id: 'visitors', label: 'Visitors', icon: 'VS' },
  { id: 'announcements', label: 'Announcements', icon: 'AN' },
  { id: 'profile', label: 'Profile', icon: 'PR' },
]

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
  { id: 'students', label: 'Students', icon: 'ST' },
  { id: 'rooms', label: 'Rooms', icon: 'RM' },
  { id: 'allocations', label: 'Allocations', icon: 'AL' },
  { id: 'room-changes', label: 'Room Changes', icon: 'RC' },
  { id: 'leave', label: 'Leave', icon: 'LV' },
  { id: 'complaints', label: 'Complaints', icon: 'CP' },
  { id: 'mess', label: 'Mess', icon: 'MS' },
  { id: 'fees', label: 'Fees', icon: 'FE' },
  { id: 'visitors', label: 'Visitors', icon: 'VS' },
  { id: 'announcements', label: 'Notices', icon: 'AN' },
  { id: 'logs', label: 'Activity Logs', icon: 'LG' },
]

const routeDefaults = {
  student: 'dashboard',
  admin: 'dashboard',
}

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
