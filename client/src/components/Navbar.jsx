import { useEffect, useState } from 'react'
import { Button } from './Button'
import { useAuth } from '../context/AuthContext'
import { NotificationBell } from './NotificationBell'
import { teamsApi, usersApi } from '../api/resources'

export function Navbar({ onMenu }) {
  const { user, logout } = useAuth()
  const [teamName, setTeamName] = useState('')
  const [teammates, setTeammates] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user?.id) return
      try {
        const meRes = await usersApi.getById(user.id)
        const me = meRes?.data || user
        if (!me?.team_id) {
          if (alive) {
            setTeamName('')
            setTeammates([])
          }
          return
        }
        const [teamRes, membersRes] = await Promise.all([teamsApi.getById(me.team_id), teamsApi.members(me.team_id)])
        if (!alive) return
        setTeamName(teamRes?.data?.name || '')
        const members = membersRes?.data || []
        setTeammates(members.filter((m) => m.id !== me.id).slice(0, 3))
      } catch {
        if (alive) {
          setTeamName('')
          setTeammates([])
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.id, user?.team_id])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={onMenu}>
            ☰
          </button>
          <div>
            <div className="text-sm font-semibold text-slate-900">Engineering Operations</div>
            <div className="text-xs text-slate-500">
              {teamName ? `Team: ${teamName}` : 'Internal platform'}
              {teammates.length ? ` • Teammates: ${teammates.map((m) => m.full_name).join(', ')}` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</div>
            <div className="text-xs text-slate-500">{user?.role || ''}</div>
          </div>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

