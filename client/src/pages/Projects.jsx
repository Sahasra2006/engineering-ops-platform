import { useEffect, useState } from 'react'
import { projectsApi } from '../api/resources'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { FolderKanban, Pencil, Search, Trash2 } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { AlertBanner } from '../components/AlertBanner'
import { getErrorMessage } from '../utils/error'

export function ProjectsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [form, setForm] = useState({ title: '', description: '', status: 'PLANNING' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'PLANNING' })
  const filteredItems = items.filter((p) => {
    const byQuery = !query || String(p.title || '').toLowerCase().includes(query.toLowerCase())
    const byStatus = statusFilter === 'ALL' || p.status === statusFilter
    return byQuery && byStatus
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectsApi.list()
      setItems(res.data || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await projectsApi.create(form)
      setForm({ title: '', description: '', status: 'PLANNING' })
      setSuccess('Project created successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'PLANNING',
    })
    setError('')
    setSuccess('')
  }

  const saveEdit = async (id) => {
    setError('')
    setSuccess('')
    try {
      await projectsApi.update(id, editForm)
      setEditingId(null)
      setSuccess('Project updated successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const removeProject = async (id) => {
    if (!window.confirm('Delete this project?')) return
    setError('')
    setSuccess('')
    try {
      await projectsApi.remove(id)
      setSuccess('Project deleted successfully.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <FolderKanban size={20} className="text-blue-600" />
          Projects
        </h1>
        <p className="mt-1 text-sm text-slate-600">Track ongoing and completed projects.</p>
      </div>

      <AlertBanner type="error" message={error} onClose={setError} />
      <AlertBanner type="success" message={success} onClose={setSuccess} />

      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="PLANNING">PLANNING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button className="w-full" type="submit">
            Create
          </Button>
        </div>
      </form>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
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
            <option value="PLANNING">PLANNING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">All projects</div>
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading…</div>
          ) : filteredItems.length ? (
            filteredItems.map((p) => (
              <div key={p.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {editingId === p.id ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} />
                      <Input value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={editForm.status}
                        onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
                      >
                        <option value="PLANNING">PLANNING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ON_HOLD">ON_HOLD</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-500">{p.description || '—'}</div>
                      <div className="mt-1">
                        <StatusBadge value={p.status} />
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs text-slate-500">#{p.id}</div>
                  {editingId === p.id ? (
                    <>
                      <Button className="px-2 py-1 text-xs" onClick={() => saveEdit(p.id)}>
                        Save
                      </Button>
                      <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => startEdit(p)}>
                        <Pencil size={14} />
                      </button>
                      <button className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeProject(p.id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={FolderKanban} title="No projects found" description="Try changing filters or create a new project." />
          )}
        </div>
      </div>
    </div>
  )
}

