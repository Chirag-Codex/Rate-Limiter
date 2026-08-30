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
        <p className="text-[13px] text-slate-500">Loading project…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </p>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Link to="/projects" className="text-[13px] text-slate-500 hover:text-slate-100 transition-colors">
          ← Back to projects
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/test', { state: { prefillUrl: project.websiteUrl } })}
            className="text-[12px] font-medium px-3 py-1.5 rounded-xl bg-teal-300/10 text-teal-300 border border-teal-300/20 hover:bg-teal-300/20 transition-colors"
          >
            Test this endpoint →
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[12px] font-medium px-3 py-1.5 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-[12px] px-3 py-1.5 rounded-xl border border-[#1C2230] text-slate-500 hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-xl border border-[#1C2230] text-slate-500 hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              Delete project
            </button>
          )}
        </div>
      </div>

      <h1 className="text-[22px] font-semibold text-slate-100 mb-1">{project.name}</h1>
      <p className="text-[13px] text-slate-500 mb-6">{project.websiteUrl}</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#12161C] p-4 rounded-xl border border-[#1C2230]">
          <p className="text-[12px] text-slate-500 mb-1">Capacity</p>
          <p className="font-mono text-[20px] text-slate-100">{project.capacity}</p>
        </div>
        <div className="bg-[#12161C] p-4 rounded-xl border border-[#1C2230]">
          <p className="text-[12px] text-slate-500 mb-1">Refill rate</p>
          <p className="font-mono text-[20px] text-slate-100">
            {project.refillRate}
            <span className="text-[13px] text-slate-500">/s</span>
          </p>
        </div>
        <div className="bg-[#12161C] p-4 rounded-xl border border-[#1C2230]">
          <p className="text-[12px] text-slate-500 mb-1">Allowed requests</p>
          <p className="font-mono text-[20px] text-teal-300">{project.allowedCount}</p>
        </div>
        <div className="bg-[#12161C] p-4 rounded-xl border border-[#1C2230]">
          <p className="text-[12px] text-slate-500 mb-1">Denied requests</p>
          <p className="font-mono text-[20px] text-red-400">{project.deniedCount}</p>
        </div>
      </div>

      <div className="bg-[#12161C] p-4 rounded-xl border border-[#1C2230]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-medium text-slate-100">Integration code</h2>
          <button
            onClick={handleCopySnippet}
            className="text-[12px] font-medium px-3 py-1.5 rounded-xl border border-[#1C2230] text-slate-100 hover:border-teal-300/40 transition-colors"
          >
            {snippetCopied ? 'Copied ✓' : 'Copy snippet'}
          </button>
        </div>
        <pre className="bg-[#0B0E14] border border-[#1C2230] p-4 rounded-xl overflow-x-auto text-[12px] font-mono text-slate-400">
          {INTEGRATION_SNIPPET}
        </pre>
      </div>
    </div>
  )
}