import { useEffect } from 'react'

const styles = {
  success: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export function AlertBanner({ type = 'info', message, onClose, autoDismissMs = 4000 }) {
  useEffect(() => {
    if (!message || !onClose) return
    const t = setTimeout(() => onClose(''), autoDismissMs)
    return () => clearTimeout(t)
  }, [message, onClose, autoDismissMs])

  if (!message) return null
  return <div className={`mb-4 rounded-md border p-3 text-sm ${styles[type] || styles.info}`}>{message}</div>
}

