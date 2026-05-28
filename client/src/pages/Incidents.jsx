import { useEffect, useState } from 'react'
import { incidentsApi, usersApi, teamsApi } from '../api/resources'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Siren, Pencil, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canManageIncidents, ROLES } from '../utils/rbac'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { AlertBanner } from '../components/AlertBanner'
import { getErrorMessage } from '../utils/error'

export function IncidentsPage() {
  const { user } = useAuth()
  const canManage = canManageIncidents(user)
  const [items, setItems] = useState([])
  const [teamMemberIds, setTeamMemberIds] = useState([])
  const [users, setUsers] = useState([])
  const [userDirectory, setUserDirectory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', status: 'OPEN', assigned_user_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', severity: 'MEDIUM', status: 'OPEN', assigned_user_id: '' })
  const assignableRoles = [ROLES.DEVELOPER, ROLES.QA, ROLES.MANAGER]

  const fallbackUsers = [
    { id: 1, full_name: 'Sahasra', role: 'DEVELOPER' },
    { id: 2, full_name: 'Priya', role: 'DEVELOPER' },
    { id: 3, full_name: 'Sneha', role: 'QA' },
    { id: 4, full_name: 'Manager', role: 'MANAGER' },
  ]

  const canEditIncident = (incident) => {
    if (!user) return false
    if (canManage) return true
    if (user.role === ROLES.DEVELOPER) return incident.created_by === user.id
    if (user.role === ROLES.QA) return incident.created_by === user.id
    return false
  }

  const userLabel = (userId) => {
    if (!userId) return '—'
    if (userDirectory[userId]) return `${userDirectory[userId].full_name} (${roleLabel(userDirectory[userId].role)})`
    const hit = users.find((u) => u.id === userId)
    return hit ? `${hit.full_name} • ${roleLabel(hit.role)}` : `User #${userId}`
  }
  const roleLabel = (role = '') => {
    const lower = String(role).toLowerCase()
    return lower ? `${lower[0].toUpperCase()}${lower.slice(1)}` : 'User'
  }
  const assignableUsers = users.filter((u) => assignableRoles.includes(u.role))
  const filteredItems = items.filter((i) => {
    const byQuery = !query || String(i.title || '').toLowerCase().includes(query.toLowerCase())
    const byStatus = statusFilter === 'ALL' || i.status === statusFilter
    const bySeverity = severityFilter === 'ALL' || i.severity === severityFilter
    return byQuery && byStatus && bySeverity
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await incidentsApi.list()
      let rows = res.data || []
      if (user?.role === ROLES.DEVELOPER) {
        rows = rows.filter((i) => i.created_by === user.id)
      } else if (user?.role === ROLES.QA) {
        rows = rows.filter((i) => i.created_by === user.id)
      } else if (user?.role === ROLES.MANAGER) {
        rows = rows.filter((i) => teamMemberIds.includes(i.created_by))
      }
      setItems(rows)
      const ids = [...new Set(rows.map((i) => i.created_by).filter(Boolean))]
      if (ids.length) {
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await usersApi.getById(id)
              return [id, res?.data]
            } catch {
              return [id, null]
            }
          })
        )
        setUserDirectory((prev) => ({ ...prev, ...Object.fromEntries(entries.filter(([, v]) => v)) }))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (!user?.id) return
      if (user.role === ROLES.MANAGER) {
        try {
          const me = await usersApi.getById(user.id)
          const teamId = me?.data?.team_id
          if (teamId) {
            const members = await teamsApi.members(teamId)
            setTeamMemberIds((members?.data || []).map((m) => m.id))
          } else setTeamMemberIds([])
        } catch {
          setTeamMemberIds([])
        }
      }
      if (canManage) {
        usersApi
          .list({ page: 1, limit: 50 })
          .then((res) => setUsers(res?.data?.items || fallbackUsers))
          .catch(() => setUsers(fallbackUsers))
      } else {
        setUsers(fallbackUsers)
      }
      await load()
    })()
  }, [canManage, user?.id, user?.role, teamMemberIds.length])

  const create = async (e) => {
    e.preventDefault()
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      await incidentsApi.create({
        ...form,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : undefined,
      })
      setForm({ title: '', description: '', severity: 'MEDIUM', status: 'OPEN', assigned_user_id: '' })
      setSuccess('Incident created successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEdit = (incident) => {
    setEditingId(incident.id)
    setEditForm({
      title: incident.title || '',
      description: incident.description || '',
      severity: incident.severity || 'MEDIUM',
      status: incident.status || 'OPEN',
      assigned_user_id: incident.created_by || '',
    })
    setError('')
    setSuccess('')
  }

  const saveEdit = async (id) => {
    const current = items.find((i) => i.id === id)
    if (!current || !canEditIncident(current)) return
    setError('')
    setSuccess('')
    try {
      await incidentsApi.update(id, {
        ...editForm,
        assigned_user_id: editForm.assigned_user_id ? Number(editForm.assigned_user_id) : null,
      })
      setEditingId(null)
      setSuccess('Incident updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const removeIncident = async (id) => {
    if (!canManage) return
    if (!window.confirm('Delete this incident?')) return
    setError('')
    setSuccess('')
    try {
      await incidentsApi.remove(id)
      setSuccess('Incident deleted successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Siren size={20} className="text-blue-600" />
          {user?.role === ROLES.DEVELOPER ? 'Assigned Incidents' : user?.role === ROLES.QA ? 'Testing Incidents' : 'Incidents'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Track operational incidents.</p>
      </div>

      <AlertBanner type="error" message={error} onClose={setError} />
      <AlertBanner type="success" message={success} onClose={setSuccess} />

      {canManage ? (
      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <Input label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Severity</div>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={form.severity}
            onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="IDENTIFIED">IDENTIFIED</option>
            <option value="MONITORING">MONITORING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Assigned User</div>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={form.assigned_user_id}
            onChange={(e) => setForm((s) => ({ ...s, assigned_user_id: e.target.value }))}
          >
            <option value="">Select user</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} • {roleLabel(u.role)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button className="w-full" type="submit">
            Create
          </Button>
        </div>
      </form>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Search</div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
            <input className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm" placeholder="Search by title" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="IDENTIFIED">IDENTIFIED</option>
            <option value="MONITORING">MONITORING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Severity</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">All incidents</div>
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading…</div>
          ) : filteredItems.length ? (
            filteredItems.map((i) => (
              <div key={i.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {editingId === i.id && canEditIncident(i) ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} />
                      <Input value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
                      <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={editForm.severity} onChange={(e) => setEditForm((s) => ({ ...s, severity: e.target.value }))}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={editForm.status} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}>
                        <option value="OPEN">OPEN</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="IDENTIFIED">IDENTIFIED</option>
                        <option value="MONITORING">MONITORING</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      {canManage ? (
                        <select
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={editForm.assigned_user_id}
                          onChange={(e) => setEditForm((s) => ({ ...s, assigned_user_id: e.target.value }))}
                        >
                          <option value="">Select user</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name} • {roleLabel(u.role)}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-900">{i.title}</div>
                      <div className="text-xs text-slate-500">{i.description || '—'}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">Status: <StatusBadge value={i.status} /></span>
                        <span className="flex items-center gap-1">Severity: <StatusBadge value={i.severity} /></span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Assigned: {userLabel(i.created_by)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Created: {String(i.created_at || '').slice(0, 10) || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs text-slate-500">#{i.id}</div>
                  {editingId === i.id && canEditIncident(i) ? (
                    <>
                      <Button className="px-2 py-1 text-xs" onClick={() => saveEdit(i.id)}>
                        Save
                      </Button>
                      <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : canEditIncident(i) || canManage ? (
                    <>
                      {canEditIncident(i) ? (
                        <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => startEdit(i)}>
                          <Pencil size={14} />
                        </button>
                      ) : null}
                      {canManage ? (
                        <button className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeIncident(i.id)}>
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Siren} title={user?.role === ROLES.ADMIN ? 'No incidents found' : 'No incidents assigned'} description="Try changing filters or check back later." />
          )}
        </div>
      </div>
    </div>
  )
}

