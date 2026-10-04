import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadRazorpayScript } from '../lib/loadRazorpay'
import { apiUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function PricingPage() {
  const { token, user, login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPlan = user?.plan || 'FREE'

  const handleUpgrade = async (selectedPlan) => {
    if (!token) {
      setError('Please log in to upgrade your subscription.')
      return
    }

    setError('')
    setLoading(true)

    const resLoaded = await loadRazorpayScript()
    if (!resLoaded) {
      setError('Razorpay SDK failed to load. Please check your internet connection.')
      setLoading(false)
      return
    }

    try {
      const orderRes = await fetch(apiUrl('/api/payments/create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const orderData = await orderRes.json().catch(() => ({}))
      if (!orderRes.ok) {
        throw new Error(orderData.error || `Server returned error (${orderRes.status})`)
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RateGuard SaaS',
        description: `Upgrade to ${selectedPlan} Plan`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(apiUrl('/api/payments/verify-payment'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
              }),
            })

            const verifyData = await verifyRes.json().catch(() => ({}))
            if (verifyData.success) {
              login(token, verifyData.user)
              navigate('/projects')
            } else {
              setError(verifyData.error || 'Payment verification failed.')
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr)
            setError('Error verifying payment with server.')
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#5eead4',
        },
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (err) {
      console.error('Payment initiation error:', err)
      setError(err.message || 'Error initiating payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-slate-100">Subscription plans</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Choose a plan to scale your project quotas and burst token capacities.
        </p>
      </div>

      {error && (
        <div className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free */}
        <div className="bg-[#12161C] border border-[#1C2230] hover:border-teal-300/30 transition-colors rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-100">Free</h2>
              {currentPlan === 'FREE' && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-teal-300/10 text-teal-300 border border-teal-300/20">
                  Current
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[28px] font-bold text-slate-100 font-mono">₹0</span>
              <span className="text-[12px] text-slate-500">/mo</span>
            </div>
            <p className="text-[12px] text-slate-500 mt-1">Hobby & basic integrations</p>

            <div className="mt-6 pt-5 border-t border-[#1C2230] space-y-2.5 font-mono text-[12px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 3 Projects max
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 10 tokens capacity burst
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 1 token/sec refill
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> Standard analytics
              </div>
            </div>
          </div>

          <button
            disabled
            className="mt-6 w-full py-2.5 rounded-xl text-[13px] font-medium bg-[#0B0E14] border border-[#1C2230] text-slate-500 cursor-not-allowed"
          >
            {currentPlan === 'FREE' ? 'Active Plan' : 'Free tier'}
          </button>
        </div>

        {/* Gold */}
        <div className="bg-[#12161C] border-2 border-teal-300/40 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg shadow-teal-500/5">
          <span className="absolute -top-3 right-5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-300 text-[#0B0E14]">
            POPULAR
          </span>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-teal-300">Gold</h2>
              {currentPlan === 'GOLD' && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-teal-300/10 text-teal-300 border border-teal-300/20">
                  Current
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[28px] font-bold text-slate-100 font-mono">₹499</span>
              <span className="text-[12px] text-slate-500">/mo</span>
            </div>
            <p className="text-[12px] text-slate-500 mt-1">For growing apps & teams</p>

            <div className="mt-6 pt-5 border-t border-[#1C2230] space-y-2.5 font-mono text-[12px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-teal-300 font-bold">✓</span> 10 Projects max
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300 font-bold">✓</span> 50 tokens capacity burst
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300 font-bold">✓</span> 5 tokens/sec refill
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300 font-bold">✓</span> Priority email support
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('GOLD')}
            disabled={loading || currentPlan === 'GOLD'}
            className="mt-6 w-full py-2.5 rounded-xl text-[13px] font-semibold bg-teal-300 hover:bg-teal-200 text-[#0B0E14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPlan === 'GOLD' ? 'Active Plan' : loading ? 'Processing…' : 'Upgrade to Gold'}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-[#12161C] border border-[#1C2230] hover:border-teal-300/30 transition-colors rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-100">Pro</h2>
              {currentPlan === 'PRO' && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-teal-300/10 text-teal-300 border border-teal-300/20">
                  Current
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[28px] font-bold text-slate-100 font-mono">₹1,499</span>
              <span className="text-[12px] text-slate-500">/mo</span>
            </div>
            <p className="text-[12px] text-slate-500 mt-1">High-frequency microservices</p>

            <div className="mt-6 pt-5 border-t border-[#1C2230] space-y-2.5 font-mono text-[12px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 25 Projects max
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 200 tokens capacity burst
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 20 tokens/sec refill
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-300">✓</span> 24/7 Engineering support
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('PRO')}
            disabled={loading || currentPlan === 'PRO'}
            className="mt-6 w-full py-2.5 rounded-xl text-[13px] font-semibold bg-teal-300/10 hover:bg-teal-300/20 text-teal-300 border border-teal-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPlan === 'PRO' ? 'Active Plan' : loading ? 'Processing…' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

     
    </div>
  )
}