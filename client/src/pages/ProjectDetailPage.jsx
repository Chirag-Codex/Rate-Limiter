import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INTEGRATION_SNIPPET = `// Add this middleware to your Express app
const rateLimiterUrl = 'http://localhost:5000/v1/check';
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
        const res = await fetch(`/projects/${id}`, {
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
      <div className="min-h-screen bg-[#0A0D10] flex items-center justify-center">
        <p className="text-[13px] text-[#6E7681]">Loading project…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0D10] flex items-center justify-center px-4">
        <p className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-[#0A0D10] text-[#E6EDF3] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/projects" className="text-[13px] text-[#6E7681] hover:text-[#E6EDF3] transition-colors">
            ← Back to projects
          </Link>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-[#1E252B] text-[#6E7681] hover:text-[#E6EDF3] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#1E252B] text-[#6E7681] hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              Delete project
            </button>
          )}
        </div>

        <h1 className="text-[22px] font-medium mb-1">{project.name}</h1>
        <p className="text-[13px] text-[#6E7681] mb-6">{project.websiteUrl}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#12161A] p-4 rounded-lg border border-[#1E252B]">
            <p className="text-[12px] text-[#6E7681] mb-1">Capacity</p>
            <p className="font-mono text-[20px]">{project.capacity}</p>
          </div>
          <div className="bg-[#12161A] p-4 rounded-lg border border-[#1E252B]">
            <p className="text-[12px] text-[#6E7681] mb-1">Refill rate</p>
            <p className="font-mono text-[20px]">
              {project.refillRate}
              <span className="text-[13px] text-[#6E7681]">/s</span>
            </p>
          </div>
          <div className="bg-[#12161A] p-4 rounded-lg border border-[#1E252B]">
            <p className="text-[12px] text-[#6E7681] mb-1">Allowed requests</p>
            <p className="font-mono text-[20px] text-teal-400">{project.allowedCount}</p>
          </div>
          <div className="bg-[#12161A] p-4 rounded-lg border border-[#1E252B]">
            <p className="text-[12px] text-[#6E7681] mb-1">Denied requests</p>
            <p className="font-mono text-[20px] text-red-400">{project.deniedCount}</p>
          </div>
        </div>

        <div className="bg-[#12161A] p-4 rounded-lg border border-[#1E252B]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-medium">Integration code</h2>
            <button
              onClick={handleCopySnippet}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#1E252B] text-[#E6EDF3] hover:border-teal-400/40 transition-colors"
            >
              {snippetCopied ? 'Copied ✓' : 'Copy snippet'}
            </button>
          </div>
          <pre className="bg-[#0A0D10] border border-[#1E252B] p-4 rounded-lg overflow-x-auto text-[12px] font-mono text-[#9BA3AC]">
            {INTEGRATION_SNIPPET}
          </pre>
        </div>
      </div>
    </div>
  )
}