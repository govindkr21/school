import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, CheckCircle2, Clock, AlertCircle, Home } from 'lucide-react'
import { apiGet } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }

const STAGES = [
  { key: 'PENDING', label: 'Submitted' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'RESOLVED', label: 'Resolved' }
]

interface TimelineEntry {
  status: string
  actionTitle: string
  actionDescription?: string
  performedBy: string
  role: 'ADMIN' | 'STUDENT' | 'SYSTEM'
  attachmentUrl?: string
  imageUrl?: string
  createdAt: string
}

interface ComplaintTrack {
  complaintId: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  category?: string
  priority?: 'Low' | 'Medium' | 'High'
  assignedTo?: string
  createdAt: string
  timeline?: TimelineEntry[]
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  ADMIN: <CheckCircle2 className="h-4 w-4" />,
  STUDENT: <Clock className="h-4 w-4" />,
  SYSTEM: <AlertCircle className="h-4 w-4" />
}

const TrackComplaint: React.FC = () => {
  const [complaintId, setComplaintId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ComplaintTrack | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!complaintId.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSearched(true)
    try {
      const res = await apiGet(`/complaints/track/${complaintId.trim()}`)
      setResult(res.data)
    } catch (err: any) {
      setError(err.message || 'Complaint not found')
    } finally {
      setLoading(false)
    }
  }

  const currentStageIndex = result ? STAGES.findIndex((s) => s.key === result.status) : -1

  return (
    <div className="min-h-screen bg-[#FBF8F0]">
      <header className="border-b border-[#EAE1CC] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="text-lg" style={heading}>Madnir</div>
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-[#5C6B62] hover:text-[#134430]">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Track a complaint</div>
        <h1 className="mt-2 text-3xl" style={heading}>Where does it stand?</h1>
        <p className="mt-2 text-[16px] text-[#5C6B62]">Enter a complaint ID to see its current status and full history.</p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B978F]" />
            <input
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. DOO145"
              className="w-full rounded-[10px] border border-[#DED2B6] bg-white py-3 pl-11 pr-4 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
            />
          </div>
          <button
            disabled={loading}
            className="rounded-[10px] bg-[#1B5E3F] px-6 py-3 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#F8E8E5] bg-[#F8E8E5] p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[#A63A2E]" />
            <p className="font-medium text-[#A63A2E]">{error}</p>
            <p className="mt-1 text-sm text-[#A63A2E]/70">Double-check the complaint ID and try again.</p>
          </div>
        )}

        {!searched && !error && (
          <div className="mt-10 rounded-2xl border border-dashed border-[#DED2B6] bg-white p-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-[#DED2B6]" />
            <p className="text-[16px] font-medium text-[#5C6B62]">Enter a complaint ID above to see its progress</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[12px] text-[#8B978F]">{result.complaintId}</div>
                  <h2 className="mt-1 text-xl font-medium text-[#14231B]">{result.title}</h2>
                </div>
                <div className="text-right font-mono text-[12px] text-[#8B978F]">
                  Raised {new Date(result.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {result.category && <span className="rounded-lg bg-[#FBF8F0] px-3 py-1.5 text-[#5C6B62]">{result.category}</span>}
                {result.priority && <span className="rounded-lg bg-[#FBF8F0] px-3 py-1.5 text-[#5C6B62]">{result.priority} priority</span>}
                {result.assignedTo && <span className="rounded-lg bg-[#E7F1E9] px-3 py-1.5 text-[#1B5E3F]">Assigned to {result.assignedTo}</span>}
              </div>

              <div className="mt-6 flex items-center">
                {STAGES.map((stage, i) => (
                  <React.Fragment key={stage.key}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          i < currentStageIndex ? 'bg-[#1B5E3F] text-[#FBF8F0]'
                          : i === currentStageIndex ? 'bg-[#134430] text-[#FBF8F0] ring-4 ring-[#E7F1E9]'
                          : 'border border-[#DED2B6] text-[#8B978F]'
                        }`}
                      >
                        {i < currentStageIndex ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs ${i <= currentStageIndex ? 'font-medium text-[#14231B]' : 'text-[#8B978F]'}`}>{stage.label}</span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`mx-2 h-px flex-1 ${i < currentStageIndex ? 'bg-[#1B5E3F]' : 'bg-[#EAE1CC]'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
              <h3 className="text-lg" style={heading}>Activity</h3>
              <div className="mt-4">
                {result.timeline && result.timeline.length > 0 ? (
                  result.timeline.slice().reverse().map((entry, idx) => {
                    const isLast = idx === (result.timeline?.length || 0) - 1
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E7F1E9] text-[#1B5E3F]">
                            {ROLE_ICON[entry.role] || <Clock className="h-4 w-4" />}
                          </div>
                          {!isLast && <div className="mt-1 min-h-[2.5rem] w-px flex-1 bg-[#EAE1CC]" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[#14231B]">{entry.actionTitle}</p>
                            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8B978F]">{entry.performedBy}</span>
                          </div>
                          {entry.actionDescription && <p className="mt-1 text-sm text-[#5C6B62]">{entry.actionDescription}</p>}
                          {(entry.imageUrl || entry.attachmentUrl) && (
                            <div className="mt-2 flex gap-3">
                              {entry.imageUrl && <a href={entry.imageUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#1B5E3F] hover:underline">View image</a>}
                              {entry.attachmentUrl && <a href={entry.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#1B5E3F] hover:underline">View attachment</a>}
                            </div>
                          )}
                          <p className="mt-1 font-mono text-[12px] text-[#8B978F]">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-[#8B978F]">No activity recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackComplaint
