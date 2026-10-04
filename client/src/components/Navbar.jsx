import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/projects', label: 'Projects' },
  { to: '/test', label: 'Test endpoint' },
  { to: '/pricing', label: 'Pricing' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const currentPlan = user?.plan || 'FREE'
  const isPro = currentPlan === 'PRO'
  const isGold = currentPlan === 'GOLD'

  return (
    <header className="bg-base/95 border-b border-border-subtle sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/projects" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-sm bg-chip border border-border-subtle flex items-center justify-center text-accent-teal group-hover:border-accent-teal/50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-primary tracking-tight">
              Rate<span className="text-accent-teal">Guard</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs font-medium px-3 py-1.5 rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal ${
                    isActive
                      ? 'bg-chip text-primary border border-border-subtle'
                      : 'text-secondary hover:text-primary hover:bg-chip/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Section: Plan Badge + Upgrade CTA + Profile */}
        <div className="flex items-center gap-3">
          
          {/* Active Tier Chip */}
          <Link
            to="/pricing"
            title="Click to view subscription plans"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium tracking-wide transition-all border border-border-subtle bg-chip text-secondary hover:text-primary group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
          >
            <span>{isPro ? '👑' : isGold ? '⭐' : '🛡️'}</span>
            <span>{currentPlan} PLAN</span>
          </Link>

          {/* Prominent Small Light Upgrade Button */}
          {!isPro && (
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-btn-light-text bg-btn-light-bg hover:bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{isGold ? 'Upgrade to Pro' : 'Upgrade Plan'}</span>
            </Link>
          )}

          {/* User Email & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
            {(user?.name || user?.email) && (
              <span className="text-xs text-muted font-medium hidden md:inline max-w-[140px] truncate" title={user.email}>
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              title="Log out of your account"
              className="text-xs font-medium px-3 py-1.5 rounded-sm border border-border-subtle text-secondary hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              Log out
            </button>
          </div>

        </div>

      </div>
    </header>
  )
}