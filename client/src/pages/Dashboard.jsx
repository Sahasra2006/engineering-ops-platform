import { useEffect, useMemo, useState } from 'react'
import { dashboardApi } from '../api/dashboard'
import { tasksApi, bugsApi, incidentsApi, teamsApi, usersApi } from '../api/resources'
import { FolderKanban, CheckSquare, Bug, Siren, Activity, BarChart3, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/rbac'
import { StatusBadge } from '../components/StatusBadge'

function MiniBar({ data }) {
  // simple bar chart for small datasets
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-24 truncate text-xs text-slate-600">{d.label}</div>
          <div className="h-2 flex-1 rounded bg-slate-100">
            <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.round((d.value / max) * 100)}%` }} />
          </div>
          <div className="w-10 text-right text-xs font-medium text-slate-700">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [productivity, setProductivity] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [teamContext, setTeamContext] = useState({ name: '', members: [] })
  const [managerStats, setManagerStats] = useState({ teamTasks: 0, teamBugs: 0, teamIncidents: 0, activeProjects: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [o, p, tasksRes, bugsRes, incidentsRes] = await Promise.all([
          dashboardApi.overview(),
          dashboardApi.productivity(),
          tasksApi.list(),
          bugsApi.list(),
          incidentsApi.list(),
        ])
        if (!alive) return
        setOverview(o.data)
        setProductivity(p.data)

        let tasksRows = tasksRes.data || []
        let bugsRows = bugsRes.data || []
        let incidentsRows = incidentsRes.data || []

        if (user?.role === ROLES.DEVELOPER) {
          tasksRows = tasksRows.filter((t) => t.assigned_to === user.id)
          bugsRows = bugsRows.filter((b) => b.assigned_to === user.id)
          incidentsRows = incidentsRows.filter((i) => i.created_by === user.id)
        } else if (user?.role === ROLES.QA) {
          tasksRows = tasksRows.filter((t) => t.assigned_to === user.id)
          bugsRows = bugsRows.filter((b) => b.assigned_to === user.id || b.reported_by === user.id)
          incidentsRows = incidentsRows.filter((i) => i.created_by === user.id)
        }
        if (user?.role === ROLES.MANAGER) {
          try {
            const meRes = await usersApi.getById(user.id)
            const me = meRes?.data || user
            if (me?.team_id) {
              const [teamRes, membersRes] = await Promise.all([teamsApi.getById(me.team_id), teamsApi.members(me.team_id)])
              const members = membersRes?.data || []
              const memberIds = members.map((m) => m.id)
              tasksRows = tasksRows.filter((t) => memberIds.includes(t.assigned_to))
              bugsRows = bugsRows.filter((b) => memberIds.includes(b.assigned_to) || memberIds.includes(b.reported_by))
              incidentsRows = incidentsRows.filter((i) => memberIds.includes(i.created_by))
              setTeamContext({ name: teamRes?.data?.name || 'My Team', members })
              setManagerStats({
                teamTasks: tasksRows.filter((t) => memberIds.includes(t.assigned_to)).length,
                teamBugs: bugsRows.filter((b) => memberIds.includes(b.assigned_to) || memberIds.includes(b.reported_by)).length,
                teamIncidents: incidentsRows.filter((i) => memberIds.includes(i.created_by)).length,
                activeProjects: (o?.data?.totals?.active_projects || o?.data?.totals?.projects || 0),
              })
            } else {
              setTeamContext({ name: '', members: [] })
            }
          } catch {
            setTeamContext({ name: '', members: [] })
          }
        }

        const tasks = tasksRows.slice(0, 4).map((t) => ({
          id: `task-${t.id}`,
          type: 'Task',
          title: t.title,
          status: t.status || 'TODO',
          ts: t.created_at,
        }))
        const bugs = bugsRows.slice(0, 3).map((b) => ({
          id: `bug-${b.id}`,
          type: 'Bug',
          title: b.title,
          status: b.status || 'OPEN',
          ts: b.created_at,
        }))
        const incidents = incidentsRows.slice(0, 3).map((i) => ({
          id: `incident-${i.id}`,
          type: 'Incident',
          title: i.title,
          status: i.status || 'OPEN',
          ts: i.created_at,
        }))
        setRecentActivity([...tasks, ...bugs, ...incidents].slice(0, 8))
      } catch (err) {
        if (!alive) return
        setError(err?.response?.data?.message || 'Failed to load dashboard')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.id, user?.role])

  const cards = useMemo(() => {
    const totals = overview?.totals || {}
    const personalTasks = recentActivity.filter((a) => a.type === 'Task').length
    const personalBugs = recentActivity.filter((a) => a.type === 'Bug').length
    const personalIncidents = recentActivity.filter((a) => a.type === 'Incident').length
    if (user?.role === ROLES.DEVELOPER || user?.role === ROLES.QA) {
      return [
        { title: 'My tasks', value: personalTasks, icon: CheckSquare },
        { title: 'My bugs', value: personalBugs, icon: Bug },
        { title: 'My incidents', value: personalIncidents, icon: Siren },
        { title: 'Recent activity', value: recentActivity.length, icon: Activity },
      ]
    }
    if (user?.role === ROLES.MANAGER) {
      return [
        { title: 'Team tasks', value: managerStats.teamTasks, icon: CheckSquare },
        { title: 'Team bugs', value: managerStats.teamBugs, icon: Bug },
        { title: 'Team incidents', value: managerStats.teamIncidents, icon: Siren },
        { title: 'Active projects', value: managerStats.activeProjects, icon: FolderKanban },
      ]
    }
    return [
      { title: 'Total projects', value: totals.projects ?? '—', icon: FolderKanban },
      { title: 'Total tasks', value: totals.tasks ?? '—', icon: CheckSquare },
      { title: 'Open bugs', value: productivity?.bugs?.cards?.find((c) => c.key === 'open')?.value ?? '—', icon: Bug },
      { title: 'Active incidents', value: productivity?.incidents?.cards?.find((c) => c.key === 'active')?.value ?? '—', icon: Siren },
    ]
  }, [overview, productivity, recentActivity, user?.role, managerStats])

  const tasksByPriority = productivity?.tasks?.charts?.by_priority || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Activity size={20} className="text-blue-600" />
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">{user?.role === ROLES.ADMIN ? 'Company overview and analytics.' : user?.role === ROLES.MANAGER ? 'Team and project health overview.' : 'Personal work overview.'}</p>
      </div>

      {error ? <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-600">{c.title}</div>
              <c.icon size={16} className="text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{loading ? 'Loading…' : c.value}</div>
          </div>
        ))}
      </div>

      {user?.role === ROLES.MANAGER ? (
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users size={16} className="text-blue-600" />
              Team snapshot
            </div>
            <div className="mt-2 text-sm text-slate-600">{teamContext.name ? `Managing ${teamContext.name}` : 'No team assigned yet.'}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Members: <span className="font-semibold text-slate-900">{teamContext.members.length}</span></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Team tasks: <span className="font-semibold text-slate-900">{managerStats.teamTasks}</span></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Team bugs: <span className="font-semibold text-slate-900">{managerStats.teamBugs}</span></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">Incidents: <span className="font-semibold text-slate-900">{managerStats.teamIncidents}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Team members</div>
            <div className="mt-3 space-y-2">
              {teamContext.members.length ? (
                teamContext.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm text-slate-900">{m.full_name}</div>
                    <span className="text-xs text-slate-500">{m.role}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No members found.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Manager highlights</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Active projects: <span className="font-semibold text-slate-900">{managerStats.activeProjects}</span></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Team workload: <span className="font-semibold text-slate-900">{managerStats.teamTasks + managerStats.teamBugs + managerStats.teamIncidents}</span></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Open workstreams: <span className="font-semibold text-slate-900">{managerStats.teamTasks + managerStats.teamBugs}</span></div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BarChart3 size={16} className="text-blue-600" />
            Tasks by priority
          </div>
          <div className="mt-3">{tasksByPriority.length ? <MiniBar data={tasksByPriority} /> : <div className="text-sm text-slate-500">No data</div>}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Quick stats</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(productivity?.tasks?.cards || []).map((c) => (
              <div key={c.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-600">{c.label}</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{c.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Recent activity</div>
          <div className="mt-3 space-y-2">
            {recentActivity.length ? (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.type}</div>
                  </div>
                  <div className="ml-2 text-right">
                    <StatusBadge value={a.status} />
                    <div className="mt-1 text-[10px] text-slate-400">{new Date(a.ts || Date.now()).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

