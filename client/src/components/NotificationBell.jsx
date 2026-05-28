import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { notificationsApi } from '../api/resources'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)

  const list = useMemo(() => (items || []).slice(0, 8), [items])

  const load = async () => {
    try {
      const [listRes, countRes] = await Promise.all([notificationsApi.myList(), notificationsApi.unreadCount()])
      setItems(listRes.data || [])
      setUnread(Number(countRes.data || 0))
    } catch {
      setItems([])
      setUnread(0)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (id, isRead) => {
    if (isRead) return
    try {
      await notificationsApi.markRead(id)
      await load()
    } catch {
      // keep UI simple, ignore transient errors
    }
  }

  return (
    <div className="relative">
      <button
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        onClick={() => {
          setOpen((s) => !s)
          if (!open) load()
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between px-2">
            <div className="text-sm font-semibold text-slate-900">Notifications</div>
            <div className="text-xs text-slate-500">{unread} unread</div>
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {list.length ? (
              list.map((n) => (
                <button
                  key={n.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${n.is_read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/40'}`}
                  onClick={() => markRead(n.id, n.is_read)}
                >
                  <div className="text-sm text-slate-800">{n.message}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(n.created_at || Date.now()).toLocaleString()}</div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No recent notifications.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

