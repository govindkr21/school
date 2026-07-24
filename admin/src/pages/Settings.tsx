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
  Loader2,
  CreditCard,
  Shield,
  CalendarDays,
  ReceiptText,
  Printer,
  CircleCheck,
  Clock
} from 'lucide-react'

type Invoice = {
  invoiceNumber: string
  planName: string
  amount: number
  currency: string
  status: 'PAID' | 'REFUNDED'
  paidAt: string
  provider: string
  providerOrderId: string
  providerPaymentId?: string
}

type BillingData = {
  organization: {
    schoolId: string
    name: string
    billingEmail: string
    registeredAt: string
  }
  subscription: null | {
    planId: string
    planName: string
    planMonths: number
    startsAt: string
    expiresAt: string
    status: 'ACTIVE' | 'EXPIRED'
    daysRemaining: number
  }
  invoices: Invoice[]
}

function formatDate(value?: string) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'privacy' | 'password' | 'suspension' | 'logout'>('profile')
  const [profile, setProfile] = useState<any>(getAdminProfile())
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billing, setBilling] = useState<BillingData | null>(null)
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

  useEffect(() => {
    if (activeTab === 'billing' && !billing && !billingLoading) fetchBilling()
  }, [activeTab])

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

  const fetchBilling = async () => {
    setBillingLoading(true)
    setError(null)
    try {
      const res = await apiGet('/payments/admin/billing')
      if (res.success) setBilling(res.data)
    } catch (err: any) {
      setError(err.message || 'Unable to load plan and billing details')
    } finally {
      setBillingLoading(false)
    }
  }

  const printInvoice = (invoice: Invoice) => {
    if (!billing) return
    const invoiceWindow = window.open('', '_blank', 'width=850,height=900')
    if (!invoiceWindow) {
      setError('Please allow pop-ups to print or save the invoice.')
      return
    }

    invoiceWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(invoice.invoiceNumber)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#14231b;margin:0;padding:48px}
        .top{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #134430;padding-bottom:24px}
        h1{margin:0;color:#134430}.muted{color:#647168}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:32px 0}
        .box{border:1px solid #dfe7e1;border-radius:12px;padding:18px}.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#718078}
        .value{font-weight:700;margin-top:7px}.total{margin-top:28px;text-align:right;font-size:24px;font-weight:700}.paid{color:#147a49}
        footer{margin-top:56px;border-top:1px solid #dfe7e1;padding-top:16px;color:#718078;font-size:12px}
        @media print{body{padding:20px}.no-print{display:none}}
      </style></head><body>
      <div class="top"><div><h1>Madnir</h1><div class="muted">Subscription invoice</div></div>
      <div><div class="label">Invoice number</div><div class="value">${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="label" style="margin-top:12px">Payment date</div><div class="value">${escapeHtml(formatDate(invoice.paidAt))}</div></div></div>
      <div class="grid"><div class="box"><div class="label">Billed to</div><div class="value">${escapeHtml(billing.organization.name)}</div>
      <div>${escapeHtml(billing.organization.billingEmail)}</div><div>${escapeHtml(billing.organization.schoolId)}</div></div>
      <div class="box"><div class="label">Payment details</div><div class="value">${escapeHtml(invoice.provider)}</div>
      <div>Order: ${escapeHtml(invoice.providerOrderId)}</div><div>Payment: ${escapeHtml(invoice.providerPaymentId || 'Not available')}</div></div></div>
      <div class="box"><div class="label">Description</div><div class="value">${escapeHtml(invoice.planName)} subscription</div>
      <div class="total">${escapeHtml(invoice.currency)} ${escapeHtml(invoice.amount.toLocaleString('en-IN'))} <span class="paid">${escapeHtml(invoice.status)}</span></div></div>
      <footer>This computer-generated invoice records the subscription payment received for the organization shown above.</footer>
      <script>window.onload=()=>window.print()</script></body></html>`)
    invoiceWindow.document.close()
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
    { id: 'billing', title: 'Plan & Billing', icon: CreditCard, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'privacy', title: 'Privacy Policy', icon: Shield, color: 'text-teal-700', bg: 'bg-teal-50' },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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

      {activeTab === 'billing' && (
        <div className="max-w-5xl mx-auto space-y-6">
          {billingLoading && (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-gray-100 bg-white">
              <div className="text-center text-gray-500">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#134430]" />
                Loading plan and billing details...
              </div>
            </div>
          )}

          {!billingLoading && billing && (
            <>
              <div className="overflow-hidden rounded-3xl bg-[#134430] p-6 text-white shadow-lg md:p-8">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm text-[#CDE5D5]">
                      <CreditCard className="h-4 w-4" />
                      Current subscription
                    </div>
                    <h2 className="text-3xl font-bold">{billing.subscription?.planName || 'No plan found'}</h2>
                    <p className="mt-2 text-[#CDE5D5]">
                      {billing.subscription
                        ? `${billing.subscription.planMonths}-month organization subscription`
                        : 'Billing history is not available for this organization.'}
                    </p>
                  </div>
                  {billing.subscription && (
                    <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                      billing.subscription.status === 'ACTIVE'
                        ? 'bg-white text-[#134430]'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {billing.subscription.status === 'ACTIVE'
                        ? <CircleCheck className="h-4 w-4" />
                        : <Clock className="h-4 w-4" />}
                      {billing.subscription.status}
                    </div>
                  )}
                </div>
                {billing.subscription && (
                  <div className="mt-7 border-t border-white/20 pt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Subscription period</span>
                      <span className="font-bold">{billing.subscription.daysRemaining} days remaining</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${Math.max(0, Math.min(100,
                            (billing.subscription.daysRemaining / Math.max(1, billing.subscription.planMonths * 30.44)) * 100
                          ))}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'School registered', value: formatDate(billing.organization.registeredAt), icon: Building },
                  { label: 'Plan activated', value: formatDate(billing.subscription?.startsAt), icon: CalendarDays },
                  { label: 'Plan expires', value: formatDate(billing.subscription?.expiresAt), icon: Clock }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <item.icon className="mb-4 h-6 w-6 text-[#134430]" />
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</div>
                    <div className="mt-2 font-bold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <ReceiptText className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Billing details</h3>
                    <p className="mt-1 text-sm text-gray-500">Invoices are linked permanently to this organization.</p>
                  </div>
                </div>
                <div className="grid gap-4 rounded-2xl bg-gray-50 p-5 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Organization</div>
                    <div className="mt-1 font-semibold text-gray-800">{billing.organization.name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Billing email</div>
                    <div className="mt-1 break-all font-semibold text-gray-800">{billing.organization.billingEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Organization ID</div>
                    <div className="mt-1 font-mono font-semibold text-gray-800">{billing.organization.schoolId}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">View payment references and print or save an invoice as PDF.</p>
                </div>
                {billing.invoices.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-gray-500">
                    No invoice is available for this organization.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billing.invoices.map((invoice) => (
                      <div key={invoice.invoiceNumber} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[#134430]">{invoice.invoiceNumber}</span>
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{invoice.status}</span>
                          </div>
                          <div className="mt-2 font-semibold text-gray-900">{invoice.planName}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            Paid {formatDate(invoice.paidAt)} · {invoice.provider}
                          </div>
                          <div className="mt-1 truncate font-mono text-xs text-gray-400">Order: {invoice.providerOrderId}</div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 md:justify-end">
                          <div className="text-lg font-bold text-gray-900">
                            ₹{invoice.amount.toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={() => printInvoice(invoice)}
                            className="flex items-center gap-2 rounded-xl bg-[#134430] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F3626]"
                          >
                            <Printer className="h-4 w-4" />
                            Print / Save PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
            <div className="mb-8 flex items-start gap-4 border-b border-gray-100 pb-7">
              <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
                <p className="mt-1 text-sm text-gray-500">How Madnir handles organization, student, and complaint information.</p>
                <p className="mt-2 font-mono text-xs text-gray-400">Last updated: 24 July 2026</p>
              </div>
            </div>

            <div className="space-y-7 text-sm leading-7 text-gray-600">
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">1. Information processed</h3>
                <p>Madnir processes organization profile details, authorized administrator information, student records supplied by the school, complaints, suggestions, status updates, uploaded evidence, security logs, and subscription payment references needed to operate the service.</p>
              </section>
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">2. Purpose of processing</h3>
                <p>Information is used to verify users, route and manage student complaints, communicate status updates, protect accounts, maintain audit history, provide support, and administer subscriptions and invoices. Information is not intended to be sold for advertising.</p>
              </section>
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">3. School responsibilities</h3>
                <p>The school is responsible for ensuring that student information uploaded to the platform is accurate, collected lawfully, limited to what is necessary, and accessible only to authorized staff. Administrators should not upload unrelated sensitive information.</p>
              </section>
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">4. Access and security</h3>
                <p>Access is restricted by organization and user role. Authentication, validation, rate controls, and database access controls are used to reduce unauthorized access. Administrators must protect their credentials and promptly report suspected misuse.</p>
              </section>
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">5. Service providers and payments</h3>
                <p>Selected infrastructure, email, image-storage, and payment providers may process only the information required to deliver their service. Card and banking credentials are handled by the payment provider; Madnir stores payment identifiers and invoice details rather than full card information.</p>
              </section>
              <section>
                <h3 className="mb-2 text-lg font-bold text-gray-900">6. Retention and requests</h3>
                <p>Records are retained for service operation, institutional accountability, security, billing, and applicable legal requirements. Authorized school administrators may contact platform support to request correction, export, or deletion where permitted and operationally applicable.</p>
              </section>
              <div className="rounded-2xl border border-[#BFE0CC] bg-[#F2F8F4] p-5 text-[#134430]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>This in-product policy explains platform handling at a practical level. The organization should also provide any student-facing privacy notices required by its governing rules.</p>
                </div>
              </div>
            </div>
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
