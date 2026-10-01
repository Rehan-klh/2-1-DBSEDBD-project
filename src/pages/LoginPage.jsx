import { useState } from 'react'

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('student')

  const handleSubmit = (event) => {
    event.preventDefault()
    onLogin(role)
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
          <p>Use any demo credentials for tomorrow's frontend review.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Username or email
            <input placeholder="student@klh.edu.in" type="text" />
          </label>

          <label>
            Password
            <input placeholder="Enter password" type="password" />
          </label>

          <div className="role-selector" role="group" aria-label="Select role">
            <button
              className={role === 'student' ? 'selected' : ''}
              onClick={() => setRole('student')}
              type="button"
            >
              Student
            </button>
            <button
              className={role === 'admin' ? 'selected' : ''}
              onClick={() => setRole('admin')}
              type="button"
            >
              Admin
            </button>
          </div>

          <button className="primary-button" type="submit">
            Login to {role === 'student' ? 'Student Portal' : 'Admin Console'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
