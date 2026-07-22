import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import RegistrationRail from '../components/RegistrationRail'
import BrandLogo from '../components/BrandLogo'

const heading = { fontFamily: "'Vesper Libre', serif" }
const RESEND_COOLDOWN_SECONDS = 30

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { email?: string; orgName?: string; debugOtp?: string } }
  const email = location.state?.email || JSON.parse(sessionStorage.getItem('pending_admin_signup') || '{}')?.email || ''
  const orgName = location.state?.orgName || JSON.parse(sessionStorage.getItem('pending_admin_signup') || '{}')?.orgName || ''
  const debugOtp = location.state?.debugOtp || ''
  const [otp, setOtp] = useState(debugOtp)
  const [error, setError] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [resendExhausted, setResendExhausted] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiPost('/auth/admin/verify-otp', { email, otp })
      navigate('/plans', { state: { email, orgName } })
    } catch (err: any) {
      setError(err.message || 'Unable to verify OTP')
      if (typeof err.data?.attemptsRemaining === 'number') setAttemptsRemaining(err.data.attemptsRemaining)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendMessage('')
    setError('')
    setResending(true)
    try {
      const res = await apiPost('/auth/admin/register-request/resend', { email })
      setResendMessage(res?.message || 'A new code was sent')
      setAttemptsRemaining(null)
      setOtp(res?.data?.debugOtp || '')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err: any) {
      setError(err.message || 'Unable to resend code')
      if (typeof err.data?.retryAfterSeconds === 'number') setCooldown(err.data.retryAfterSeconds)
      if (err.message?.toLowerCase().includes('maximum resend')) setResendExhausted(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] lg:grid lg:grid-cols-[1fr_1.4fr]">
      <RegistrationRail
        step={2}
        title={['Verify the', 'organisation email.']}
        description={[`The 6-digit code is sent to ${email || 'the registered email address'}.`, 'It expires in 5 minutes.']}
      />

      <div className="flex items-center justify-center p-6 md:p-10 lg:p-14">
        <div className="w-full max-w-md">
          <BrandLogo className="mb-6 h-20 w-20 lg:hidden" priority />
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Step 2 of 3</div>
          <h2 className="mt-3 text-3xl" style={heading}>Enter OTP</h2>
          <p className="mt-2 text-[16px] text-[#5C6B62]">Continue to the plan selection once verification succeeds.</p>

          <div className="mt-6 rounded-[10px] border border-[#EAE1CC] bg-white p-4">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Organisation</div>
            <div className="mt-1 text-[16px] text-[#14231B]">{orgName || 'New organisation'}</div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input value={email} readOnly className="w-full rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] px-4 py-3 text-[16px] text-[#5C6B62]" />
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-[#1B5E3F]"
              placeholder="------"
              maxLength={6}
            />

            {error && (
              <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">
                {error}
                {attemptsRemaining !== null && attemptsRemaining > 0 && ` (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining)`}
              </div>
            )}
            {resendMessage && !error && (
              <div className="rounded-[10px] border border-[#DED2B6] bg-[#E7F1E9] px-4 py-3 text-sm text-[#1B5E3F]">{resendMessage}</div>
            )}

            <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-[#5C6B62]">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || resendExhausted}
              className="font-medium text-[#1B5E3F] hover:text-[#134430] disabled:cursor-not-allowed disabled:text-[#8B978F]"
            >
              {resendExhausted ? 'Resend limit reached' : cooldown > 0 ? `Resend code (${cooldown}s)` : resending ? 'Sending...' : 'Resend code'}
            </button>
            <Link to="/signup" className="font-medium text-[#1B5E3F] hover:text-[#134430]">Start over</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOtp
