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
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {isMenuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>

        <nav className={isMenuOpen ? 'top-nav open' : 'top-nav'} aria-label={`${role} navigation`}>
          <div className="nav-cluster">
            {primaryItems.map((item) => (
              <button
                className={activeView === item.id ? 'nav-link active' : 'nav-link'}
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                type="button"
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
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
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="nav-actions">
          <span className="role-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {role === 'admin' ? 'Admin' : 'Student'}
          </span>
          <button className="logout-button" onClick={onLogout} type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'5px',verticalAlign:'middle'}} aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'5px',verticalAlign:'middle'}} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Support
            </button>
            <button onClick={() => showNotice('Review mode is active.')} type="button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'5px',verticalAlign:'middle'}} aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Review Mode
            </button>
          </div>
        </header>
        {notice ? <div className="toast-message" role="status">{notice}</div> : null}
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
