import { useEffect, useMemo, useState } from 'react'
import { UserCircle2, CheckSquare, Bug, Siren, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usersApi, teamsApi, tasksApi, bugsApi, incidentsApi } from '../api/resources'

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{title}</div>
        <Icon size={16} className="text-blue-600" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(user || null)
  const [teamName, setTeamName] = useState('Unassigned')
  const [teamMemberCount, setTeamMemberCount] = useState(0)
  const [stats, setStats] = useState({ completedTasks: 0, pendingTasks: 0, assignedBugs: 0, assignedIncidents: 0, criticalIncidents: 0 })

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user?.id) return
      try {
        const [meRes, teamsRes, tasksRes, bugsRes, incidentsRes] = await Promise.all([
          usersApi.getById(user.id),
          teamsApi.list(),
          tasksApi.list(),
          bugsApi.list(),
          incidentsApi.list(),
        ])
        if (!alive) return
        const me = meRes?.data || user
        setProfile(me)
        const teams = teamsRes?.data || []
        const myTeam = teams.find((t) => t.id === me.team_id)
        setTeamName(myTeam?.name || 'Unassigned')
        if (me.team_id) {
          try {
            const membersRes = await teamsApi.members(me.team_id)
            setTeamMemberCount((membersRes?.data || []).length)
          } catch {
            setTeamMemberCount(0)
          }
        } else {
          setTeamMemberCount(0)
        }

        const tasks = (tasksRes?.data || []).filter((t) => t.assigned_to === me.id)
        const bugs = (bugsRes?.data || []).filter((b) => b.assigned_to === me.id)
        const incidents = (incidentsRes?.data || []).filter((i) => i.created_by === me.id)
        setStats({
          completedTasks: tasks.filter((t) => t.status === 'DONE').length,
          pendingTasks: tasks.filter((t) => t.status !== 'DONE').length,
          assignedBugs: bugs.length,
          assignedIncidents: incidents.length,
          criticalIncidents: incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length,
        })
      } catch {
        // keep fallback user values
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.id])

  const info = useMemo(
    () => [
      { label: 'Full name', value: profile?.full_name || '-' },
      { label: 'Role', value: profile?.role || '-' },
      { label: 'Team', value: teamName },
      { label: 'Availability', value: profile?.availability || '-' },
    ],
    [profile, teamName]
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <UserCircle2 size={20} className="text-blue-600" />
          My Profile
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-slate-600">Personal details and work snapshot.</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Users size={12} />
            {teamName} {teamName !== 'Unassigned' ? `• ${teamMemberCount} members` : ''}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {info.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="text-sm font-medium text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Completed Tasks" value={stats.completedTasks} icon={CheckSquare} />
        <StatCard title="My Pending Tasks" value={stats.pendingTasks} icon={CheckSquare} />
        <StatCard title="My Team" value={teamName} icon={Users} />
        <StatCard title="Critical Incidents" value={stats.criticalIncidents} icon={Siren} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Assigned Bugs" value={stats.assignedBugs} icon={Bug} />
        <StatCard title="Assigned Incidents" value={stats.assignedIncidents} icon={Siren} />
      </div>
    </div>
  )
}

