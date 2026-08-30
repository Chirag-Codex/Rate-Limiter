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
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-100">Test an endpoint</h1>
      

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <label className="block text-xs text-slate-500 mb-1.5">
            Base URL 
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder="http://localhost:5000"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-300/50 transition-colors mb-3"
          />
          <p className="text-xs text-slate-500 mb-2">Quick demo routes</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PATHS.map((p) => (
              <button
                key={p.path}
                onClick={() => handlePreset(p.path)}
                title={p.hint}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-teal-300/40 rounded-xl px-3 py-2 text-left transition-colors"
              >
                <span className="text-xs font-medium text-slate-100">{p.label}</span>
                <span className="font-mono text-xs text-slate-500">{p.path}</span>
              </button>
            ))}
          </div>
        </div>

        {savedEndpoints.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {savedEndpoints.map((u) => (
              <span
                key={u}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full pl-3 pr-1.5 py-1"
              >
                <button
                  onClick={() => setUrl(u)}
                  className="font-mono text-xs text-slate-300 hover:text-teal-300 transition-colors"
                >
                  {u}
                </button>
                <button
                  onClick={() => handleRemoveSaved(u)}
                  aria-label={`Remove ${u}`}
                  className="w-5 h-5 rounded-full text-slate-600 hover:text-red-400 hover:bg-red-400/10 text-xs leading-none transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <label className="block text-xs text-slate-500 mb-1.5">Endpoint URL</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:5000/api/login"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-300/50 transition-colors"
            />
            <button
              onClick={handleSaveEndpoint}
              disabled={!url.trim() || alreadySaved}
              className="shrink-0 text-xs font-medium px-3 rounded-xl border border-slate-800 text-slate-300 hover:border-teal-300/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {alreadySaved ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendSingle}
              disabled={singleLoading || !url.trim()}
              className="bg-teal-300 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              {singleLoading ? 'Sending…' : 'Send request'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendBurst}
                disabled={burstLoading || !url.trim()}
                className="bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 border border-amber-400/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {burstLoading ? 'Sending burst…' : 'Send burst'}
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={burstCount}
                onChange={(e) => setBurstCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-slate-100 text-center focus:outline-none focus:border-teal-300/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {singleResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-100">Result</h2>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  singleResult.status === 0 || !singleResult.allowed
                    ? 'bg-red-400/10 text-red-400 border-red-400/20'
                    : 'bg-teal-300/10 text-teal-300 border-teal-300/20'
                }`}
              >
                {singleResult.status === 0 ? 'Error' : singleResult.allowed ? 'Allowed' : 'Denied'}
              </span>
            </div>

            {singleResult.error ? (
              <p className="text-sm text-red-400">{singleResult.error}</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 font-mono text-sm text-slate-100">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-sans">Status</p>
                  {singleResult.status}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-sans">Tokens left</p>
                  {singleResult.tokens !== null
                    ? `${singleResult.tokens}${singleResult.limit ? ` / ${singleResult.limit}` : ''}`
                    : '—'}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-sans">Latency</p>
                  {singleResult.latency}ms
                </div>
                {singleResult.retryAfter > 0 && (
                  <div className="col-span-3">
                    <p className="text-xs text-slate-500 mb-1 font-sans">Retry after</p>
                    {singleResult.retryAfter}s
                  </div>
                )}
                {singleResult.msg && (
                  <div className="col-span-3 text-slate-400 font-sans text-xs">{singleResult.msg}</div>
                )}
              </div>
            )}
          </div>
        )}

        {burstResults.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-medium text-slate-100">Burst results</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-300/10 text-teal-300 border border-teal-300/20">
                  {burstAllowed} allowed
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                  {burstDenied} denied
                </span>
                {burstErrors > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    {burstErrors} errors
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {burstResults.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 font-mono text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5"
                >
                  <span className="text-slate-600 w-6">#{i + 1}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      r.status === 0 ? 'bg-slate-500' : r.allowed ? 'bg-teal-300' : 'bg-red-400'
                    }`}
                  />
                  <span className={r.status === 0 ? 'text-slate-400' : r.allowed ? 'text-teal-300' : 'text-red-400'}>
                    {r.status === 0 ? 'error' : r.allowed ? 'allowed' : 'denied'}
                  </span>
                  {r.tokens !== null && r.tokens !== undefined && (
                    <span className="text-slate-500">tokens={r.tokens}</span>
                  )}
                  {r.retryAfter > 0 && <span className="text-slate-500">retry={r.retryAfter}s</span>}
                  <span className="text-slate-600 ml-auto">{r.latency}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}