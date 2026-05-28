export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60'
  const styles =
    variant === 'secondary'
      ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
      : 'bg-blue-600 text-white hover:bg-blue-700'

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}

