import React, { useState, useEffect } from 'react'
import { apiGet, apiPut, apiPost } from '../lib/api'
import { getAdminProfile, clearAdminSession, setAdminProfile } from '../lib/session'
import { STATES_DISTRICTS } from '../lib/states'
import { 
  Lock, 
  AlertTriangle, 
  LogOut, 
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

  // Organization form state. Login email and system ID are intentionally immutable.
  const [profileForm, setProfileForm] = useState({
    orgName: '',
    email: '',
    contactNumber: '',
    state: '',
    district: ''
  })

  const [passForm, setPassForm] = useState({
    currentPassword: '',
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
      const res = await apiGet('/auth/admin/me')
      if (res.success) {
        setProfile(res.data)
        setAdminProfile(res.data)
        setProfileForm({
          orgName: res.data.orgName || '',
          email: res.data.email || '',
          contactNumber: res.data.contactNumber || '',
          state: res.data.state || '',
          district: res.data.district || ''
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
      const res = await apiPut('/auth/admin/organization', {
        orgName: profileForm.orgName,
        state: profileForm.state,
        district: profileForm.district,
        contactNumber: profileForm.contactNumber,
      })
      if (res.success) {
        setSuccess('Organization information updated successfully')
        setProfile(res.data)
        setAdminProfile(res.data)
        setProfileForm({
          orgName: res.data.orgName || '',
          email: res.data.email || '',
          contactNumber: res.data.contactNumber || '',
          state: res.data.state || '',
          district: res.data.district || ''
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (passForm.newPassword !== passForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (passForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await apiPost('/auth/admin/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      })
      if (res.success) {
        setSuccess('Password changed successfully. Use the new password the next time you sign in.')
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspension = async () => {
    if (!suspensionReason) return
    setLoading(true)
    try {
      const res = await apiPost('/auth/admin/request-suspension', { reason: suspensionReason })
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
    { id: 'profile', title: 'Update Org Info', icon: Building, color: 'text-[#134430]', bg: 'bg-[#E7F1E9]' },
    { id: 'password', title: 'Change Password', icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'suspension', title: 'Account Suspension', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'logout', title: 'Logout Account', icon: LogOut, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage organization information and account security</p>
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
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-[#E7F1E9] text-[#134430]">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Update Organization Information</h2>
                <p className="text-gray-500 mt-1">Changes apply to this organization and its student portal.</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={profileForm.orgName}
                  onChange={(e) => setProfileForm({ ...profileForm, orgName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                  placeholder="Organization name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={profileForm.email}
                      readOnly
                      aria-readonly="true"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Email is linked to the account and cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization ID</label>
                  <input
                    type="text"
                    value={profile?.schoolId || ''}
                    readOnly
                    aria-readonly="true"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select
                    required
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value, district: '' })}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                  >
                    <option value="">Select state</option>
                    {Object.keys(STATES_DISTRICTS).map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                  <select
                    required
                    value={profileForm.district}
                    disabled={!profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Select district</option>
                    {((STATES_DISTRICTS as Record<string, string[]>)[profileForm.state] || []).map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    required
                    maxLength={24}
                    value={profileForm.contactNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1B5E3F] outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
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
      )}

      {activeTab === 'password' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <Lock className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
              <p className="text-gray-500 mb-8">Your existing password will stop working after this change is saved.</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  placeholder="Repeat new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                Update Password
              </button>
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
