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
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-44 hero-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-eyebrow text-secondary font-medium mb-1.5">RateGuard</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Subscription plans</h1>
          <p className="text-sm text-muted mt-1.5">
            Choose a plan to scale your project quotas and burst token capacities.
          </p>
        </div>

        {error && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3.5 py-2.5 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-elevated border border-border-subtle hover:border-border-subtle/80 transition-colors rounded-md p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-primary">Free</h2>
                {currentPlan === 'FREE' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-chip text-accent-teal border border-border-subtle">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-light text-primary">₹0</span>
                <span className="text-xs text-muted">/mo</span>
              </div>
              <p className="text-xs text-secondary mt-1">Hobby & basic integrations</p>

              <div className="mt-6 pt-5 border-t border-border-subtle space-y-3 text-xs text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 3 Projects max
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 10 tokens capacity burst
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 1 token/sec refill
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> Standard analytics
                </div>
              </div>
            </div>

            <button
              disabled
              className="mt-8 w-full py-2 rounded-sm text-xs font-medium bg-base border border-border-subtle text-muted cursor-not-allowed"
            >
              {currentPlan === 'FREE' ? 'Active Plan' : 'Free tier'}
            </button>
          </div>

          {/* Gold */}
          <div className="bg-elevated border border-accent-teal/50 rounded-md p-6 flex flex-col justify-between relative shadow-xs">
            <span className="absolute -top-2.5 right-4 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm bg-btn-light-bg text-btn-light-text shadow-xs">
              POPULAR
            </span>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-primary">Gold</h2>
                {currentPlan === 'GOLD' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-chip text-accent-teal border border-border-subtle">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-light text-primary">₹499</span>
                <span className="text-xs text-muted">/mo</span>
              </div>
              <p className="text-xs text-secondary mt-1">For growing apps & teams</p>

              <div className="mt-6 pt-5 border-t border-border-subtle space-y-3 text-xs text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal font-semibold">✓</span> 10 Projects max
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal font-semibold">✓</span> 50 tokens capacity burst
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal font-semibold">✓</span> 5 tokens/sec refill
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal font-semibold">✓</span> Priority email support
                </div>
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('GOLD')}
              disabled={loading || currentPlan === 'GOLD'}
              className="mt-8 w-full py-2 rounded-sm text-xs font-medium bg-btn-light-bg hover:bg-white text-btn-light-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal shadow-xs"
            >
              {currentPlan === 'GOLD' ? 'Active Plan' : loading ? 'Processing…' : 'Upgrade to Gold'}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-elevated border border-border-subtle hover:border-border-subtle/80 transition-colors rounded-md p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-primary">Pro</h2>
                {currentPlan === 'PRO' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-chip text-accent-teal border border-border-subtle">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-light text-primary">₹1,499</span>
                <span className="text-xs text-muted">/mo</span>
              </div>
              <p className="text-xs text-secondary mt-1">High-frequency microservices</p>

              <div className="mt-6 pt-5 border-t border-border-subtle space-y-3 text-xs text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 25 Projects max
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 200 tokens capacity burst
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 20 tokens/sec refill
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-accent-teal">✓</span> 24/7 Engineering support
                </div>
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('PRO')}
              disabled={loading || currentPlan === 'PRO'}
              className="mt-8 w-full py-2 rounded-sm text-xs font-medium bg-chip hover:bg-chip/80 text-primary border border-border-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal"
            >
              {currentPlan === 'PRO' ? 'Active Plan' : loading ? 'Processing…' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}