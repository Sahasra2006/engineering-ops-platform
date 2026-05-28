import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const demoAccounts = [
    { role: 'Admin', email: 'admin@gmail.com' },
    { role: 'Manager', email: 'manager@gmail.com' },
    { role: 'Developer', email: 'sahasra@gmail.com' },
    { role: 'Developer', email: 'priya@gmail.com' },
    { role: 'QA', email: 'sneha@gmail.com' },
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  const useDemo = (email) => {
    setForm({ email, password: '123456' })
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Login</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to manage teams, projects, and work.</p>

          {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="you@company.com"
              required
            />
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Password</div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Demo Accounts</div>
            <div className="mt-2 space-y-1.5">
              {demoAccounts.map((account) => (
                <div key={account.email} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
                  <div className="min-w-0 text-xs text-slate-700">
                    <span className="font-medium text-slate-800">{account.role}</span> {account.email}
                  </div>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => useDemo(account.email)}
                  >
                    Use Demo
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{' '}
            <Link className="font-medium text-blue-700 hover:underline" to="/signup">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

