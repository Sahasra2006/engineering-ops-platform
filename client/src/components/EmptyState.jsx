export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="mx-4 my-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
      {Icon ? <Icon size={20} className="mx-auto text-slate-400" /> : null}
      <div className="mt-2 text-sm font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{description}</div>
    </div>
  )
}

