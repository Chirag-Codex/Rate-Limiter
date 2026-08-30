import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/projects', label: 'Projects' },
  { to: '/test', label: 'Test endpoint' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-[#0B0E14] border-b border-[#1C2230] sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <span className="text-[14px] font-semibold text-slate-100 tracking-tight">
            Rate<span className="text-teal-300">Guard</span>
          </span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-teal-300/10 text-teal-300' : 'text-slate-500 hover:text-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {(user?.name || user?.email) && (
            <span className="text-[12px] text-slate-500 hidden sm:inline">{user.name || user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#1C2230] text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}