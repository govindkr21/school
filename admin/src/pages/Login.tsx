import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { setAdminSession } from '../lib/session'
import DemoModal from '../components/DemoModal'

const heading = { fontFamily: "'Vesper Libre', serif" }
const inputClass = 'w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none transition focus:border-[#1B5E3F]'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  const captchaChallenge = useMemo(() => {
    const first = 3 + Math.floor(Math.random() * 7)
    const second = 1 + Math.floor(Math.random() * 8)
    return { first, second, answer: String(first + second) }
  }, [])

  useEffect(() => {
    setCaptchaValue(`${captchaChallenge.first} + ${captchaChallenge.second} =`)
    setCaptchaAnswer(captchaChallenge.answer)
  }, [captchaChallenge])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (captchaInput.trim() !== captchaAnswer) {
      setError('Captcha check failed')
      return
    }

    setLoading(true)
    try {
      const response = await apiPost('/auth/admin/login', { email, password })
      const token = response?.data?.token
      if (token) {
        setAdminSession(token, response?.data?.profile || { email })
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Unable to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] lg:grid lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#134430] p-12 text-[#FBF8F0] lg:flex">
        <Link to="/" className="inline-flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 6.2C10.4 4.9 8.4 4.4 4 4.6v13c4.4-.2 6.4.3 8 1.6 1.6-1.3 3.6-1.8 8-1.6v-13c-4.4-.2-6.4.3-8 1.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 6.2v12.9" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="text-lg" style={heading}>Madnir</span>
        </Link>

        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#2F7B55]">Administration</div>
          <h1 className="mt-6 text-5xl leading-tight" style={heading}>
            Every complaint gets a number, an owner, and a deadline.
          </h1>
          <p className="mt-6 max-w-md text-[16px] text-[#FBF8F0]/70">
            Sign in to review open cases, assign them to staff, and close them on record.
          </p>
        </div>

        <div>
          <div className="border-t border-[#FBF8F0]/10 pt-8">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#FBF8F0]/40">Median close</div>
                <div className="mt-2 text-2xl" style={heading}>3.2 days</div>
              </div>
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#FBF8F0]/40">Open cases</div>
                <div className="mt-2 text-2xl" style={heading}>18</div>
              </div>
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#FBF8F0]/40">Escalated</div>
                <div className="mt-2 text-2xl" style={heading}>2</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="mt-8 rounded-xl bg-[#FBF8F0] px-6 py-3 text-sm font-semibold text-[#134430] transition hover:bg-white"
          >
            Request for demo
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Welcome back</div>
            <h2 className="mt-3 text-3xl" style={heading}>Admin sign in</h2>
            <p className="mt-2 text-[16px] text-[#5C6B62]">Use the email and password registered to your school.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Email address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} placeholder="principal@school.edu.in" />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className={inputClass} placeholder="Enter password" />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Security check</label>
              <div className="flex items-center gap-3">
                <div className="flex h-[44px] items-center rounded-[10px] border border-[#DED2B6] bg-[#E7F1E9] px-4 font-mono text-[16px] text-[#1B5E3F]">
                  {captchaValue}
                </div>
                <input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="w-24 rounded-[10px] border border-[#DED2B6] bg-white px-3 py-3 text-center text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]" placeholder="?" />
              </div>
              <p className="mt-2 text-xs text-[#8B978F]">Solve the sum to confirm you are a person.</p>
            </div>

            {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}

            <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-[#5C6B62] hover:text-[#134430]">Forgot password</Link>
            <Link to="/signup" className="font-medium text-[#1B5E3F] hover:text-[#134430]">Register your school</Link>
          </div>
        </div>
      </div>
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  )
}

export default Login
