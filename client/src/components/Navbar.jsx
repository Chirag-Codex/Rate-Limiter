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
    <header className="bg-[#0B0E14] border-b border-[#1C2230] sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/projects" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-teal-400/10 border border-teal-400/30 flex items-center justify-center text-teal-400 group-hover:border-teal-400/60 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-slate-100 tracking-tight">
              Rate<span className="text-teal-300">Guard</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-[13px] font-medium px-3.5 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-400/10 text-teal-300 border border-teal-400/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#141A24]'
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
          
          {/* Active Tier Pill */}
          <Link
            to="/pricing"
            title="Click to view subscription plans"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all border group"
            style={{
              backgroundColor: isPro ? 'rgba(168, 85, 247, 0.1)' : isGold ? 'rgba(251, 191, 36, 0.1)' : 'rgba(30, 41, 59, 0.6)',
              borderColor: isPro ? 'rgba(168, 85, 247, 0.3)' : isGold ? 'rgba(251, 191, 36, 0.3)' : 'rgba(51, 65, 85, 0.6)',
              color: isPro ? '#c084fc' : isGold ? '#fbbf24' : '#94a3b8'
            }}
          >
            <span>{isPro ? '👑' : isGold ? '⭐' : '🛡️'}</span>
            <span>{currentPlan} PLAN</span>
          </Link>

          {/* Prominent High-Converting Upgrade / Buy Button */}
          {!isPro && (
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-slate-950 bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400 hover:from-teal-200 hover:to-emerald-300 shadow-sm shadow-teal-500/20 hover:shadow-teal-500/30 transition-all transform active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{isGold ? 'Upgrade to Pro' : 'Upgrade Plan'}</span>
            </Link>
          )}

          {/* User Email & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#1C2230]">
            {(user?.name || user?.email) && (
              <span className="text-[12px] text-slate-400 font-medium hidden md:inline max-w-[140px] truncate" title={user.email}>
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              title="Log out of your account"
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#1C2230] text-slate-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-all"
            >
              Log out
            </button>
          </div>

        </div>

      </div>
    </header>
  )
}
