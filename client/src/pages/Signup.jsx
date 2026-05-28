import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const { signup, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'ADMIN' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await signup(form)
      setSuccess('Account created. Please login.')
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">Get started with Engineering Operations Platform.</p>

          {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Full name"
              value={form.full_name}
              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
              placeholder="Your name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="you@company.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              placeholder="Create a strong password"
              required
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Role</div>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="QA">QA</option>
              </select>
            </label>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Sign up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="font-medium text-blue-700 hover:underline" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

