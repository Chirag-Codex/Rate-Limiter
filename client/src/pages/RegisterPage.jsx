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
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-[#12161C] p-8 rounded-2xl border border-[#1C2230] w-full max-w-sm">
        <p className="text-[14px] font-semibold text-slate-100 mb-6">
          Rate<span className="text-teal-300">Guard</span>
        </p>
        <h1 className="text-[20px] font-semibold text-slate-100 mb-1">Register</h1>
        <p className="text-[13px] text-slate-500 mb-6">Create an account to start protecting your endpoints.</p>

        <div className="mb-4">
          <label className="block text-[12px] text-slate-500 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#1C2230] rounded-xl px-3 py-2 text-[14px] text-slate-100 focus:outline-none focus:border-teal-300/50 transition-colors"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[12px] text-slate-500 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#1C2230] rounded-xl px-3 py-2 text-[14px] text-slate-100 focus:outline-none focus:border-teal-300/50 transition-colors"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-[12px] text-slate-500 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#1C2230] rounded-xl px-3 py-2 text-[14px] text-slate-100 focus:outline-none focus:border-teal-300/50 transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-300 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-wait text-[#0B0E14] py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
        >
          {submitting ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-[13px] text-slate-500 mt-5 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-300 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}