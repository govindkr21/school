import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Menu, X } from 'lucide-react'
import { apiGet } from '../lib/api'
import BrandLogo from '../components/BrandLogo'

const heading = { fontFamily: "'Vesper Libre', serif" }

type Complaint = {
  _id: string
  complaintId: string
  title: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  category: string
  createdAt: string
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Awaiting review', color: '#A9741A', bg: '#FAF0DC' },
  IN_PROGRESS: { label: 'In progress', color: '#2F5D7C', bg: '#E6EEF4' },
  RESOLVED: { label: 'Resolved', color: '#1B5E3F', bg: '#E7F1E9' }
}

function daysOld(dateStr: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)))
}

const StepTracker: React.FC<{ status: string }> = ({ status }) => {
  const reviewing = status === 'IN_PROGRESS' || status === 'RESOLVED'
  const closed = status === 'RESOLVED'
  const steps = [
    { label: 'Received', done: true },
    { label: 'Reviewing', done: reviewing },
    { label: 'Closed', done: closed }
  ]
  return (
    <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.done ? 'bg-[#1B5E3F]' : 'border border-[#DED2B6]'}`} />
            <span className={s.done ? 'text-[#14231B]' : 'text-[#8B978F]'}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className="h-px w-6 bg-[#EAE1CC]" />}
        </React.Fragment>
      ))}
    </div>
  )
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const studentName = localStorage.getItem('studentName') || 'Student'
  const schoolName = localStorage.getItem('schoolName') || 'Institution'
  const studentToken = localStorage.getItem('studentToken')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!studentToken) {
      navigate('/find-school')
      return
    }
    let active = true
    setLoading(true)
    apiGet('/complaints/my-complaints?filter=all')
      .then((res) => {
        if (active && res?.success) setComplaints(res.data || [])
      })
      .catch(() => {
        if (active) setComplaints([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('studentToken')
    localStorage.removeItem('studentSchoolId')
    localStorage.removeItem('studentName')
    localStorage.removeItem('schoolName')
    localStorage.removeItem('studentAdmissionNumber')
    navigate('/find-school')
  }

  const openCount = complaints.filter((c) => c.status !== 'RESOLVED').length
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length
  const firstName = studentName.split(' ')[0]
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="min-h-screen bg-[#FBF8F0]">
      <header className="sticky top-0 z-20 border-b border-[#EAE1CC] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="rounded-lg p-2 text-[#5C6B62] hover:bg-[#FBF8F0] md:hidden"
              aria-label="Open menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <BrandLogo className="h-14 w-14" priority />
          </div>
          <nav className="hidden items-center gap-8 text-[16px] md:flex">
            <span className="border-b-2 border-[#1B5E3F] pb-1 font-medium text-[#1B5E3F]">My complaints</span>
            <button onClick={() => navigate('/suggestions')} className="text-[#5C6B62] hover:text-[#134430]">Suggestions</button>
            <button onClick={() => navigate('/track')} className="text-[#5C6B62] hover:text-[#134430]">Track a complaint</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F1E9] font-mono text-sm text-[#1B5E3F]">
              {studentName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-[#14231B]">{studentName}</div>
              <div className="font-mono text-[12px] text-[#8B978F]">{schoolName}</div>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-[#5C6B62] hover:bg-[#F8E8E5] hover:text-[#A63A2E]" aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <nav className="flex flex-col border-t border-[#EAE1CC] bg-white px-4 py-2 text-[16px] md:hidden">
            <span className="rounded-lg px-3 py-2.5 font-medium text-[#1B5E3F]">My complaints</span>
            <button onClick={() => { setMobileNavOpen(false); navigate('/suggestions') }} className="rounded-lg px-3 py-2.5 text-left text-[#5C6B62] hover:bg-[#FBF8F0]">Suggestions</button>
            <button onClick={() => { setMobileNavOpen(false); navigate('/track') }} className="rounded-lg px-3 py-2.5 text-left text-[#5C6B62] hover:bg-[#FBF8F0]">Track a complaint</button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">{today}</div>
        <h1 className="mt-2 text-4xl" style={heading}>Namaste, {firstName}.</h1>
        <p className="mt-2 text-[16px] text-[#5C6B62]">
          {openCount > 0 ? `You have ${openCount} case${openCount > 1 ? 's' : ''} open.` : 'You have no open cases right now.'}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-2xl bg-[#134430] p-8">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#2F7B55]">Raise a complaint</div>
            <h2 className="mt-3 text-2xl text-[#FBF8F0]" style={heading}>Something not right at school?</h2>
            <p className="mt-2 max-w-md text-sm text-[#FBF8F0]/70">Tell us what happened. Your submission goes straight to the staff member it's assigned to.</p>
            <button
              onClick={() => navigate('/new-complaint')}
              className="mt-6 rounded-[10px] bg-[#FBF8F0] px-6 py-3 text-sm font-medium text-[#134430] transition hover:bg-white"
            >
              Start a complaint
            </button>
          </div>

          <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Your record</div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-4xl text-[#14231B]" style={heading}>{openCount}</div>
                <div className="mt-1 text-sm text-[#5C6B62]">Open</div>
              </div>
              <div className="h-10 w-px bg-[#EAE1CC]" />
              <div>
                <div className="text-4xl text-[#1B5E3F]" style={heading}>{resolvedCount}</div>
                <div className="mt-1 text-sm text-[#5C6B62]">Resolved</div>
              </div>
              <div className="h-10 w-px bg-[#EAE1CC]" />
              <div>
                <div className="text-4xl text-[#14231B]" style={heading}>{complaints.length}</div>
                <div className="mt-1 text-sm text-[#5C6B62]">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl" style={heading}>Your cases</h2>
          <div className="mt-4 divide-y divide-[#EAE1CC] rounded-2xl border border-[#EAE1CC] bg-white">
            {loading && <div className="p-6 text-center text-sm text-[#8B978F]">Loading your cases...</div>}
            {!loading && complaints.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-[16px] font-medium text-[#14231B]">No complaints yet</p>
                <p className="mt-1 text-sm text-[#8B978F]">Start one above if something needs attention.</p>
              </div>
            )}
            {!loading && complaints.map((c) => {
              const style = STATUS_STYLE[c.status] || STATUS_STYLE.PENDING
              return (
                <button
                  key={c._id}
                  onClick={() => navigate(`/tracker?id=${c.complaintId}`)}
                  className="flex w-full items-center gap-4 p-5 pl-4 text-left transition-colors hover:bg-[#FBF8F0]"
                  style={{ borderLeft: `3px solid ${style.color}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12px] text-[#8B978F]">{c.complaintId} · raised {daysOld(c.createdAt)} days ago</div>
                    <div className="truncate text-[16px] font-medium text-[#14231B]">{c.title}</div>
                    <div className="mt-2">
                      <StepTracker status={c.status} />
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[12px]" style={{ background: style.bg, color: style.color }}>
                    {style.label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8B978F]" />
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
