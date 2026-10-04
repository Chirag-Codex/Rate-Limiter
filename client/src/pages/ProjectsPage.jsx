import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../lib/api'

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
      const res = await fetch(apiUrl('/projects'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
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
      const res = await fetch(apiUrl('/projects'), {
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
      const res = await fetch(apiUrl(`/projects/${id}`), {
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
    setTimeout(() => {
      setNewApiKey(null)
      setCopied(false)
    }, 1200)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted">Loading projects…</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-44 hero-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-eyebrow text-secondary font-medium mb-1.5">RateGuard</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Your projects</h1>
            <p className="text-sm text-muted mt-1.5">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={
              showForm
                ? 'bg-chip hover:bg-chip/80 text-secondary hover:text-primary px-3.5 py-1.5 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal'
                : 'bg-btn-light-bg hover:bg-white text-btn-light-text px-3.5 py-1.5 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs'
            }
          >
            {showForm ? 'Cancel' : 'Create new project'}
          </button>
        </div>

        {error && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3.5 py-2.5 mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateProject} className="bg-elevated p-6 rounded-md mb-8 border border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
                required
              />
              <input
                type="url"
                placeholder="Website URL"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
                required
              />
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Refill rate (tokens/sec)"
                value={refillRate}
                onChange={(e) => setRefillRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-5 bg-btn-light-bg hover:bg-white text-btn-light-text px-4 py-2 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              Create project
            </button>
          </form>
        )}

        {newApiKey && (
          <div className="bg-warning/10 border border-warning/20 p-5 rounded-md mb-8">
            <p className="text-xs font-medium text-warning mb-1.5 uppercase tracking-wide">API key — shown once, copy it now</p>
            <p className="text-xs text-primary break-all tracking-wide mb-3 bg-base/60 p-2.5 rounded-sm border border-border-subtle">{newApiKey}</p>
            <button
              onClick={handleCopyKey}
              className="bg-btn-light-bg hover:bg-white text-btn-light-text px-3 py-1.5 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="border border-dashed border-border-subtle rounded-md p-10 text-center">
            <p className="text-sm text-muted">No projects yet. Create one to get an API key.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project._id} className="flex items-stretch gap-2">
                <Link
                  to={`/projects/${project._id}`}
                  className="flex-1 min-w-0 bg-elevated p-4 sm:p-5 rounded-md border border-border-subtle/50 hover:border-border-subtle transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h2 className="text-base font-medium text-primary truncate">{project.name}</h2>
                      <p className="text-xs text-secondary truncate mt-0.5">{project.websiteUrl}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-sm bg-chip text-accent-teal whitespace-nowrap">
                        {project.allowedCount} allowed
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-sm bg-danger/15 text-danger whitespace-nowrap">
                        {project.deniedCount} denied
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted">
                    capacity {project.capacity} · refill {project.refillRate}/s
                  </div>
                </Link>

                {confirmDeleteId === project._id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="text-xs font-medium px-3 py-2 rounded-sm bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-3 py-2 rounded-sm bg-chip text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(project._id)}
                    className="shrink-0 w-10 flex items-center justify-center rounded-sm bg-elevated border border-border-subtle/50 text-muted hover:text-danger hover:border-danger/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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