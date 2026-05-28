export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-slate-700">{label}</div> : null}
      <input
        className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </label>
  )
}

