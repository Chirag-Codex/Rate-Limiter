import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api'

const PRESET_PATHS = [
  { label: 'Login', path: '/api/login', hint: 'strict — 3 tokens, refill 0.5/s' },
  { label: 'Test', path: '/api/test', hint: '5 tokens, refill 1/s' },
  { label: 'Data', path: '/api/data', hint: 'loose — 10 tokens, refill 1/s' },
]

async function runTest(targetUrl) {
  const start = performance.now()
  try {
    const res = await fetch(targetUrl, { method: 'GET' })
    const latency = Math.round(performance.now() - start)

    let body = null
    try {
      body = await res.json()
    } catch {
     
    }

    const headerRemaining = res.headers.get('X-RateLimit-Remaining')
    const headerLimit = res.headers.get('X-RateLimit-Limit')
    const headerRetry = res.headers.get('Retry-After')

    return {
      status: res.status,
      allowed: res.status !== 429 && res.ok,
      tokens: headerRemaining !== null ? Number(headerRemaining) : (body?.tokens ?? null),
      limit: headerLimit !== null ? Number(headerLimit) : (body?.limit ?? null),
      retryAfter: headerRetry !== null ? Number(headerRetry) : (body?.retryAfter ?? 0),
      msg: body?.msg || body?.error || null,
      latency,
    }
  } catch (err) {
    return {
      status: 0,
      allowed: false,
      error: 'Network error — check the URL and that CORS is allowed',
      latency: Math.round(performance.now() - start),
    }
  }
}

