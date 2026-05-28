import { Activity } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Activity size={18} strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-900">EngOps</div>
        <div className="text-xs text-slate-500">Platform</div>
      </div>
    </div>
  )
}

