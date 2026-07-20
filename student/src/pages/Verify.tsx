import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, User, Fingerprint, Calendar, ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { apiPost } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }
const fieldClass = 'flex items-center gap-3 rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] p-4 transition-all focus-within:border-[#1B5E3F] focus-within:bg-white'

const Verify: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedSchool = location.state?.school

  const [fullName, setFullName] = useState('')
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [dob, setDob] = useState('')

  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otp, setOtp] = useState('')
  const [last4, setLast4] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!selectedSchool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F0] p-6">
        <div className="max-w-sm rounded-2xl border border-[#EAE1CC] bg-white p-5 sm:p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-[#A63A2E]" />
          <h2 className="text-2xl" style={heading}>No school selected</h2>
          <p className="mt-2 text-[#5C6B62]">Please select a school first to proceed with verification.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-[10px] bg-[#1B5E3F] py-3.5 font-medium text-[#FBF8F0] hover:bg-[#134430]"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await apiPost('/students/verify', {
        schoolId: selectedSchool.schoolId,
        fullName,
        admissionNumber,
        dob
      })

      if (res.success && res.data.requiresOTP) {
        setLast4(res.data.last4)
        setShowOtpScreen(true)
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await apiPost('/students/verify-otp', {
        schoolId: selectedSchool.schoolId,
        admissionNumber,
        otp
      })

      if (res.success) {
        localStorage.setItem('studentToken', res.data.token)
        localStorage.setItem('studentSchoolId', selectedSchool.schoolId)
        localStorage.setItem('studentName', res.data.fullName)
        localStorage.setItem('schoolName', selectedSchool.name)
        localStorage.setItem('studentAdmissionNumber', admissionNumber)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showOtpScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F0] p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#134430]">
              <Fingerprint className="h-8 w-8 text-[#FBF8F0]" />
            </div>
            <h1 className="text-3xl" style={heading}>Enter OTP</h1>
            <p className="mt-2 text-[16px] text-[#5C6B62]">Sent to number ending in <b>{last4}</b></p>
          </div>

          <div className="rounded-2xl border border-[#EAE1CC] bg-white p-5 sm:p-8">
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-[10px] border border-[#F8E8E5] bg-[#F8E8E5] p-4 text-[#A63A2E]">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-center font-mono text-xs text-[#5C6B62]">6-digit verification code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] p-5 text-center text-2xl tracking-[0.5em] outline-none transition-all focus:border-[#1B5E3F] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-[#1B5E3F] py-4 text-[16px] font-medium text-[#FBF8F0] transition-all hover:bg-[#134430] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify and sign in'}
              </button>

              <button
                type="button"
                onClick={() => setShowOtpScreen(false)}
                className="w-full text-sm text-[#5C6B62] transition-colors hover:text-[#134430]"
              >
                Change details
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F0] p-6">
      <div className="w-full max-w-xl">

        <button
          onClick={() => navigate(-1)}
          className="group mb-8 flex items-center gap-2 font-medium text-[#5C6B62] transition-colors hover:text-[#134430]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to school selection
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#134430]">
            <ShieldCheck className="h-8 w-8 text-[#FBF8F0]" />
          </div>
          <h1 className="text-3xl leading-tight" style={heading}>Student verification</h1>
          <p className="mt-2 text-[16px] text-[#5C6B62]">Verify your identity for <b>{selectedSchool.name}</b></p>
        </div>

        <div className="rounded-2xl border border-[#EAE1CC] bg-white p-5 sm:p-8">
          <form onSubmit={handleVerify} className="space-y-5">

            {error && (
              <div className="flex items-center gap-3 rounded-[10px] border border-[#F8E8E5] bg-[#F8E8E5] p-4 text-[#A63A2E]">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Student full name</label>
              <div className={fieldClass}>
                <User className="h-5 w-5 text-[#8B978F]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter name as per records"
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none placeholder:text-[#8B978F]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Admission number</label>
              <div className={fieldClass}>
                <Fingerprint className="h-5 w-5 text-[#8B978F]" />
                <input
                  type="text"
                  required
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="Enter admission number"
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none placeholder:text-[#8B978F]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Date of birth</label>
              <div className={fieldClass}>
                <Calendar className="h-5 w-5 text-[#8B978F]" />
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-[10px] bg-[#1B5E3F] py-4 text-[16px] font-medium text-[#FBF8F0] transition-all hover:bg-[#134430] disabled:bg-[#EAE1CC] disabled:text-[#8B978F]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify identity
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#8B978F]">
          Trouble verifying? Contact your school administrator.
        </p>
      </div>
    </div>
  )
}

export default Verify