export default function TestEndpointPage() {
  const location = useLocation()
  const defaultBaseUrl = API_BASE_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:5000')
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)
  const [url, setUrl] = useState(location.state?.prefillUrl || `${defaultBaseUrl}/api/login`)
  const [savedEndpoints, setSavedEndpoints] = useState([])
  const [burstCount, setBurstCount] = useState(10)
  const [singleResult, setSingleResult] = useState(null)
  const [singleLoading, setSingleLoading] = useState(false)
  const [burstResults, setBurstResults] = useState([])
  const [burstLoading, setBurstLoading] = useState(false)

  function handleBaseUrlChange(value) {
    setBaseUrl(value)
  }

  function handlePreset(path) {
    const trimmedBase = baseUrl.trim().replace(/\/$/, '')
    setUrl(trimmedBase ? `${trimmedBase}${path}` : path)
  }

  function persistSaved(list) {
    setSavedEndpoints(list)
  }

  function handleSaveEndpoint() {
    const trimmed = url.trim()
    if (!trimmed || savedEndpoints.includes(trimmed)) return
    persistSaved([...savedEndpoints, trimmed])
  }

  function handleRemoveSaved(u) {
    persistSaved(savedEndpoints.filter((e) => e !== u))
  }

  async function handleSendSingle() {
    const trimmed = url.trim()
    if (!trimmed) return
    setSingleLoading(true)
    setSingleResult(null)
    const result = await runTest(trimmed)
    setSingleResult(result)
    setSingleLoading(false)
  }

  async function handleSendBurst() {
    const trimmed = url.trim()
    if (!trimmed) return
    setBurstLoading(true)
    setBurstResults([])
    const count = Math.min(Math.max(Number(burstCount) || 1, 1), 50)
   
    const results = await Promise.all(Array.from({ length: count }).map(() => runTest(trimmed)))
    setBurstResults(results)
    setBurstLoading(false)
  }

  const burstAllowed = burstResults.filter((r) => r.allowed).length
  const burstDenied = burstResults.filter((r) => !r.allowed && r.status !== 0).length
  const burstErrors = burstResults.filter((r) => r.status === 0).length
  const alreadySaved = savedEndpoints.includes(url.trim())

  return (
    <div className="relative min-h-screen bg-base text-primary">
      <div className="absolute inset-x-0 top-0 h-44 hero-glow pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-eyebrow text-secondary font-medium mb-1.5">RateGuard</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Test an endpoint</h1>
        </div>

        <div className="bg-elevated border border-border-subtle rounded-md p-5 mb-6">
          <label className="block text-xs text-muted mb-1.5 font-medium">
            Base URL 
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder="http://localhost:5000"
            className="w-full bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors mb-4"
          />
          <p className="text-xs text-muted mb-2 font-medium">Quick demo routes</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PATHS.map((p) => (
              <button
                key={p.path}
                onClick={() => handlePreset(p.path)}
                title={p.hint}
                className="flex items-center gap-2 bg-base border border-border-subtle hover:border-accent-teal/40 rounded-sm px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
              >
                <span className="text-xs font-medium text-primary">{p.label}</span>
                <span className="text-xs text-secondary">{p.path}</span>
              </button>
            ))}
          </div>
        </div>

        {savedEndpoints.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {savedEndpoints.map((u) => (
              <span
                key={u}
                className="flex items-center gap-2 bg-elevated border border-border-subtle rounded-sm pl-3 pr-1.5 py-1"
              >
                <button
                  onClick={() => setUrl(u)}
                  className="text-xs text-secondary hover:text-accent-teal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
                >
                  {u}
                </button>
                <button
                  onClick={() => handleRemoveSaved(u)}
                  aria-label={`Remove ${u}`}
                  className="w-5 h-5 rounded-sm text-muted hover:text-danger hover:bg-danger/10 text-xs flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="bg-elevated border border-border-subtle rounded-md p-5 mb-6">
          <label className="block text-xs text-muted mb-1.5 font-medium">Endpoint URL</label>
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:5000/api/login"
              className="flex-1 bg-base border border-border-subtle rounded-sm px-3.5 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
            />
            <button
              onClick={handleSaveEndpoint}
              disabled={!url.trim() || alreadySaved}
              className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-sm border border-border-subtle bg-chip text-secondary hover:text-primary hover:border-accent-teal/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
            >
              {alreadySaved ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendSingle}
              disabled={singleLoading || !url.trim()}
              className="bg-btn-light-bg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-btn-light-text px-4 py-2 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              {singleLoading ? 'Sending…' : 'Send request'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendBurst}
                disabled={burstLoading || !url.trim()}
                className="bg-chip hover:bg-chip/80 disabled:opacity-50 disabled:cursor-not-allowed text-primary border border-border-subtle px-4 py-2 rounded-sm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
              >
                {burstLoading ? 'Sending burst…' : 'Send burst'}
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={burstCount}
                onChange={(e) => setBurstCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-16 bg-base border border-border-subtle rounded-sm px-2 py-2 text-xs text-primary text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal transition-colors"
              />
            </div>
          </div>
        </div>

        {singleResult && (
          <div className="bg-elevated border border-border-subtle rounded-md p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-primary">Result</h2>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-sm border ${
                  singleResult.status === 0 || !singleResult.allowed
                    ? 'bg-danger/10 text-danger border-danger/20'
                    : 'bg-chip text-accent-teal border-border-subtle'
                }`}
              >
                {singleResult.status === 0 ? 'Error' : singleResult.allowed ? 'Allowed' : 'Denied'}
              </span>
            </div>

            {singleResult.error ? (
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm p-3">{singleResult.error}</p>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-sm text-primary">
                <div>
                  <p className="text-xs text-muted mb-1 font-medium">Status</p>
                  <span className="text-base font-light text-primary">{singleResult.status}</span>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1 font-medium">Tokens left</p>
                  <span className="text-base font-light text-primary">
                    {singleResult.tokens !== null
                      ? `${singleResult.tokens}${singleResult.limit ? ` / ${singleResult.limit}` : ''}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1 font-medium">Latency</p>
                  <span className="text-base font-light text-primary">{singleResult.latency}ms</span>
                </div>
                {singleResult.retryAfter > 0 && (
                  <div className="col-span-3">
                    <p className="text-xs text-muted mb-1 font-medium">Retry after</p>
                    <span className="text-base font-light text-primary">{singleResult.retryAfter}s</span>
                  </div>
                )}
                {singleResult.msg && (
                  <div className="col-span-3 text-secondary text-xs">{singleResult.msg}</div>
                )}
              </div>
            )}
          </div>
        )}

        {burstResults.length > 0 && (
          <div className="bg-elevated border border-border-subtle rounded-md p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-sm font-medium text-primary">Burst results</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-sm bg-chip text-accent-teal border border-border-subtle">
                  {burstAllowed} allowed
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-sm bg-danger/15 text-danger border border-danger/20">
                  {burstDenied} denied
                </span>
                {burstErrors > 0 && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-sm bg-chip text-muted border border-border-subtle">
                    {burstErrors} errors
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {burstResults.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs text-secondary bg-base border border-border-subtle rounded-sm px-3 py-2"
                >
                  <span className="text-muted w-6">#{i + 1}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      r.status === 0 ? 'bg-muted' : r.allowed ? 'bg-accent-teal' : 'bg-danger'
                    }`}
                  />
                  <span className={r.status === 0 ? 'text-muted' : r.allowed ? 'text-accent-teal' : 'text-danger'}>
                    {r.status === 0 ? 'error' : r.allowed ? 'allowed' : 'denied'}
                  </span>
                  {r.tokens !== null && r.tokens !== undefined && (
                    <span className="text-muted">tokens={r.tokens}</span>
                  )}
                  {r.retryAfter > 0 && <span className="text-muted">retry={r.retryAfter}s</span>}
                  <span className="text-muted ml-auto">{r.latency}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}