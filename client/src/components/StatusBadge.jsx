const COLOR_MAP = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-indigo-50 text-indigo-700',
  DONE: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-700',
  OPEN: 'bg-orange-50 text-orange-700',
  INVESTIGATING: 'bg-blue-50 text-blue-700',
  IDENTIFIED: 'bg-violet-50 text-violet-700',
  MONITORING: 'bg-cyan-50 text-cyan-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-700',
  REOPENED: 'bg-amber-50 text-amber-700',
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-yellow-50 text-yellow-700',
  HIGH: 'bg-orange-50 text-orange-700',
  CRITICAL: 'bg-red-50 text-red-700',
  PLANNING: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-blue-50 text-blue-700',
  ON_HOLD: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

export function StatusBadge({ value }) {
  const text = value || 'N/A'
  const style = COLOR_MAP[text] || 'bg-slate-100 text-slate-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{text}</span>
}

