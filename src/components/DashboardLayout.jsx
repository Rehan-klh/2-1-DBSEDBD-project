import { useState } from 'react'

function DashboardLayout({ activeView, children, navItems, onLogout, onNavigate, role, title }) {
  const primaryItems = navItems.slice(0, 3)
  const serviceItems = navItems.slice(3)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const handleNavigate = (view) => {
    onNavigate(view)
    setIsMenuOpen(false)
  }

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="app-shell">
      <header className="campus-nav">
        <div className="brand-block">
          <div className="brand-mark">HM</div>
          <div>
            <strong>Campus Desk</strong>
            <span>{title}</span>
          </div>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          Menu
        </button>

        <nav className={isMenuOpen ? 'top-nav open' : 'top-nav'} aria-label={`${role} navigation`}>
          <div className="nav-cluster">
            {primaryItems.map((item) => (
              <button
                className={activeView === item.id ? 'nav-link active' : 'nav-link'}
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                type="button"
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="nav-cluster service-cluster">
            {serviceItems.map((item) => (
              <button
                className={activeView === item.id ? 'nav-link active' : 'nav-link'}
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                type="button"
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="nav-actions">
          <span className="role-pill">{role === 'admin' ? 'Admin' : 'Student'}</span>
          <button className="logout-button" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <span>KLH University Residential Services</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <button onClick={() => showNotice('Support desk notified for this prototype.')} type="button">
              Support
            </button>
            <button onClick={() => showNotice('Review mode is active.')} type="button">
              Review Mode
            </button>
          </div>
        </header>
        {notice ? <div className="toast-message">{notice}</div> : null}
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
