import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Home, LogOut, Search as SearchIcon, ChevronDown, RefreshCw, FileText, MessageSquare, Clock, ShieldCheck, User, Image as ImageIcon, Paperclip } from 'lucide-react'
import { apiGet } from '../lib/api'
import BrandLogo from '../components/BrandLogo'

const heading = { fontFamily: "'Vesper Libre', serif" }

interface Message {
  sender: 'ADMIN' | 'STUDENT'
  message: string
  createdAt: string
}

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

interface Complaint {
  _id: string
  complaintId: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  category: string
  priority: 'Low' | 'Medium' | 'High'
  assignedTo?: string
  createdAt: string
  updatedAt: string
  statusHistory?: { status: string; changedAt: string; message?: string }[]
  timeline?: TimelineEntry[]
  messages?: Message[]
  adminMessageCount?: number
  latestAdminMessage?: { message: string; createdAt: string } | null
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Awaiting review', color: '#A9741A', bg: '#FAF0DC' },
  IN_PROGRESS: { label: 'In progress', color: '#2F5D7C', bg: '#E6EEF4' },
  RESOLVED: { label: 'Resolved', color: '#1B5E3F', bg: '#E7F1E9' }
}

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'text-[#A63A2E] bg-[#F8E8E5]',
  MEDIUM: 'text-[#A9741A] bg-[#FAF0DC]',
  LOW: 'text-[#1B5E3F] bg-[#E7F1E9]'
}

