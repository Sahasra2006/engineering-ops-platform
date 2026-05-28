import { useEffect, useState } from 'react'
import { bugsApi, usersApi, teamsApi } from '../api/resources'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Bug, Pencil, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canManageBugs, ROLES } from '../utils/rbac'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { AlertBanner } from '../components/AlertBanner'
import { getErrorMessage } from '../utils/error'

export function BugsPage() {
  const { user } = useAuth()
  const canManage = canManageBugs(user)
  const canCreate = canManage || user?.role === ROLES.QA
  const [teamMemberIds, setTeamMemberIds] = useState([])

  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [userDirectory, setUserDirectory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [form, setForm] = useState({ title: '', description: '', severity: 'LOW', status: 'OPEN', assigned_to: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', severity: 'LOW', status: 'OPEN', assigned_to: '' })
  const canEditBug = (bug) => {
    if (!user) return false
    if (canManage) return true
    if (user.role === ROLES.QA) return bug.reported_by === user.id
    if (user.role === ROLES.DEVELOPER) return bug.assigned_to === user.id
    return false
  }
  const canDeleteBug = (bug) => {
    if (!user) return false
    if (canManage) return true
    if (user.role === ROLES.QA) return bug.reported_by === user.id
    return false
  }

  const assignableRoles = [ROLES.DEVELOPER, ROLES.QA, ROLES.MANAGER]
  const roleLabel = (role = '') => {
    const lower = String(role).toLowerCase()
    return lower ? `${lower[0].toUpperCase()}${lower.slice(1)}` : 'User'
  }
  const assignableUsers = users.filter((u) => assignableRoles.includes(u.role))
  const assigneeLabel = (userId) => {
    if (!userId) return '—'
    if (userDirectory[userId]) return `${userDirectory[userId].full_name} (${roleLabel(userDirectory[userId].role)})`
    const hit = users.find((u) => u.id === userId)
    return hit ? `${hit.full_name} • ${roleLabel(hit.role)}` : `User #${userId}`
  }
  const filteredItems = items.filter((b) => {
    const byQuery = !query || String(b.title || '').toLowerCase().includes(query.toLowerCase())
    const byStatus = statusFilter === 'ALL' || b.status === statusFilter
    const bySeverity = severityFilter === 'ALL' || b.severity === severityFilter
    return byQuery && byStatus && bySeverity
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await bugsApi.list()
      let rows = res.data || []
      if (user?.role === ROLES.DEVELOPER) {
        rows = rows.filter((b) => b.assigned_to === user.id)
      } else if (user?.role === ROLES.QA) {
        rows = rows.filter((b) => b.assigned_to === user.id || b.reported_by === user.id)
      } else if (user?.role === ROLES.MANAGER) {
        rows = rows.filter((b) => teamMemberIds.includes(b.assigned_to) || teamMemberIds.includes(b.reported_by))
      }
      setItems(rows)
      const ids = [...new Set(rows.flatMap((b) => [b.assigned_to, b.reported_by]).filter(Boolean))]
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
      if (canManage || user?.role === ROLES.QA) {
        usersApi
          .list({ page: 1, limit: 100 })
          .then((res) => setUsers(res?.data?.items || []))
          .catch(() => setUsers([]))
      } else {
        setUsers([])
      }
      await load()
    })()
  }, [user?.id, user?.role, teamMemberIds.length])

  const create = async (e) => {
    e.preventDefault()
    if (!canCreate) return
    setError('')
    setSuccess('')
    try {
      await bugsApi.create({
        ...form,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
      })
      setForm({ title: '', description: '', severity: 'LOW', status: 'OPEN', assigned_to: '' })
      setSuccess('Bug reported successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEdit = (bug) => {
    setEditingId(bug.id)
    setEditForm({
      title: bug.title || '',
      description: bug.description || '',
      severity: bug.severity || 'LOW',
      status: bug.status || 'OPEN',
      assigned_to: bug.assigned_to || '',
    })
    setError('')
    setSuccess('')
  }

  const saveEdit = async (id) => {
    const current = items.find((b) => b.id === id)
    if (!current || !canEditBug(current)) return
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...editForm,
      }
      if (canManage || user?.role === ROLES.QA) {
        payload.assigned_to = editForm.assigned_to ? Number(editForm.assigned_to) : null
      }
      await bugsApi.update(id, payload)
      setEditingId(null)
      setSuccess('Bug updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const removeBug = async (id) => {
    const current = items.find((b) => b.id === id)
    if (!current || !canDeleteBug(current)) return
    if (!window.confirm('Delete this bug?')) return
    setError('')
    setSuccess('')
    try {
      await bugsApi.remove(id)
      setSuccess('Bug deleted successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Bug size={20} className="text-blue-600" />
          {user?.role === ROLES.DEVELOPER ? 'Assigned Bugs' : user?.role === ROLES.QA ? 'Reported / Assigned Bugs' : 'Bugs'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Report and track bugs.</p>
      </div>

      <AlertBanner type="error" message={error} onClose={setError} />
      <AlertBanner type="success" message={success} onClose={setSuccess} />

      {canCreate ? (
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
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REOPENED">REOPENED</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Assigned User</div>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={form.assigned_to}
            onChange={(e) => setForm((s) => ({ ...s, assigned_to: e.target.value }))}
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
            Report
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
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REOPENED">REOPENED</option>
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
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">All bugs</div>
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading…</div>
          ) : filteredItems.length ? (
            filteredItems.map((b) => (
              <div key={b.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {editingId === b.id && canEditBug(b) ? (
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
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="REOPENED">REOPENED</option>
                      </select>
                      {canManage || user?.role === ROLES.QA ? (
                        <select
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={editForm.assigned_to}
                          onChange={(e) => setEditForm((s) => ({ ...s, assigned_to: e.target.value }))}
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
                      <div className="text-sm font-medium text-slate-900">{b.title}</div>
                      <div className="text-xs text-slate-500">{b.description || '—'}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">Status: <StatusBadge value={b.status} /></span>
                        <span className="flex items-center gap-1">Severity: <StatusBadge value={b.severity} /></span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Assigned: {assigneeLabel(b.assigned_to)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Reported by: {assigneeLabel(b.reported_by)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Created: {String(b.created_at || '').slice(0, 10) || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs text-slate-500">#{b.id}</div>
                  {editingId === b.id && canEditBug(b) ? (
                    <>
                      <Button className="px-2 py-1 text-xs" onClick={() => saveEdit(b.id)}>
                        Save
                      </Button>
                      <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : canEditBug(b) || canDeleteBug(b) ? (
                    <>
                      {canEditBug(b) ? (
                        <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => startEdit(b)}>
                          <Pencil size={14} />
                        </button>
                      ) : null}
                      {canDeleteBug(b) ? (
                        <button className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeBug(b.id)}>
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Bug} title={user?.role === ROLES.ADMIN ? 'No bugs reported' : 'No bugs assigned'} description="Try changing filters or check back later." />
          )}
        </div>
      </div>
    </div>
  )
}

