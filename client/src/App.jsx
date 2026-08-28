import { useState, useEffect, useCallback } from 'react';

const ENDPOINTS = [
  { name: 'Test endpoint', path: '/api/test', capacity: 5, refillRate: 1 },
  { name: 'Login endpoint', path: '/api/login', capacity: 3, refillRate: 0.5 },
  { name: 'Data endpoint', path: '/api/data', capacity: 10, refillRate: 2 },
];

function statusFromState({ retryAfter, remaining, limit, lastResult }) {
  if (lastResult === 'idle') return 'idle';
  if (retryAfter > 0) return 'limited';
  if (lastResult === 'error') return 'error';
  if (limit > 0 && remaining / limit <= 0.3) return 'warning';
  return 'healthy';
}

const STATUS_STYLES = {
  healthy: { label: 'healthy', dot: 'bg-teal-400', text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
  warning: { label: 'near limit', dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  limited: { label: 'rate limited', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  error: { label: 'error', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  idle: { label: 'idle', dot: 'bg-zinc-500', text: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' },
};

const SUMMARY_ORDER = ['healthy', 'warning', 'limited', 'error'];
const SUMMARY_LABELS = { healthy: 'healthy', warning: 'near limit', limited: 'limited', error: 'error' };

function TokenDots({ capacity, remaining, statusKey }) {
  const style = STATUS_STYLES[statusKey] || STATUS_STYLES.idle;
  return (
    <div className="flex flex-wrap gap-[3px]">
      {Array.from({ length: capacity }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-[2px] transition-colors duration-300 ${
            i < remaining ? style.dot : 'bg-[#1E252B]'
          }`}
        />
      ))}
    </div>
  );
}

function EndpointCard({ endpoint, onStatusChange }) {
  const [remaining, setRemaining] = useState(endpoint.capacity);
  const [limit, setLimit] = useState(endpoint.capacity);
  const [retryAfter, setRetryAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState('idle');
  const [lastLatency, setLastLatency] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastCalledAt, setLastCalledAt] = useState(null);

  // Countdown for retryAfter
  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => {
      setRetryAfter((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const status = statusFromState({ retryAfter, remaining, limit, lastResult });

  useEffect(() => {
    onStatusChange(endpoint.path, status);
  }, [status, endpoint.path, onStatusChange]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(endpoint.path);
      const latency = Math.round(performance.now() - start);

      // Read rate-limit headers from backend
      const remainingHeader = res.headers.get('X-RateLimit-Remaining');
      const limitHeader = res.headers.get('X-RateLimit-Limit');
      const retryAfterHeader = res.headers.get('Retry-After');

      if (remainingHeader !== null) setRemaining(Number(remainingHeader));
      if (limitHeader !== null) setLimit(Number(limitHeader));

      if (res.status === 429) {
        const retrySeconds = retryAfterHeader ? Number(retryAfterHeader) : 0;
        setRetryAfter(retrySeconds);
        setLastResult('limited');
      } else if (!res.ok) {
        setLastResult('error');
      } else {
        setRetryAfter(0);
        setLastResult('success');
      }

      setLastLatency(latency);
    } catch (err) {
      console.error('Fetch error:', err);
      setLastResult('error');
      setLastLatency(null);
    } finally {
      setRequestCount((c) => c + 1);
      setLastCalledAt(new Date());
      setLoading(false);
    }
  }, [endpoint.path]);

  const style = STATUS_STYLES[status];

  return (
    <div className="bg-[#12161A] border border-[#1E252B] rounded-xl p-5 w-full max-w-[300px] flex flex-col">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium text-[#E6EDF3] truncate">{endpoint.name}</h2>
          <p className="font-mono text-[11px] text-[#6E7681] mt-0.5">{endpoint.path}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mt-4 mb-3">
        <span className="font-mono text-[30px] font-medium text-[#E6EDF3] leading-none">{remaining}</span>
        <span className="font-mono text-[14px] text-[#6E7681]">/ {limit} tokens</span>
      </div>

      <TokenDots capacity={limit} remaining={remaining} statusKey={status} />

      <div className="flex items-center justify-between font-mono text-[11px] text-[#6E7681] border-t border-[#1E252B] mt-4 pt-3">
        <span>refill {endpoint.refillRate}/s</span>
        <span>{retryAfter > 0 ? `reset in ${retryAfter}s` : lastLatency !== null ? `${lastLatency}ms` : '—'}</span>
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-[#6E7681] mb-4 mt-1">
        <span>{requestCount} sent this session</span>
        <span>{lastCalledAt ? lastCalledAt.toLocaleTimeString() : 'never called'}</span>
      </div>

      {status === 'limited' && (
        <p className="text-[12px] text-red-400 mb-3">
          Too many requests. Bucket refills in {retryAfter}s.
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={loading || retryAfter > 0}
        className={`mt-auto w-full py-2.5 rounded-lg text-[13px] font-medium transition-colors
          ${retryAfter > 0
            ? 'bg-[#1E252B] text-[#6E7681] cursor-not-allowed'
            : loading
            ? 'bg-[#1E252B] text-[#6E7681] cursor-wait'
            : 'bg-[#E6EDF3] text-[#0A0D10] hover:bg-white'}
        `}
      >
        {loading ? 'Sending…' : retryAfter > 0 ? `Locked ${retryAfter}s` : 'Send request'}
      </button>
    </div>
  );
}

export default function App() {
  const [statuses, setStatuses] = useState({});

  const handleStatusChange = useCallback((path, status) => {
    setStatuses((prev) => (prev[path] === status ? prev : { ...prev, [path]: status }));
  }, []);

  const counts = ENDPOINTS.reduce((acc, ep) => {
    const s = statuses[ep.path] || 'idle';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0A0D10] px-4 py-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <div>
            <h1 className="text-[20px] font-medium text-[#E6EDF3]">Rate limiter dashboard</h1>
            <p className="text-[13px] text-[#6E7681] mt-1">Live token bucket state across {ENDPOINTS.length} endpoints</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {SUMMARY_ORDER.filter((k) => counts[k]).map((k) => {
              const style = STATUS_STYLES[k];
              return (
                <span key={k} className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {counts[k]} {SUMMARY_LABELS[k]}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-5 mt-8">
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.path} endpoint={ep} onStatusChange={handleStatusChange} />
          ))}
        </div>
      </div>
    </div>
  );
}