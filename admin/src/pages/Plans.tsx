import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { setAdminSession } from '../lib/session'
import RegistrationRail from '../components/RegistrationRail'
import BrandLogo from '../components/BrandLogo'

const heading = { fontFamily: "'Vesper Libre', serif" }

declare global {
  interface Window {
    Razorpay?: any
  }
}

const PLAN_LIST = [
  { id: 'plan_12', title: '12 months', price: 5999, note: 'Best for one-year onboarding' },
  { id: 'plan_24', title: '24 months', price: 10999, note: 'Balanced growth plan' },
  { id: 'plan_36', title: '36 months', price: 20999, note: 'Long-term school network plan' }
]

async function loadRazorpayScript() {
  if (window.Razorpay) return true
  return await new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const Plans: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { email?: string; orgName?: string } }
  const email = location.state?.email || JSON.parse(sessionStorage.getItem('pending_admin_signup') || '{}')?.email || ''
  const orgName = location.state?.orgName || JSON.parse(sessionStorage.getItem('pending_admin_signup') || '{}')?.orgName || ''
  const [loadingPlan, setLoadingPlan] = useState('')
  const [message, setMessage] = useState('')

  async function selectPlan(planId: string) {
    setMessage('')
    setLoadingPlan(planId)
    try {
      const response = await apiPost('/payments/razorpay/order', { email, planId })
      const order = response?.order
      const demoMode = Boolean(response?.demoMode)
      const hasScript = await loadRazorpayScript()

      if (!demoMode && hasScript && window.Razorpay) {
        const options = {
          key: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: orgName || 'Organization subscription',
          description: `${planId} subscription`,
          order_id: order.id,
          handler: async (result: any) => {
            const confirmed = await apiPost('/payments/razorpay/confirm', {
              email,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_signature: result.razorpay_signature
            })
            if (confirmed?.data?.token) {
              setAdminSession(confirmed.data.token, confirmed?.data?.profile || { email, orgName, adminId: confirmed?.data?.adminId, schoolId: confirmed?.data?.schoolId })
            }
            sessionStorage.removeItem('pending_admin_signup')
            navigate('/dashboard', { replace: true })
          },
          prefill: { email }
        }
        const checkout = new window.Razorpay(options)
        checkout.open()
        return
      }

      const confirmed = await apiPost('/payments/razorpay/confirm', {
        email,
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_order_id: order.id,
        razorpay_signature: ''
      })
      if (confirmed?.data?.token) {
        setAdminSession(confirmed.data.token, confirmed?.data?.profile || { email, orgName, adminId: confirmed?.data?.adminId, schoolId: confirmed?.data?.schoolId })
      }
      sessionStorage.removeItem('pending_admin_signup')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setMessage(err.message || 'Unable to start payment')
    } finally {
      setLoadingPlan('')
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] lg:grid lg:grid-cols-[1fr_1.4fr]">
      <RegistrationRail
        step={3}
        title={['Choose a plan', 'and complete payment.']}
        description={['Select one of the available subscription plans. The admin account is created automatically once payment succeeds.']}
      />

      <div className="p-6 md:p-10 lg:p-14">
        <BrandLogo className="mb-6 h-20 w-20 lg:hidden" priority />
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Step 3 of 3</div>
            <h2 className="mt-3 text-3xl" style={heading}>Select your plan</h2>
          </div>
          <Link className="text-sm font-medium text-[#1B5E3F] hover:text-[#134430]" to="/signup">Edit signup</Link>
        </div>

        <div className="rounded-[10px] border border-[#EAE1CC] bg-white p-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Account</div>
          <div className="mt-1 text-[16px] text-[#14231B]">{orgName || 'Organisation'}</div>
          <div className="text-sm text-[#5C6B62]">{email || 'Email not set'}</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan.id)}
              disabled={Boolean(loadingPlan)}
              className="group rounded-2xl border border-[#EAE1CC] bg-white p-5 text-left transition hover:-translate-y-1 hover:border-[#1B5E3F] disabled:opacity-60"
            >
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">{plan.title}</div>
              <div className="mt-4 text-3xl" style={heading}>₹{plan.price.toLocaleString('en-IN')}</div>
              <p className="mt-3 text-sm text-[#5C6B62]">{plan.note}</p>
              <div className="mt-5 rounded-xl bg-[#1B5E3F] px-4 py-3 text-center text-sm font-semibold text-[#FBF8F0] group-hover:bg-[#134430]">
                {loadingPlan === plan.id ? 'Processing...' : 'Choose plan'}
              </div>
            </button>
          ))}
        </div>

        {message && <div className="mt-6 rounded-[10px] bg-[#FAF0DC] px-4 py-3 text-sm text-[#A9741A]">{message}</div>}

        <div className="mt-6 text-sm text-[#5C6B62]">
          After payment, the admin account is created automatically and you are signed in.
        </div>
      </div>
    </div>
  )
}

export default Plans
