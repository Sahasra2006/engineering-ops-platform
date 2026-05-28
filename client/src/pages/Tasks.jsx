import { useEffect, useState } from 'react'
import { tasksApi, usersApi, teamsApi } from '../api/resources'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { CheckSquare, Pencil, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canManageTasks, ROLES } from '../utils/rbac'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { AlertBanner } from '../components/AlertBanner'
import { getErrorMessage } from '../utils/error'

export function TasksPage() {
  const { user } = useAuth()
  const canManage = canManageTasks(user)
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [userDirectory, setUserDirectory] = useState({})
  const [teamMemberIds, setTeamMemberIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [form, setForm] = useState({ title: '', description: '', due_date: '', status: 'TODO', priority: 'MEDIUM', assigned_to: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', status: 'TODO', priority: 'MEDIUM', assigned_to: '' })

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
  const filteredItems = items.filter((t) => {
    const byQuery = !query || String(t.title || '').toLowerCase().includes(query.toLowerCase())
    const byStatus = statusFilter === 'ALL' || t.status === statusFilter
    const byPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
    return byQuery && byStatus && byPriority
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await tasksApi.list()
      let rows = res.data || []
      if (user?.role === ROLES.DEVELOPER) {
        rows = rows.filter((t) => t.assigned_to === user.id)
      } else if (user?.role === ROLES.QA) {
        rows = rows.filter((t) => t.assigned_to === user.id)
      } else if (user?.role === ROLES.MANAGER) {
        rows = rows.filter((t) => teamMemberIds.includes(t.assigned_to))
      }
      setItems(rows)
      const ids = [...new Set(rows.map((t) => t.assigned_to).filter(Boolean))]
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
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      await tasksApi.create({
        ...form,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
      })
      setForm({ title: '', description: '', due_date: '', status: 'TODO', priority: 'MEDIUM', assigned_to: '' })
      setSuccess('Task created successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      due_date: String(task.due_date || '').slice(0, 10),
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM',
      assigned_to: task.assigned_to || '',
    })
    setError('')
    setSuccess('')
  }

  const saveEdit = async (id) => {
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      await tasksApi.update(id, {
        ...editForm,
        assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
      })
      setEditingId(null)
      setSuccess('Task updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const removeTask = async (id) => {
    if (!canManage) return
    if (!window.confirm('Delete this task?')) return
    setError('')
    setSuccess('')
    try {
      await tasksApi.remove(id)
      setSuccess('Task deleted successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <CheckSquare size={20} className="text-blue-600" />
          {user?.role === ROLES.DEVELOPER ? 'My Tasks' : user?.role === ROLES.QA ? 'Testing Queue' : 'Tasks'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Create tasks and track progress.</p>
      </div>

      <AlertBanner type="error" message={error} onClose={setError} />
      <AlertBanner type="success" message={success} onClose={setSuccess} />

      {canManage ? (
      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <Input label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <Input
          label="Due date"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))}
          required
        />
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="DONE">DONE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Priority</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
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
            <input
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900"
              placeholder="Search by title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="DONE">DONE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Priority</div>
          <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">All tasks</div>
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading…</div>
          ) : filteredItems.length ? (
            filteredItems.map((t) => (
              <div key={t.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {editingId === t.id && canManage ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} />
                      <Input value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
                      <Input type="date" value={editForm.due_date} onChange={(e) => setEditForm((s) => ({ ...s, due_date: e.target.value }))} />
                      <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={editForm.status} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}>
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="DONE">DONE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                      <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={editForm.priority} onChange={(e) => setEditForm((s) => ({ ...s, priority: e.target.value }))}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
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
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500">{t.description || '—'}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">Status: <StatusBadge value={t.status} /></span>
                        <span className="flex items-center gap-1">Priority: <StatusBadge value={t.priority} /></span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Assigned: {assigneeLabel(t.assigned_to)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Due: {String(t.due_date).slice(0, 10)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Created: {String(t.created_at || '').slice(0, 10) || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs text-slate-500">#{t.id}</div>
                  {editingId === t.id && canManage ? (
                    <>
                      <Button className="px-2 py-1 text-xs" onClick={() => saveEdit(t.id)}>
                        Save
                      </Button>
                      <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : canManage ? (
                    <>
                      <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => startEdit(t)}>
                        <Pencil size={14} />
                      </button>
                      <button className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeTask(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={CheckSquare} title={user?.role === ROLES.ADMIN ? 'No tasks found' : 'No assigned tasks'} description="Try changing filters or check back later." />
          )}
        </div>
      </div>
    </div>
  )
}

