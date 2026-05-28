import { useEffect, useState } from 'react'
import { teamsApi, usersApi } from '../api/resources'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Pencil, Search, Trash2, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/rbac'
import { AlertBanner } from '../components/AlertBanner'
import { EmptyState } from '../components/EmptyState'
import { getErrorMessage } from '../utils/error'

export function TeamsPage() {
  const { user } = useAuth()
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER
  const [items, setItems] = useState([])
  const [membersByTeam, setMembersByTeam] = useState({})
  const [assignableUsers, setAssignableUsers] = useState([])
  const [selectedUserByTeam, setSelectedUserByTeam] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [createMemberIds, setCreateMemberIds] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const filteredAssignable = assignableUsers.filter((u) => `${u.full_name} ${u.role}`.toLowerCase().includes(memberSearch.toLowerCase()))

  const load = async () => {
    setLoading(true)
    try {
      const [teamsRes, meRes] = await Promise.all([teamsApi.list(), usersApi.getById(user.id)])
      const allTeams = teamsRes.data || []
      const me = meRes?.data || user
      const visibleTeams =
        user?.role === ROLES.DEVELOPER || user?.role === ROLES.QA
          ? allTeams.filter((t) => t.id === me.team_id)
          : allTeams
      setItems(visibleTeams)
      const membersPairs = await Promise.all(
        visibleTeams.map(async (team) => {
          try {
            const membersRes = await teamsApi.members(team.id)
            return [team.id, membersRes?.data || []]
          } catch {
            return [team.id, []]
          }
        })
      )
      setMembersByTeam(Object.fromEntries(membersPairs))
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await load()
      if (canManage) {
        usersApi
          .list({ page: 1, limit: 100 })
          .then((res) => setAssignableUsers((res?.data?.items || []).filter((u) => u.role !== ROLES.ADMIN)))
          .catch(() => setAssignableUsers([]))
      } else {
        setAssignableUsers([])
      }
    })()
  }, [user?.id, user?.role])

  const create = async (e) => {
    e.preventDefault()
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      const created = await teamsApi.create(form)
      const teamId = created?.data?.id
      if (teamId && createMemberIds.length) {
        await Promise.all(createMemberIds.map((id) => teamsApi.addMember(teamId, Number(id))))
      }
      setForm({ name: '', description: '' })
      setCreateMemberIds([])
      setSuccess('Team created successfully.')
      await load()
    } catch (err) {
      const msg = getErrorMessage(err, 'Something went wrong. Please try again.')
      if (/already exists/i.test(msg)) setError('Team name already exists')
      else if (/name is required/i.test(msg)) setError('Team name is required')
      else setError(msg)
    }
  }

  const startEdit = (team) => {
    setEditingId(team.id)
    setEditForm({ name: team.name || '', description: team.description || '' })
    setError('')
    setSuccess('')
  }

  const saveEdit = async (id) => {
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      await teamsApi.update(id, editForm)
      setEditingId(null)
      setSuccess('Team updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  const removeTeam = async (id) => {
    if (!canManage) return
    if (!window.confirm('Delete this team?')) return
    setError('')
    setSuccess('')
    try {
      await teamsApi.remove(id)
      setSuccess('Team deleted successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  const assignMember = async (teamId) => {
    const userId = Number(selectedUserByTeam[teamId])
    if (!userId || !canManage) return
    setError('')
    setSuccess('')
    try {
      await teamsApi.addMember(teamId, userId)
      setSelectedUserByTeam((s) => ({ ...s, [teamId]: '' }))
      setSuccess('Member assigned to team.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  const removeMember = async (teamId, userId) => {
    if (!canManage) return
    setError('')
    setSuccess('')
    try {
      await teamsApi.removeMember(teamId, userId)
      setSuccess('Member removed from team.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Users size={20} className="text-blue-600" />
          Teams
        </h1>
        <p className="mt-1 text-sm text-slate-600">{canManage ? 'Manage engineering teams and members' : 'Your assigned engineering team'}</p>
      </div>

      <AlertBanner type="error" message={error} onClose={setError} />
      <AlertBanner type="success" message={success} onClose={setSuccess} />

      {canManage ? (
      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <Input label="Team name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium text-slate-700">Select members</div>
          <div className="relative mb-2">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
            <input
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm"
              placeholder="Search users"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>
          <div className="max-h-28 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
            <div className="flex flex-wrap gap-2">
              {filteredAssignable.map((u) => {
                const selected = createMemberIds.includes(String(u.id))
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setCreateMemberIds((prev) => (selected ? prev.filter((id) => id !== String(u.id)) : [...prev, String(u.id)]))
                    }
                    className={`rounded-full border px-2 py-1 text-xs ${selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    {u.full_name} • {u.role}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex items-end">
          <Button className="w-full" type="submit">
            Create
          </Button>
        </div>
      </form>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">{canManage ? 'All teams' : 'My team'}</div>
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading…</div>
          ) : items.length ? (
            items.map((t) => (
              <div key={t.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {editingId === t.id && canManage ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Team name"
                      />
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                        placeholder="Description"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.description || '—'}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Manager: {t.manager?.full_name || 'Unassigned'} • Members: {t.total_members ?? (membersByTeam[t.id] || []).length} • Active tasks: {t.active_tasks ?? 0} • Open bugs: {t.open_bugs ?? 0} • Critical incidents: {t.critical_incidents ?? 0}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(membersByTeam[t.id] || []).map((m) => (
                          <span
                            key={m.id}
                            title={`${m.full_name}\n${m.role}\n${m.availability || 'UNKNOWN'}`}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                          >
                            [{m.full_name} - {m.role}]
                            {canManage ? (
                              <button className="ml-1 text-slate-400 hover:text-red-600" onClick={() => removeMember(t.id, m.id)}>
                                ×
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                      {canManage ? (
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            className="w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={selectedUserByTeam[t.id] || ''}
                            onChange={(e) => setSelectedUserByTeam((s) => ({ ...s, [t.id]: e.target.value }))}
                          >
                            <option value="">Assign member</option>
                            {assignableUsers
                              .filter((u) => u.team_id !== t.id)
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.full_name} ({u.role})
                                </option>
                              ))}
                          </select>
                          <Button className="px-2 py-1 text-xs" onClick={() => assignMember(t.id)}>
                            Add
                          </Button>
                        </div>
                      ) : null}
                    </div>
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
                      <button className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeTeam(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No engineering teams available yet"
              description={canManage ? 'Create your first team to get started.' : 'No assigned team yet.'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

