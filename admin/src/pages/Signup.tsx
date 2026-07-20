import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { STATES_DISTRICTS } from '../lib/states'
import { ChevronDown, Search, MapPin } from 'lucide-react'
import RegistrationRail from '../components/RegistrationRail'

const heading = { fontFamily: "'Vesper Libre', serif" }
const inputClass = 'w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none transition focus:border-[#1B5E3F]'

type FormState = {
  orgName: string
  address: string
  email: string
  phone: string
  orgCode: string
  state: string
  district: string
  orgType: 'PVT' | 'PUBLIC'
  password: string
}

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpPreview, setOtpPreview] = useState('')
  const [form, setForm] = useState<FormState>({
    orgName: '', address: '', email: '', phone: '', orgCode: '', state: '', district: '', orgType: 'PVT', password: ''
  })

  const [stateSearch, setStateSearch] = useState('')
  const [districtSearch, setDistrictSearch] = useState('')
  const [showStateList, setShowStateList] = useState(false)
  const [showDistrictList, setShowDistrictList] = useState(false)

  const stateRef = useRef<HTMLDivElement>(null)
  const districtRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) setShowStateList(false)
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) setShowDistrictList(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const filteredStates = Object.keys(STATES_DISTRICTS).filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const filteredDistricts = (form.state ? STATES_DISTRICTS[form.state] || [] : []).filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await apiPost('/auth/admin/register-request', form)
      sessionStorage.setItem('pending_admin_signup', JSON.stringify({ email: form.email, orgName: form.orgName }))
      if (response?.data?.debugOtp) {
        setOtpPreview(response.data.debugOtp)
      }
      navigate('/verify-otp', { state: { email: form.email, orgName: form.orgName, debugOtp: response?.data?.debugOtp } })
    } catch (err: any) {
      setError(err.message || 'Unable to start registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] lg:grid lg:grid-cols-[1fr_1.4fr]">
      <RegistrationRail
        step={1}
        title={['Open a register', 'for your school.']}
        description={['One organisation per email. You will verify the address, pick a plan, and the admin account is created on the first successful payment.']}
      />

      <div className="p-6 md:p-10 lg:p-14">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Step 1 of 3</div>
            <h2 className="mt-3 text-3xl" style={heading}>Organisation details</h2>
          </div>
          <Link className="text-sm font-medium text-[#1B5E3F] hover:text-[#134430]" to="/login">Back to sign in</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Identity</div>
            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Name of the organisation</label>
              <input className={inputClass} value={form.orgName} onChange={(e) => updateField('orgName', e.target.value)} placeholder="Doon Public School" />
            </div>
            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Address</label>
              <textarea className={inputClass} value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Street, area, city, PIN" rows={3} />
            </div>
          </div>

          <div className="border-t border-[#EAE1CC]" />

          <div className="space-y-4">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Contact</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Email</label>
                <input className={inputClass} value={form.email} onChange={(e) => updateField('email', e.target.value)} type="email" placeholder="office@school.edu.in" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Phone number</label>
                <input className={inputClass} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          <div className="border-t border-[#EAE1CC]" />

          <div className="space-y-4">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Classification</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">School or org code</label>
                <input className={inputClass} value={form.orgCode} onChange={(e) => updateField('orgCode', e.target.value)} placeholder="HP-SML-01923" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Sector</label>
                <select className={inputClass} value={form.orgType} onChange={(e) => updateField('orgType', e.target.value as FormState['orgType'])}>
                  <option value="PVT">Private sector</option>
                  <option value="PUBLIC">Public sector</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative" ref={stateRef}>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">State</label>
                <div
                  onClick={() => setShowStateList(!showStateList)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3"
                >
                  <span className={form.state ? 'text-[#14231B]' : 'text-[#8B978F]'}>{form.state || 'Select state'}</span>
                  <ChevronDown className={`h-4 w-4 text-[#8B978F] transition-transform ${showStateList ? 'rotate-180' : ''}`} />
                </div>

                {showStateList && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[10px] border border-[#EAE1CC] bg-white shadow-xl">
                    <div className="flex items-center gap-2 border-b border-[#EAE1CC] bg-[#FBF8F0] p-3">
                      <Search className="h-4 w-4 text-[#8B978F]" />
                      <input autoFocus placeholder="Search state..." className="w-full bg-transparent text-sm font-medium outline-none" value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredStates.map((s) => (
                        <div
                          key={s}
                          onClick={() => {
                            updateField('state', s)
                            updateField('district', '')
                            setShowStateList(false)
                          }}
                          className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium hover:bg-[#FBF8F0]"
                        >
                          {s}
                          {form.state === s && <MapPin className="h-4 w-4 text-[#1B5E3F]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={districtRef}>
                <label className="mb-2 block font-mono text-xs text-[#5C6B62]">District</label>
                <div
                  onClick={() => form.state && setShowDistrictList(!showDistrictList)}
                  className={`flex w-full items-center justify-between rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 ${!form.state ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <span className={form.district ? 'text-[#14231B]' : 'text-[#8B978F]'}>{form.district || 'Select district'}</span>
                  <ChevronDown className={`h-4 w-4 text-[#8B978F] transition-transform ${showDistrictList ? 'rotate-180' : ''}`} />
                </div>

                {showDistrictList && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[10px] border border-[#EAE1CC] bg-white shadow-xl">
                    <div className="flex items-center gap-2 border-b border-[#EAE1CC] bg-[#FBF8F0] p-3">
                      <Search className="h-4 w-4 text-[#8B978F]" />
                      <input autoFocus placeholder="Search district..." className="w-full bg-transparent text-sm font-medium outline-none" value={districtSearch} onChange={(e) => setDistrictSearch(e.target.value)} />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredDistricts.map((d) => (
                        <div
                          key={d}
                          onClick={() => {
                            updateField('district', d)
                            setShowDistrictList(false)
                          }}
                          className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium hover:bg-[#FBF8F0]"
                        >
                          {d}
                          {form.district === d && <MapPin className="h-4 w-4 text-[#1B5E3F]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Create password</label>
              <input className={inputClass} value={form.password} onChange={(e) => updateField('password', e.target.value)} type="password" placeholder="At least 8 characters" />
            </div>
          </div>

          {otpPreview && (
            <div className="rounded-[10px] border border-[#DED2B6] bg-[#E7F1E9] px-4 py-3 text-sm text-[#1B5E3F]">
              Demo OTP: {otpPreview}
            </div>
          )}

          {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}

          <button disabled={loading} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? 'Sending OTP...' : 'Continue to email verification'}
          </button>
        </form>

        <p className="mt-5 text-sm text-[#5C6B62]">
          Already registered? <Link className="font-medium text-[#1B5E3F] hover:text-[#134430]" to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
