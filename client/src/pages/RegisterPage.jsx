import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../lib/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.msg || 'Registration failed')
        return
      }
      login(data.token, data.user)
      navigate('/projects')
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-base text-primary flex items-center justify-center px-4">
      <div className="absolute inset-x-0 top-0 h-44 hero-glow pointer-events-none" />

      <form onSubmit={handleSubmit} className="relative bg-elevated p-8 rounded-md border border-border-subtle w-full max-w-sm shadow-xs">
        <p className="text-xs uppercase tracking-eyebrow text-secondary font-medium mb-5">
          Rate<span className="text-accent-teal">Guard</span>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary mb-1">Register</h1>
        <p className="text-xs text-muted mb-6">Create an account to start protecting your endpoints.</p>

        <div className="mb-4">
          <label className="block text-xs text-muted mb-1.5 font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-muted mb-1.5 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-xs text-muted mb-1.5 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3.5 py-2.5 mb-5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-btn-light-bg hover:bg-white disabled:opacity-50 disabled:cursor-wait text-btn-light-text py-2 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
        >
          {submitting ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-xs text-muted mt-5 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal rounded-sm">Log in</Link>
        </p>
      </form>
    </div>
  )
}