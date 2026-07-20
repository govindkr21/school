import React, { useState, useEffect } from 'react'
import { apiGet, apiPut, apiPost } from '../lib/api'
import { getAdminProfile, clearAdminSession, setAdminProfile } from '../lib/session'
import { 
  User, 
  Lock, 
  AlertTriangle, 
  LogOut, 
  Camera, 
  Save, 
  Mail, 
  ShieldCheck,
  Building,
  Phone,
  Loader2
} from 'lucide-react'

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'suspension' | 'logout'>('profile')
  const [profile, setProfile] = useState<any>(getAdminProfile())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    adminName: '',
    email: '',
    contactNumber: '',
    profilePic: ''
  })

  // Password Flow state
  const [passStep, setPassStep] = useState<'email' | 'otp' | 'new'>('email')
  const [passForm, setPassForm] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Suspension state
  const [suspensionReason, setSuspensionReason] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await apiGet('/admin/me')
      if (res.success) {
        setProfile(res.data)
        setAdminProfile(res.data)
        setProfileForm({
          adminName: res.data.adminName || '',
          email: res.data.email || '',
          contactNumber: res.data.contactNumber || '',
          profilePic: res.data.profilePic || ''
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiPut('/admin/profile', {
        name: profileForm.adminName,
        email: profileForm.email,
        contactNumber: profileForm.contactNumber,
        profilePic: profileForm.profilePic
      })
      if (res.success) {
        setSuccess('Profile updated successfully')
        setProfile(res.data)
        setAdminProfile(res.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordResetFlow = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (passStep === 'email') {
      if (passForm.email !== profile?.email) {
        setError('Email does not match your account')
        return
      }
      setLoading(true)
      setTimeout(() => {
        setPassStep('otp')
        setLoading(false)
        setSuccess('OTP sent to your email (Simulated)')
      }, 1000)
    } else if (passStep === 'otp') {
      if (passForm.otp === '123456') { 
        setPassStep('new')
      } else {
        setError('Invalid OTP')
      }
    } else if (passStep === 'new') {
      if (passForm.newPassword !== passForm.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      setLoading(true)
      try {
        const res = await apiPost('/admin/change-password', { newPassword: passForm.newPassword })
        if (res.success) {
          setSuccess('Password changed successfully')
          setPassStep('email')
          setPassForm({ email: '', otp: '', newPassword: '', confirmPassword: '' })
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSuspension = async () => {
    if (!suspensionReason) return
    setLoading(true)
    try {
      const res = await apiPost('/admin/request-suspension', { reason: suspensionReason })
      if (res.success) {
        setSuccess('Suspension request submitted to Super Admin')
        setSuspensionReason('')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAdminSession()
    window.location.href = '/login'
  }

  const cards = [
    { id: 'profile', title: 'Update Profile', icon: User, color: 'text-[#134430]', bg: 'bg-[#E7F1E9]' },
    { id: 'password', title: 'Change Password', icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'suspension', title: 'Account Suspension', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'logout', title: 'Logout Account', icon: LogOut, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your SCTS account and security preferences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => {
              setActiveTab(card.id as any)
              setError(null)
              setSuccess(null)
            }}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
              activeTab === card.id 
              ? 'border-[#1B5E3F] bg-white shadow-lg scale-105'
              : 'border-transparent bg-white hover:border-gray-200 hover:shadow-md'
            }`}
          >
            <div className={`p-4 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon className="w-8 h-8" />
            </div>
            <span className="font-semibold text-gray-700">{card.title}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-700">
                <Building className="w-5 h-5 text-gray-400" />
                Organization Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">School Name</label>
                  <p className="mt-1 font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.orgName}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">School ID (System ID)</label>
                  <p className="mt-1 font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.schoolId}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">State</label>
                    <p className="mt-1 font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.state}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">District</label>
                    <p className="mt-1 font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.district}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#E7F1E9] p-6 rounded-2xl border border-[#BFE0CC] relative overflow-hidden">
               <ShieldCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-[#BFE0CC] opacity-50" />
               <p className="text-[#134430] font-semibold relative z-10">Locked Fields</p>
               <p className="text-[#1B5E3F] text-sm mt-1 relative z-10">Organization and location data is fixed by SCTS HQ. Contact support to change these.</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 text-center md:text-left">
                <div className="relative group">
                   <div className="w-32 h-32 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-md">
                      {profileForm.profilePic ? (
                        <img src={profileForm.profilePic} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                   </div>
                   <button className="absolute -bottom-2 -right-2 p-2 bg-[#134430] text-white rounded-xl shadow-lg hover:bg-[#0F3626] transition-colors">
                      <Camera className="w-5 h-5" />
                   </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
                  <p className="text-gray-500 text-sm mt-1">Update your administrative contact details and photo.</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Name</label>
                      <input 
                        type="text" 
                        value={profileForm.adminName}
                        onChange={(e) => setProfileForm({...profileForm, adminName: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="email" 
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                          placeholder="admin@school.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          value={profileForm.contactNumber}
                          onChange={(e) => setProfileForm({...profileForm, contactNumber: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                          placeholder="+91 00000 00000"
                        />
                      </div>
                    </div>
                 </div>

                 <div className="flex justify-end pt-4 border-t border-gray-50">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#134430] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0F3626] disabled:opacity-50 transition-all shadow-lg shadow-[#BFE0CC]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Changes
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 mb-8">Secure your account by updating your login credentials.</p>

            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0"></div>
                {['email', 'otp', 'new'].map((s, i) => (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      passStep === s ? 'bg-purple-600 text-white' : i < ['email', 'otp', 'new'].indexOf(passStep) ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-400'
                    }`}>
                      {i < ['email', 'otp', 'new'].indexOf(passStep) ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-tighter ${passStep === s ? 'text-purple-600' : 'text-gray-400'}`}>
                      {s.replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </div>
                ))}
            </div>

            <form onSubmit={handlePasswordResetFlow} className="space-y-6 text-left">
              {passStep === 'email' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Account Email</label>
                  <input 
                    type="email" 
                    value={passForm.email}
                    onChange={(e) => setPassForm({...passForm, email: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    placeholder="Enter your registered email"
                    required
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Code"}
                  </button>
                </div>
              )}

              {passStep === 'otp' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Enter 6-Digit OTP</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={passForm.otp}
                    onChange={(e) => setPassForm({...passForm, otp: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-center text-2xl tracking-[12px] font-mono"
                    placeholder="000000"
                    required
                  />
                  <div className="mt-4 text-xs text-gray-500">Demo? Try 123456</div>
                  <button 
                    type="submit"
                    className="w-full mt-6 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg"
                  >
                    Verify OTP
                  </button>
                </div>
              )}

              {passStep === 'new' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                   <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input 
                      type="password" 
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === 'suspension' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Account Suspension</h2>
             <p className="text-gray-500 mb-6">If you plan to discontinue services or need to pause operations, explain your reason below. This request will be forwarded to the District Administrator.</p>
             
             <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Reason for Suspension Request</label>
                <textarea 
                  rows={5}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Please provide details (e.g., Transfer of management, Seasonal closure, etc.)"
                ></textarea>
                
                <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-700 flex gap-2 items-start">
                   <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                   <p>Note: Your dashboard will remain active until the Super Admin approves the request. You can cancel this request anytime before approval.</p>
                </div>

                <button 
                  onClick={handleSuspension}
                  disabled={loading || !suspensionReason}
                  className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Request to HQ"}
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'logout' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <LogOut className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Terminating Session?</h2>
              <p className="text-gray-500 mb-8">You are about to sign out of the SCTS Administrative Terminal. You will need to login again to access features.</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setActiveTab('profile')}
                  className="p-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                  onClick={handleLogout}
                  className="p-4 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                 >
                    Logout
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default Settings