const Tracker: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetId = searchParams.get('id')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState(targetId ? 'all' : 'active')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<Complaint | null>(null)

  const studentName = localStorage.getItem('studentName') || 'Student'
  const schoolName = localStorage.getItem('schoolName') || 'Institution'

  useEffect(() => {
    const token = localStorage.getItem('studentToken')
    if (!token) navigate('/find-school')
    else fetchComplaints()
  }, [])

  // Arrived via a "view this complaint" link (e.g. from the dashboard) — once the
  // list has loaded, jump straight to that complaint's detail.
  useEffect(() => {
    if (!targetId || selectedComplaintId) return
    const match = complaints.find((c) => c.complaintId === targetId)
    if (match) {
      setSelectedComplaintId(match._id)
      fetchComplaintDetail(match.complaintId)
    }
  }, [complaints, targetId])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await apiGet(`/complaints/my-complaints?filter=${filterStatus}`)
      if (res.success) setComplaints(res.data || [])
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: string) => {
    if (targetId) setSearchParams({}, { replace: true })
    setFilterStatus(newFilter)
    setSelectedComplaintId(null)
    setDetailData(null)
  }

  useEffect(() => {
    fetchComplaints()
  }, [filterStatus])

  const fetchComplaintDetail = async (complaintId: string) => {
    setDetailLoading(true)
    try {
      const res = await apiGet(`/complaints/track/${complaintId}`)
      if (res.success) setDetailData(res.data)
    } catch (err) {
      console.error('Failed to fetch complaint details:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSelectComplaint = (complaintId: string) => {
    if (selectedComplaintId === complaintId) {
      setSelectedComplaintId(null)
      setDetailData(null)
    } else {
      setSelectedComplaintId(complaintId)
      fetchComplaintDetail(complaintId)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('studentToken')
    localStorage.removeItem('studentSchoolId')
    localStorage.removeItem('studentName')
    localStorage.removeItem('schoolName')
    navigate('/find-school')
  }

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintId?.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterStatus === 'active') return matchesSearch && (c.status === 'PENDING' || c.status === 'IN_PROGRESS')
    if (filterStatus === 'resolved') return matchesSearch && c.status === 'RESOLVED'
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#FBF8F0]">
      <header className="sticky top-0 z-20 border-b border-[#EAE1CC] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo className="h-14 w-14" priority />
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-[10px] border border-[#DED2B6] bg-white px-3 py-2.5 text-sm font-medium text-[#14231B] hover:border-[#134430] sm:px-4">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#A63A2E] hover:bg-[#F8E8E5] sm:px-4">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h2 className="text-3xl" style={heading}>Track your complaints</h2>
        <p className="mt-1 text-[16px] text-[#5C6B62]">{studentName} · {schoolName}</p>

        {targetId && (
          <div className="mt-4 flex items-center justify-between rounded-[10px] border border-[#DED2B6] bg-[#E7F1E9] px-4 py-3 text-sm">
            <span className="text-[#1B5E3F]">Showing complaint <span className="font-mono">{targetId}</span></span>
            <button onClick={() => handleFilterChange('active')} className="font-medium text-[#134430] hover:underline">View all complaints</button>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-[#EAE1CC] bg-white p-5">
          <div className="flex gap-6 border-b border-[#EAE1CC]">
            <button
              onClick={() => handleFilterChange('active')}
              className={`border-b-2 px-1 pb-3 text-[16px] font-medium transition ${filterStatus === 'active' ? 'border-[#1B5E3F] text-[#134430]' : 'border-transparent text-[#5C6B62] hover:text-[#134430]'}`}
            >
              Active complaints
            </button>
            <button
              onClick={() => handleFilterChange('resolved')}
              className={`border-b-2 px-1 pb-3 text-[16px] font-medium transition ${filterStatus === 'resolved' ? 'border-[#1B5E3F] text-[#134430]' : 'border-transparent text-[#5C6B62] hover:text-[#134430]'}`}
            >
              Resolved complaints
            </button>
          </div>

          <div className="relative mt-4">
            <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B978F]" />
            <input
              type="text"
              placeholder="Search by complaint ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] py-3 pl-11 pr-4 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F] focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#8B978F]">Loading your complaints...</div>
          ) : filteredComplaints.length > 0 ? (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => {
                const style = STATUS_STYLE[complaint.status] || STATUS_STYLE.PENDING
                return (
                  <div key={complaint._id} className="overflow-hidden rounded-2xl border border-[#EAE1CC] bg-white">
                    <button
                      onClick={() => handleSelectComplaint(complaint._id)}
                      className="flex w-full items-start justify-between gap-4 p-4 sm:p-6 text-left transition-colors hover:bg-[#FBF8F0]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <FileText className="h-4 w-4 shrink-0 text-[#1B5E3F]" />
                          <h3 className="text-lg font-medium text-[#14231B]">{complaint.title}</h3>
                          <span className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[12px]" style={{ background: style.bg, color: style.color }}>
                            {style.label}
                          </span>
                        </div>
                        <p className="mb-3 line-clamp-2 text-sm text-[#5C6B62]">{complaint.description}</p>

                        {complaint.latestAdminMessage && (
                          <div className="mb-3 rounded-lg border-l-4 border-[#2F5D7C] bg-[#E6EEF4] p-3">
                            <p className="text-xs font-medium text-[#2F5D7C]">Latest update from staff</p>
                            <p className="mt-1 line-clamp-2 text-sm text-[#14231B]">{complaint.latestAdminMessage.message}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 font-mono text-[12px] text-[#5C6B62]">
                          <span className="rounded-lg bg-[#FBF8F0] px-3 py-1.5">{complaint.complaintId}</span>
                          {!!complaint.adminMessageCount && (
                            <span className="rounded-lg bg-[#E7F1E9] px-3 py-1.5 text-[#1B5E3F]">{complaint.adminMessageCount} message{complaint.adminMessageCount > 1 ? 's' : ''}</span>
                          )}
                          <span className="rounded-lg bg-[#FBF8F0] px-3 py-1.5">{complaint.category}</span>
                          <span className={`rounded-lg px-3 py-1.5 ${PRIORITY_STYLE[complaint.priority?.toUpperCase()] || 'bg-[#FBF8F0] text-[#5C6B62]'}`}>{complaint.priority}</span>
                          <span className="rounded-lg bg-[#FBF8F0] px-3 py-1.5">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                          {complaint.assignedTo && (
                            <span className="rounded-lg bg-[#E7F1E9] px-3 py-1.5 text-[#1B5E3F]">Assigned to {complaint.assignedTo}</span>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-[#8B978F] transition-transform ${selectedComplaintId === complaint._id ? 'rotate-180' : ''}`} />
                    </button>

                    {selectedComplaintId === complaint._id && detailData && (
                      <div className="space-y-6 border-t border-[#EAE1CC] bg-[#FBF8F0] p-4 sm:p-6">
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 font-medium text-[#14231B]">
                            <FileText className="h-4 w-4 text-[#1B5E3F]" />
                            Complaint details
                          </h4>
                          <div className="rounded-lg border border-[#EAE1CC] bg-white p-4 text-sm text-[#5C6B62]">{detailData.description}</div>
                        </div>

                        <div>
                          <h4 className="mb-4 flex items-center gap-2 font-medium text-[#14231B]">
                            <Clock className="h-4 w-4 text-[#1B5E3F]" />
                            Tracking timeline
                          </h4>
                          <div className="space-y-0">
                            {detailData.timeline && detailData.timeline.length > 0 ? (
                              detailData.timeline.map((entry, idx) => {
                                const isLast = idx === (detailData.timeline?.length || 0) - 1
                                return (
                                  <div key={idx} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                      <div className="mt-1.5 h-3 w-3 rounded-full" style={{ background: (STATUS_STYLE[entry.status] || STATUS_STYLE.PENDING).color }} />
                                      {!isLast && <div className="mt-1 min-h-[2rem] w-px flex-1 bg-[#EAE1CC]" />}
                                    </div>
                                    <div className="flex-1 pb-4">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-[#14231B]">{entry.actionTitle}</span>
                                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8B978F]">{entry.performedBy}</span>
                                      </div>
                                      {entry.actionDescription && (
                                        <p className="mt-2 rounded-lg border-l-4 border-[#2F5D7C] bg-white p-2 text-sm text-[#5C6B62]">{entry.actionDescription}</p>
                                      )}
                                      {(entry.imageUrl || entry.attachmentUrl) && (
                                        <div className="mt-2 flex gap-3">
                                          {entry.imageUrl && (
                                            <a href={entry.imageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-[#1B5E3F] hover:underline">
                                              <ImageIcon className="h-3.5 w-3.5" />
                                              View image
                                            </a>
                                          )}
                                          {entry.attachmentUrl && (
                                            <a href={entry.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-[#1B5E3F] hover:underline">
                                              <Paperclip className="h-3.5 w-3.5" />
                                              View attachment
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      <span className="mt-1 block text-sm text-[#8B978F]">{new Date(entry.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <p className="py-4 text-center text-[#8B978F]">No status updates yet</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-4 flex items-center gap-2 font-medium text-[#14231B]">
                            <MessageSquare className="h-4 w-4 text-[#1B5E3F]" />
                            Messages {detailData.messages && detailData.messages.length > 0 && `(${detailData.messages.length})`}
                          </h4>
                          {detailData.messages && detailData.messages.length > 0 ? (
                            <div className="max-h-96 space-y-3 overflow-y-auto">
                              {detailData.messages.map((msg, idx) => (
                                <div key={idx} className={`rounded-xl border p-4 ${msg.sender === 'ADMIN' ? 'border-[#DED2B6] bg-[#E6EEF4]' : 'border-[#EAE1CC] bg-white'}`}>
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-[#5C6B62]">
                                      {msg.sender === 'ADMIN' ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                      {msg.sender === 'ADMIN' ? 'Staff' : 'You'}
                                    </span>
                                    <span className="text-xs text-[#8B978F]">{new Date(msg.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm text-[#14231B]">{msg.message}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-[#DED2B6] bg-white p-8 text-center">
                              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[#DED2B6]" />
                              <p className="text-sm font-medium text-[#5C6B62]">No messages yet</p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => fetchComplaintDetail(complaint.complaintId)}
                          disabled={detailLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#1B5E3F] py-3 font-medium text-[#FBF8F0] transition-all hover:bg-[#134430] disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${detailLoading ? 'animate-spin' : ''}`} />
                          {detailLoading ? 'Refreshing...' : 'Check for updates'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#EAE1CC] bg-white p-12 text-center">
              <h3 className="text-2xl" style={heading}>No complaints yet</h3>
              <p className="mt-2 text-[16px] text-[#5C6B62]">You haven't filed any complaints yet. Start by raising a grievance.</p>
              <button onClick={() => navigate('/new-complaint')} className="mt-6 rounded-[10px] bg-[#1B5E3F] px-8 py-3 font-medium text-[#FBF8F0] hover:bg-[#134430]">
                File a complaint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tracker
