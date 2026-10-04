import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiUrl, API_BASE_URL } from '../lib/api'

const deployedBaseUrl = API_BASE_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:5000');

const INTEGRATION_SNIPPET = `// Add this middleware to your Express app
const rateLimiterUrl = '${deployedBaseUrl}/v1/check';
const apiKey = 'YOUR_API_KEY_HERE'; // replace with your actual key

async function enforceRateLimit(req, res, next) {
  try {
    const response = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ clientId: req.ip }),
    });
    const result = await response.json();
    if (response.status === 429) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  } catch (err) {
    next();
  }
}

app.use(enforceRateLimit);`

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [snippetCopied, setSnippetCopied] = useState(false)

  useEffect(() => {
    async function fetchProject() {
      setLoading(true)
      try {
        const res = await fetch(apiUrl(`/projects/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          logout()
          return
        }
        const data = await res.json()
        if (res.ok) {
          setProject(data.project)
        } else {
          setError(data.msg || 'Failed to load project')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id, token])

  async function handleDelete() {
    setDeleting(true)
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
        setDeleting(false)
        return
      }
      navigate('/projects')
    } catch (err) {
      setError('Network error')
      setDeleting(false)
    }
  }

  function handleCopySnippet() {
    navigator.clipboard.writeText(INTEGRATION_SNIPPET)
    setSnippetCopied(true)
    setTimeout(() => setSnippetCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted">Loading project…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-44 hero-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link
            to="/projects"
            className="text-xs text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal rounded-sm"
          >
            ← Back to projects
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/test', { state: { prefillUrl: project.websiteUrl } })}
              className="bg-btn-light-bg hover:bg-white text-btn-light-text px-3.5 py-1.5 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              Test this endpoint →
            </button>

            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-sm bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  {deleting ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-xs px-3.5 py-1.5 rounded-sm bg-chip text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-sm bg-chip hover:bg-danger/10 text-secondary hover:text-danger border border-border-subtle hover:border-danger/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                Delete project
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-eyebrow text-secondary font-medium mb-1.5">Project details</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary mb-1">{project.name}</h1>
          <p className="text-sm text-muted">{project.websiteUrl}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-elevated p-5 rounded-md border border-border-subtle">
            <p className="text-xs text-muted mb-2 font-medium">Capacity</p>
            <p className="text-3xl font-light text-primary">{project.capacity}</p>
          </div>
          <div className="bg-elevated p-5 rounded-md border border-border-subtle">
            <p className="text-xs text-muted mb-2 font-medium">Refill rate</p>
            <p className="text-3xl font-light text-primary">
              {project.refillRate}
              <span className="text-xs text-muted font-normal ml-1">/s</span>
            </p>
          </div>
          <div className="bg-elevated p-5 rounded-md border border-border-subtle">
            <p className="text-xs text-muted mb-2 font-medium">Allowed requests</p>
            <p className="text-3xl font-light text-accent-teal">{project.allowedCount}</p>
          </div>
          <div className="bg-elevated p-5 rounded-md border border-border-subtle">
            <p className="text-xs text-muted mb-2 font-medium">Denied requests</p>
            <p className="text-3xl font-light text-danger">{project.deniedCount}</p>
          </div>
        </div>

        <div className="bg-elevated p-6 rounded-md border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-primary">Integration code</h2>
            <button
              onClick={handleCopySnippet}
              className="text-xs font-medium px-3.5 py-1.5 rounded-sm bg-chip hover:bg-chip/80 text-secondary hover:text-primary border border-border-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
            >
              {snippetCopied ? 'Copied ✓' : 'Copy snippet'}
            </button>
          </div>
          <pre className="bg-base border border-border-subtle p-4 rounded-sm overflow-x-auto text-xs font-mono text-secondary leading-relaxed">
            {INTEGRATION_SNIPPET}
          </pre>
        </div>
      </div>
    </div>
  )
}