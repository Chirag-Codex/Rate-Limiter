import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProjectsPage() {
  const { token, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [capacity, setCapacity] = useState(10)
  const [refillRate, setRefillRate] = useState(1)
  const [newApiKey, setNewApiKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [token])

  async function fetchProjects() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        // Stale/expired session — sign out so the user is routed back to /login
        logout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        setProjects(data.projects)
      } else {
        setError(data.msg || 'Failed to load projects')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          websiteUrl,
          capacity: Number(capacity),
          refillRate: Number(refillRate),
        }),
      })
      if (res.status === 401) {
        logout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        setNewApiKey(data.apiKey)
        setShowForm(false)
        setName('')
        setWebsiteUrl('')
        setCapacity(10)
        setRefillRate(1)
        fetchProjects()
      } else {
        setError(data.msg || 'Failed to create project')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        logout()
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.msg || 'Failed to delete project')
        return
      }
      setProjects((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      setError('Network error')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  function handleCopyKey() {
    navigator.clipboard.writeText(newApiKey)
    setCopied(true)
    // Key is shown once by design — clear it shortly after it's copied
    setTimeout(() => {
      setNewApiKey(null)
      setCopied(false)
    }, 1200)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D10] flex items-center justify-center">
        <p className="text-[13px] text-[#6E7681]">Loading projects…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0D10] text-[#E6EDF3] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-[20px] font-medium">Your projects</h1>
            <p className="text-[13px] text-[#6E7681] mt-1">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#E6EDF3] hover:bg-white text-[#0A0D10] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
          >
            {showForm ? 'Cancel' : 'Create new project'}
          </button>
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleCreateProject} className="bg-[#12161A] p-6 rounded-xl mb-6 border border-[#1E252B]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-teal-400/50 transition-colors"
                required
              />
              <input
                type="url"
                placeholder="Website URL"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-teal-400/50 transition-colors"
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-teal-400/50 transition-colors"
                required
              />
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Refill rate (tokens/sec)"
                value={refillRate}
                onChange={(e) => setRefillRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-[#0A0D10] border border-[#1E252B] rounded-lg px-3 py-2 text-[14px] text-[#E6EDF3] placeholder-[#6E7681] focus:outline-none focus:border-teal-400/50 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-4 bg-teal-400/10 hover:bg-teal-400/20 text-teal-400 border border-teal-400/20 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            >
              Create project
            </button>
          </form>
        )}

        {newApiKey && (
          <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-lg mb-6">
            <p className="text-[13px] font-medium text-amber-400 mb-1">API key — shown once, copy it now</p>
            <p className="font-mono text-[13px] text-[#E6EDF3] break-all mb-3">{newApiKey}</p>
            <button
              onClick={handleCopyKey}
              className="bg-[#E6EDF3] hover:bg-white text-[#0A0D10] px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="border border-dashed border-[#1E252B] rounded-xl p-8 text-center">
            <p className="text-[13px] text-[#6E7681]">No projects yet. Create one to get an API key.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project._id} className="flex items-stretch gap-2">
                <Link
                  to={`/projects/${project._id}`}
                  className="flex-1 min-w-0 bg-[#12161A] p-4 rounded-lg border border-[#1E252B] hover:border-[#2A333B] transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-medium truncate">{project.name}</h2>
                      <p className="text-[12px] text-[#6E7681] truncate">{project.websiteUrl}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-teal-400/10 text-teal-400 border border-teal-400/20 whitespace-nowrap">
                        {project.allowedCount} allowed
                      </span>
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20 whitespace-nowrap">
                        {project.deniedCount} denied
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-[#6E7681]">
                    capacity {project.capacity} · refill {project.refillRate}/s
                  </div>
                </Link>

                {confirmDeleteId === project._id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="text-[12px] font-medium px-3 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[12px] px-3 rounded-lg border border-[#1E252B] text-[#6E7681] hover:text-[#E6EDF3] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(project._id)}
                    className="shrink-0 w-10 rounded-lg border border-[#1E252B] text-[#6E7681] hover:text-red-400 hover:border-red-400/30 transition-colors"
                    aria-label="Delete project"
                    title="Delete project"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}