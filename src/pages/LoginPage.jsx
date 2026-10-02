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
      {/* ── Left visual panel ── */}
      <section className="login-visual" aria-label="Hostel portal introduction">
        <div className="brand-row">
          <div className="brand-mark">HM</div>
          <span>KLH Residential Services</span>
        </div>

        <div className="campus-illustration" aria-hidden="true">
          <div className="campus-sun" />
          <div className="campus-tower">
            <span /><span /><span />
          </div>
          <div className="campus-building building-left">
            <span /><span /><span />
          </div>
          <div className="campus-building building-right">
            <span /><span /><span /><span />
          </div>
          <div className="campus-path" />
        </div>

        <div className="login-copy">
          <span className="eyebrow">Hostel &amp; Mess Management System</span>
          <h1>Your campus,<br />organized.</h1>
          <p>
            Rooms, meals, leave approvals, fees and hostel support —
            all in one calm residential services workspace.
          </p>
        </div>

        <div className="login-highlights">
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'0 auto 5px'}} aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Room allocation
          </span>
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'0 auto 5px'}} aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            Mess schedules
          </span>
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'0 auto 5px'}} aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Complaints
          </span>
          <span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'0 auto 5px'}} aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Leave approvals
          </span>
        </div>
      </section>

      {/* ── Right login card ── */}
      <section className="login-card" aria-label="Login form">
        <div className="brand-mark" aria-hidden="true">HM</div>

        <div>
          <span className="eyebrow">Secure portal</span>
          <h2>Sign in to your account</h2>
          <p>Use your KLH university credentials to continue.</p>
        </div>

        {error && (
          <div className="form-message error" role="alert" style={{ marginTop: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'6px',verticalAlign:'middle'}} aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            <span style={{display:'flex',alignItems:'center',gap:'5px'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email address
            </span>
            <input
              placeholder="you@klh.edu.in"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span style={{display:'flex',alignItems:'center',gap:'5px'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password
            </span>
            <input
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <div>
            <label style={{marginBottom:'6px'}}>
              <span style={{display:'flex',alignItems:'center',gap:'5px'}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Sign in as
              </span>
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
          </div>

          <button className="primary-button" type="submit" disabled={loading} style={{marginTop:'4px'}}>
            {loading ? (
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:'spin 0.8s linear infinite'}} aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Authenticating…
              </span>
            ) : (
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {`Sign in to ${role === 'student' ? 'Student Portal' : 'Admin Console'}`}
              </span>
            )}
          </button>
        </form>

        <p style={{marginTop:'20px',fontSize:'0.78rem',color:'var(--color-text-muted)',textAlign:'center'}}>
          Demo credentials are pre-filled. Just click sign in.
        </p>
      </section>

      {/* Spinner keyframe injected inline to avoid extra CSS file */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}

export default LoginPage
