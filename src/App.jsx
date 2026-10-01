import { useMemo, useState } from 'react'
import './App.css'
import {
  adminLeaveRequests,
  adminNavItems,
  complaints,
  leaveRequests,
  messMenu,
  studentNavItems,
  students,
  weeklyMenu,
} from './data/mockData'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentViews from './pages/student/StudentViews'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminViews from './pages/admin/AdminViews'
import DashboardLayout from './components/DashboardLayout'

const initialSession = {
  isLoggedIn: false,
  role: 'student',
}

const routeDefaults = {
  student: 'dashboard',
  admin: 'dashboard',
}

function App() {
  const [session, setSession] = useState(initialSession)
  const [activeView, setActiveView] = useState(routeDefaults.student)
  const [studentComplaintItems, setStudentComplaintItems] = useState(complaints)
  const [studentLeaveItems, setStudentLeaveItems] = useState(leaveRequests)
  const [adminLeaveItems, setAdminLeaveItems] = useState(adminLeaveRequests)
  const [adminStudentItems, setAdminStudentItems] = useState(students)
  const [adminMenuItems, setAdminMenuItems] = useState(messMenu)
  const [adminWeeklyItems, setAdminWeeklyItems] = useState(weeklyMenu)

  const navItems = useMemo(
    () => (session.role === 'admin' ? adminNavItems : studentNavItems),
    [session.role],
  )

  const handleLogin = (role) => {
    setSession({ isLoggedIn: true, role })
    setActiveView(routeDefaults[role])
  }

  const handleLogout = () => {
    setSession(initialSession)
    setActiveView(routeDefaults.student)
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
          <StudentDashboard
            complaints={studentComplaintItems}
            leaveRequests={studentLeaveItems}
            onNavigate={setActiveView}
          />
        ) : (
          <StudentViews
            activeView={activeView}
            complaints={studentComplaintItems}
            leaveRequests={studentLeaveItems}
            onAddComplaint={setStudentComplaintItems}
            onAddLeaveRequest={setStudentLeaveItems}
          />
        )
      ) : activeView === 'dashboard' ? (
        <AdminDashboard
          leaveRequests={adminLeaveItems}
          onNavigate={setActiveView}
          students={adminStudentItems}
        />
      ) : (
        <AdminViews
          activeView={activeView}
          leaveRequests={adminLeaveItems}
          menuItems={adminMenuItems}
          onAddStudent={setAdminStudentItems}
          onUpdateLeaveRequests={setAdminLeaveItems}
          onUpdateMenuItems={setAdminMenuItems}
          onUpdateWeeklyMenu={setAdminWeeklyItems}
          students={adminStudentItems}
          weeklyMenu={adminWeeklyItems}
        />
      )}
    </DashboardLayout>
  )
}

export default App
