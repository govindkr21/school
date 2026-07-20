import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }

type Stats = { total: number; active: number; resolved: number; unresolved: number; suggestions: number }
type RecentComplaint = { _id: string; complaintId: string; studentName?: string; title?: string; category?: string; status: string; createdAt: string }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Awaiting review', color: '#A9741A', bg: '#FAF0DC' },
  IN_PROGRESS: { label: 'In progress', color: '#2F5D7C', bg: '#E6EEF4' },
  RESOLVED: { label: 'Resolved', color: '#1B5E3F', bg: '#E7F1E9' },
  ESCALATED: { label: 'Escalated', color: '#A63A2E', bg: '#F8E8E5' }
}

function daysOld(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  return days
}

function rowStatus(r: RecentComplaint) {
  const age = daysOld(r.createdAt)
  if (r.status !== 'RESOLVED' && age >= 3) return STATUS_STYLE.ESCALATED
  return STATUS_STYLE[r.status] || STATUS_STYLE.PENDING
}

const MetricTile: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">{label}</div>
    <div className="mt-2 text-3xl text-[#14231B]" style={heading}>{value}</div>
  </div>
)

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, resolved: 0, unresolved: 0, suggestions: 0 })
  const [recent, setRecent] = useState<RecentComplaint[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await apiGet('/complaints/admin/stats')
      if (res?.success && res.data) {
        setStats(res.data.stats || {})
        setRecent(res.data.recent || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const inProgress = Math.max(0, stats.active - stats.unresolved)
  const barTotal = Math.max(1, stats.unresolved + inProgress + stats.resolved)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">{today}</div>
          <h2 className="mt-1 text-2xl text-[#14231B] sm:text-3xl" style={heading}>Case register</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-[10px] border border-[#DED2B6] bg-white px-4 py-2.5 text-sm text-[#14231B] ${loading ? 'cursor-not-allowed opacity-50' : 'hover:border-[#134430]'}`}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B5E3F] border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
            )}
            Refresh
          </button>
          <button onClick={() => window.print()} className="rounded-[10px] border border-[#DED2B6] bg-white px-4 py-2.5 text-sm text-[#14231B] hover:border-[#134430]">
            Export report
          </button>
          <button onClick={() => navigate('/complaints')} className="col-span-2 rounded-[10px] bg-[#1B5E3F] px-4 py-2.5 text-sm font-medium text-[#FBF8F0] hover:bg-[#134430] sm:col-span-1">
            Manage complaints
          </button>
        </div>
      </div>

      <div className="grid gap-6 rounded-2xl border border-[#EAE1CC] bg-white p-4 sm:p-6 lg:grid-cols-2">
        <div>
          <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Cases needing attention</div>
          <div className="mt-3 text-4xl text-[#14231B] sm:text-6xl" style={heading}>{stats.active}</div>
          <p className="mt-2 text-[16px] text-[#5C6B62]">
            <span className="font-medium text-[#A9741A]">{stats.unresolved} awaiting review</span> and {inProgress} currently being worked on.
          </p>

          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-[#EAE1CC]">
            <div style={{ width: `${(stats.unresolved / barTotal) * 100}%`, background: '#A9741A' }} />
            <div style={{ width: `${(inProgress / barTotal) * 100}%`, background: '#2F5D7C' }} />
            <div style={{ width: `${(stats.resolved / barTotal) * 100}%`, background: '#1B5E3F' }} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#5C6B62]">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#A9741A]" />Awaiting review <span className="font-mono text-[#14231B]">{stats.unresolved}</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#2F5D7C]" />In progress <span className="font-mono text-[#14231B]">{inProgress}</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#1B5E3F]" />Resolved <span className="font-mono text-[#14231B]">{stats.resolved}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-[#EAE1CC] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <MetricTile label="Resolved all-time" value={stats.resolved} />
          <MetricTile label="Total complaints" value={stats.total} />
          <MetricTile label="In progress" value={inProgress} />
          <MetricTile label="Awaiting review" value={stats.unresolved} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#EAE1CC] bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg text-[#14231B]" style={heading}>Recent cases</div>
            <p className="text-sm text-[#5C6B62]">Newest first. Click a row to open the case file.</p>
          </div>
          <button onClick={() => navigate('/complaints')} className="text-sm font-medium text-[#1B5E3F] hover:text-[#134430]">View all</button>
        </div>

        <div className="divide-y divide-[#EAE1CC]">
          {recent.length > 0 ? (
            recent.map((r) => {
              const style = rowStatus(r)
              return (
                <button
                  key={r._id}
                  onClick={() => navigate(`/complaints?id=${r.complaintId}`)}
                  className="flex w-full items-center gap-4 py-3 pl-3 text-left"
                  style={{ borderLeft: `3px solid ${style.color}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12px] text-[#8B978F]">{r.complaintId} · {daysOld(r.createdAt)} days old · {r.studentName || 'Unknown student'}</div>
                    <div className="truncate text-[16px] font-medium text-[#14231B]">{r.title || r.category}</div>
                  </div>
                  <span className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[12px]" style={{ background: style.bg, color: style.color }}>
                    {style.label}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="py-6 text-center text-sm text-[#8B978F]">No recent complaints</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
