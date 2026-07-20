import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }
const inputClass = 'w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]'
const RESEND_COOLDOWN_SECONDS = 30

type Step = 'request' | 'otp' | 'reset' | 'done'

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiPost('/auth/admin/forgot-password', { email })
      setOtp(res?.data?.debugOtp || '')
      setStep('otp')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err: any) {
      setError(err.message || 'Unable to send reset code')
      if (typeof err.data?.retryAfterSeconds === 'number') setCooldown(err.data.retryAfterSeconds)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setLoading(true)
    try {
      await apiPost('/auth/admin/forgot-password', { email })
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setAttemptsRemaining(null)
    } catch (err: any) {
      setError(err.message || 'Unable to resend code')
      if (typeof err.data?.retryAfterSeconds === 'number') setCooldown(err.data.retryAfterSeconds)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiPost('/auth/admin/forgot-password/verify-otp', { email, otp })
      setResetToken(res?.data?.resetToken || '')
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Invalid code')
      if (typeof err.data?.attemptsRemaining === 'number') setAttemptsRemaining(err.data.attemptsRemaining)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await apiPost('/auth/admin/forgot-password/reset', { resetToken, newPassword })
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] lg:grid lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-[#134430] p-12 text-[#FBF8F0] lg:flex">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#2F7B55]">Password recovery</div>
        <h1 className="mt-4 text-4xl leading-tight" style={heading}>Get back into your admin account.</h1>
        <p className="mt-5 max-w-md text-[16px] text-[#FBF8F0]/70">
          We'll email a verification code to confirm it's really you before letting you set a new password.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {step === 'request' && (
            <>
              <h2 className="text-3xl" style={heading}>Reset password</h2>
              <p className="mt-2 text-[16px] text-[#5C6B62]">Enter the registered email address.</p>

              <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={inputClass} placeholder="principal@school.edu.in" />
                {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}
                <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70">
                  {loading ? 'Sending...' : 'Send reset code'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 className="text-3xl" style={heading}>Enter reset code</h2>
              <p className="mt-2 text-[16px] text-[#5C6B62]">If {email} is registered, a 6-digit code was sent to it. It expires in 5 minutes.</p>

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-[#1B5E3F]"
                  placeholder="------"
                />
                {error && (
                  <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">
                    {error}
                    {attemptsRemaining !== null && attemptsRemaining > 0 && ` (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining)`}
                  </div>
                )}
                <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70">
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
              </form>

              <button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="mt-4 text-sm font-medium text-[#1B5E3F] hover:text-[#134430] disabled:cursor-not-allowed disabled:text-[#8B978F]"
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
              </button>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="text-3xl" style={heading}>Set new password</h2>
              <p className="mt-2 text-[16px] text-[#5C6B62]">Choose a new password for your account.</p>

              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required className={inputClass} placeholder="New password (min. 8 characters)" />
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required className={inputClass} placeholder="Confirm new password" />
                {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}
                <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70">
                  {loading ? 'Saving...' : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <>
              <h2 className="text-3xl" style={heading}>Password updated</h2>
              <p className="mt-2 text-[16px] text-[#5C6B62]">You can now sign in with your new password.</p>
              <Link to="/login" className="mt-6 inline-block w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-center text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430]">
                Back to sign in
              </Link>
            </>
          )}

          {step !== 'done' && (
            <div className="mt-4 text-sm">
              <Link to="/login" className="font-medium text-[#1B5E3F] hover:text-[#134430]">Back to sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
