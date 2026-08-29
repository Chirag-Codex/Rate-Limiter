import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
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
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.msg || 'Login failed')
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
    <div className="min-h-screen bg-[#0A0D10] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-[#12161A] p-8 rounded-xl border border-[#1E252B] w-full max-w-sm">
        <h1 className="text-[20px] font-medium text-[#E6EDF3] mb-1">Log in</h1>
        <p className="text-[13px] text-[#6E7681] mb-6">Welcome back — enter your details.</p>

        <div className="mb-4">
          <label className="block text-[12px] text-[#6E7681] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-teal-400/50 transition-colors"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-[12px] text-[#6E7681] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] focus:outline-none focus:border-teal-400/50 transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#E6EDF3] hover:bg-white disabled:opacity-50 disabled:cursor-wait text-[#0A0D10] py-2.5 rounded-lg text-[13px] font-medium transition-colors"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-[13px] text-[#6E7681] mt-5 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#E6EDF3] hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}