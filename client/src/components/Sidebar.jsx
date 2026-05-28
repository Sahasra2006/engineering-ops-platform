import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Bug,
  Siren,
  UserCircle2,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'
import { canViewProjects, canViewTeams } from '../utils/rbac'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/incidents', label: 'Incidents', icon: Siren },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

export function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const visibleNav = nav.filter((item) => {
    if (item.to === '/teams') return canViewTeams(user)
    if (item.to === '/projects') return canViewProjects(user)
    return true
  })

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={onClose} /> : null}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onClose}>
            ✕
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
              onClick={onClose}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

