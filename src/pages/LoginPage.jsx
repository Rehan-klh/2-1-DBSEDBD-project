import { useState } from 'react'
import { api } from '../api/client'

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('student@klh.edu.in')
  const [password, setPassword] = useState('Student@123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setError('')
    if (newRole === 'admin') {
      setEmail('admin@klh.edu.in')
      setPassword('Admin@123')
    } else {
      setEmail('student@klh.edu.in')
      setPassword('Student@123')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.auth.login(email.trim(), password, role)
      onLogin(data.role.toLowerCase(), data)
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Hostel portal introduction">
        <div className="brand-row">
          <div className="brand-mark">HM</div>
          <span>KLH Residential Services</span>
        </div>
        <div className="campus-illustration" aria-hidden="true">
          <div className="campus-sun" />
          <div className="campus-tower">
            <span />
            <span />
            <span />
          </div>
          <div className="campus-building building-left">
            <span />
            <span />
            <span />
          </div>
          <div className="campus-building building-right">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="campus-path" />
        </div>
        <div className="login-copy">
          <span className="eyebrow">Hostel & Mess Management System</span>
          <h1>Your campus, organized.</h1>
          <p>
            Rooms, meals, leave approvals, fees and hostel support in one calm residential
            services workspace.
          </p>
        </div>
        <div className="login-highlights">
          <span>Room allocation</span>
          <span>Mess schedules</span>
          <span>Complaints</span>
          <span>Leave approvals</span>
        </div>
      </section>

      <section className="login-card" aria-label="Login form">
        <div>
          <span className="eyebrow">Secure portal</span>
          <h2>Hostel & Mess Management System</h2>
          <p>Sign in with your university account credentials.</p>
        </div>

        {error && <div className="form-message error" style={{ margin: '1rem 0' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Username or email
            <input
              placeholder="student@klh.edu.in"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="role-selector" role="group" aria-label="Select role">
            <button
              className={role === 'student' ? 'selected' : ''}
              onClick={() => handleRoleChange('student')}
              type="button"
            >
              Student
            </button>
            <button
              className={role === 'admin' ? 'selected' : ''}
              onClick={() => handleRoleChange('admin')}
              type="button"
            >
              Admin
            </button>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : `Login to ${role === 'student' ? 'Student Portal' : 'Admin Console'}`}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
