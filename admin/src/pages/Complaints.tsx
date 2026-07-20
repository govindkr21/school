import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiPatch } from '../lib/api'
import { MessageSquare, FileText, AlertCircle, CheckCircle2, Clock, RefreshCw, Pencil, User, IdCard, Folder, Zap, Wrench, Image as ImageIcon, Paperclip, ShieldCheck, TriangleAlert } from 'lucide-react'

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

interface PhysicalDamage {
  hasDamage: boolean
  description?: string
  estimatedCost?: number
  location?: string
  images?: { secureUrl: string; publicId: string }[]
}

interface ComplaintDetail {
  _id: string
  complaintId: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  category: string
  priority: 'Low' | 'Medium' | 'High'
  assignedTo?: string
  physicalDamage?: PhysicalDamage
  createdAt: string
  updatedAt: string
  messages: Message[]
  timeline?: TimelineEntry[]
  studentId?: {
    fullName: string
    admissionNumber: string
  }
}

type ComplaintRow = any

const Complaints: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const targetComplaintId = searchParams.get('id')
  const [rows, setRows] = useState<ComplaintRow[]>([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<ComplaintDetail | null>(null)
  const [statusDraft, setStatusDraft] = useState<string>('')
  const [msgDraft, setMsgDraft] = useState<string>('')
  const [actionTitleDraft, setActionTitleDraft] = useState<string>('')
  const [assignedToDraft, setAssignedToDraft] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  async function load(status?: string) {
    setLoading(true)
    try {
      const q = status ? `?status=${status}` : ''
      const payload = await apiGet(`/complaints/admin${q}`)
      setRows(payload.data || [])
    } catch (err) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchComplaintDetail(complaintId: string) {
    setDetailLoading(true)
    try {
      const res = await apiGet(`/complaints/track/${complaintId}`)
      if (res.success) {
        setExpandedDetail(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch complaint details:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  function handleFilterChange(status: string) {
    if (targetComplaintId) setSearchParams({}, { replace: true })
    setFilterStatus(status)
    load(status || undefined)
  }

  // Bug fix: this used to be called with complaint._id and then fetch
  // /complaints/track/<mongo _id> — but that endpoint looks complaints up by
  // the human-readable complaintId string (e.g. "RES1"), never the Mongo
  // ObjectId, so the request 404'd silently every time and the timeline
  // never loaded. Takes the row now so it can track expansion by _id while
  // fetching by the correct complaintId.
  function handleSelectExpand(complaint: ComplaintRow) {
    if (expandedId === complaint._id) {
      setExpandedId(null)
      setExpandedDetail(null)
    } else {
      setExpandedId(complaint._id)
      fetchComplaintDetail(complaint.complaintId)
    }
  }

  useEffect(() => { load() }, [])

  // Arrived via a "view this complaint" link (e.g. from the dashboard's
  // recent cases list) — once the list has loaded, jump straight to it.
  useEffect(() => {
    if (!targetComplaintId || expandedId) return
    const match = rows.find((r) => r.complaintId === targetComplaintId)
    if (match) handleSelectExpand(match)
  }, [rows, targetComplaintId])

  function startEdit(c: ComplaintRow) {
    setEditingId(c.complaintId)
    setStatusDraft(c.status || 'IN_PROGRESS')
    setMsgDraft('')
    setActionTitleDraft('')
    setAssignedToDraft(c.assignedTo || '')
  }

  async function saveEdit(complaintId: string) {
    if (msgDraft.length > 200) {
      alert('Message cannot exceed 200 characters')
      return
    }
    try {
      await apiPatch(`/complaints/admin/${complaintId}/status`, {
        status: statusDraft,
        message: msgDraft,
        actionTitle: actionTitleDraft,
        assignedTo: assignedToDraft
      })
      setEditingId(null)
      setMsgDraft('')
      setActionTitleDraft('')
      await load(filterStatus || undefined)
      // Refresh the expanded detail if it's the same complaint. expandedId
      // holds the row's Mongo _id, not the human complaintId, so compare
      // against the already-fetched detail's complaintId instead.
      if (expandedDetail?.complaintId === complaintId) {
        await fetchComplaintDetail(complaintId)
      }
    } catch (err: any) {
      alert(err.message || 'Save failed')
    }
  }

  function getStatusIcon(status: string) {
    switch(status?.toUpperCase()) {
      case 'RESOLVED': return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'IN_PROGRESS': return <Clock className="w-3.5 h-3.5" />
      default: return <AlertCircle className="w-3.5 h-3.5" />
    }
  }

  function getStatusColor(status: string) {
    const badges = {
      RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Resolved' },
      IN_PROGRESS: { bg: 'bg-[#EAE1CC]', text: 'text-[#14231B]', border: 'border-[#DED2B6]', label: 'In Progress' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Pending' }
    }
    const badge = badges[status as keyof typeof badges] || badges.IN_PROGRESS
    return <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
      {getStatusIcon(status)}
      {badge.label}
    </span>
  }

  const getPriorityColor = (priority: string) => {
    switch(priority?.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-orange-600 bg-orange-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredRows = rows.filter(r => 
    r.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.studentId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Complaint Management</h2>
          <p className="text-gray-500 font-medium mt-1">Track, manage, and resolve student complaints from your institution.</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#134430] text-white rounded-xl font-bold hover:bg-[#0F3626] hover:shadow-lg transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {targetComplaintId && (
        <div className="flex items-center justify-between rounded-xl border border-[#BFE0CC] bg-[#E7F1E9] px-4 py-3 text-sm">
          <span className="text-[#134430]">Showing complaint <span className="font-mono font-bold">{targetComplaintId}</span></span>
          <button onClick={() => handleFilterChange('')} className="font-bold text-[#134430] hover:underline">View all complaints</button>
        </div>
      )}

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Complaint ID, Student Name, or Title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B5E3F] outline-none font-medium"
            />
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-6 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B5E3F] outline-none font-bold text-gray-700 md:min-w-56"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-3xl">⏳</div>
            <p className="text-gray-600 font-bold mt-4">Loading complaints...</p>
          </div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">No complaints found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
          </div>
        )}

        {!loading && filteredRows.length > 0 && (
          <div className="space-y-2">
            {filteredRows.map((complaint) => (
              <div key={complaint._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
                {/* Main Complaint Row */}
                <div className="p-3 sm:p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <button
                          onClick={() => handleSelectExpand(complaint)}
                          className="font-black text-base text-[#134430] hover:text-[#0F3626] hover:underline transition-colors"
                        >
                          {complaint.complaintId}
                        </button>
                        {getStatusColor(complaint.status)}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{complaint.title}</h3>
                      <p className="text-xs text-gray-600 font-medium line-clamp-1">{complaint.description}</p>
                    </div>
                    {editingId === complaint.complaintId ? null : (
                      <div className="flex items-center justify-between gap-2 sm:flex-shrink-0 sm:flex-col sm:items-end">
                        <div className="text-xs font-bold text-gray-500 sm:mb-1">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => startEdit(complaint)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E7F1E9] hover:bg-[#D5E8DA] text-[#134430] rounded-lg font-bold text-xs transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                          Update
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-gray-700">
                      <User className="h-3 w-3" />
                      {complaint.studentId?.fullName || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-gray-700">
                      <IdCard className="h-3 w-3" />
                      Admission: {complaint.studentId?.admissionNumber || 'N/A'}
                    </div>
                    {complaint.category && (
                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-gray-700">
                        <Folder className="h-3 w-3" />
                        {complaint.category}
                      </div>
                    )}
                    {complaint.priority && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-black ${getPriorityColor(complaint.priority)}`}>
                        <Zap className="h-3 w-3" />
                        {complaint.priority}
                      </div>
                    )}
                    {complaint.assignedTo && (
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg text-purple-700">
                        <Wrench className="h-3 w-3" />
                        Assigned to {complaint.assignedTo}
                      </div>
                    )}
                    {complaint.physicalDamage?.hasDamage && (
                      <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg text-red-700">
                        <TriangleAlert className="h-3 w-3" />
                        Damage reported
                      </div>
                    )}
                  </div>

                  {editingId === complaint.complaintId && (
                    <div className="mt-6 p-4 sm:p-6 bg-[#E7F1E9] rounded-2xl border-2 border-[#BFE0CC]">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
                          <select
                            value={statusDraft}
                            onChange={(e) => setStatusDraft(e.target.value)}
                            className="w-full p-3 border-2 border-[#BFE0CC] rounded-lg font-bold text-gray-700 focus:outline-none focus:border-[#134430]"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Action Title (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g., Assigned to Electrical Department"
                              value={actionTitleDraft}
                              onChange={(e) => setActionTitleDraft(e.target.value)}
                              className="w-full p-3 border-2 border-[#BFE0CC] rounded-lg font-medium focus:outline-none focus:border-[#134430]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Assign To (Optional)</label>
                            <input
                              type="text"
                              placeholder="Staff name"
                              value={assignedToDraft}
                              onChange={(e) => setAssignedToDraft(e.target.value)}
                              className="w-full p-3 border-2 border-[#BFE0CC] rounded-lg font-medium focus:outline-none focus:border-[#134430]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Admin Message (Optional)</label>
                          <textarea
                            placeholder="Send a message to the student (max 200 characters)..."
                            value={msgDraft}
                            onChange={(e) => setMsgDraft(e.target.value.slice(0, 200))}
                            className="w-full p-3 border-2 border-[#BFE0CC] rounded-lg font-medium focus:outline-none focus:border-[#134430] resize-none"
                            rows={3}
                          />
                          <div className="text-xs text-gray-500 mt-1 text-right">{msgDraft.length}/200 characters</div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                          <button
                            onClick={() => { setEditingId(null); setMsgDraft(''); setActionTitleDraft('') }}
                            className="px-6 py-2 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(complaint.complaintId)}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                          >
                            ✓ Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === complaint._id && expandedDetail && (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Full Description */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#134430]" />
                          Full Description
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700 text-sm leading-relaxed">
                          {expandedDetail.description}
                        </div>
                      </div>

                      {/* Physical Damage */}
                      {expandedDetail.physicalDamage?.hasDamage && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <TriangleAlert className="w-5 h-5 text-red-600" />
                            Physical Damage Reported
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-red-200 space-y-3">
                            {expandedDetail.physicalDamage.description && (
                              <p className="text-sm text-gray-700 leading-relaxed">{expandedDetail.physicalDamage.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs font-bold">
                              {typeof expandedDetail.physicalDamage.estimatedCost === 'number' && (
                                <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-gray-700">Estimated cost: ₹{expandedDetail.physicalDamage.estimatedCost.toLocaleString('en-IN')}</div>
                              )}
                              {expandedDetail.physicalDamage.location && (
                                <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-gray-700">Location: {expandedDetail.physicalDamage.location}</div>
                              )}
                            </div>
                            {expandedDetail.physicalDamage.images && expandedDetail.physicalDamage.images.length > 0 && (
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {expandedDetail.physicalDamage.images.map((img, idx) => (
                                  <a key={idx} href={img.secureUrl} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-[#1B5E3F] transition-colors">
                                    <img src={img.secureUrl} alt={`Damage photo ${idx + 1}`} className="h-full w-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Activity Timeline */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          Activity Timeline {expandedDetail.timeline && `(${expandedDetail.timeline.length})`}
                        </h4>
                        {detailLoading ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin">⏳</div>
                            <p className="text-gray-600 font-medium mt-2">Loading timeline...</p>
                          </div>
                        ) : expandedDetail.timeline && expandedDetail.timeline.length > 0 ? (
                          <div className="space-y-0">
                            {expandedDetail.timeline.map((entry, idx) => {
                              const isLast = idx === (expandedDetail.timeline?.length || 0) - 1
                              const dotColor = entry.status === 'RESOLVED' ? 'bg-green-600' : entry.status === 'IN_PROGRESS' ? 'bg-[#1B5E3F]' : 'bg-yellow-500'
                              return (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full ${dotColor} mt-1.5 ring-4 ring-white`}></div>
                                    {!isLast && <div className="w-0.5 flex-1 min-h-[2.5rem] bg-gray-300"></div>}
                                  </div>
                                  <div className="flex-1 pb-6">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-bold text-gray-900">{entry.actionTitle}</p>
                                      <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${entry.role === 'ADMIN' ? 'bg-[#E7F1E9] text-[#134430]' : entry.role === 'STUDENT' ? 'bg-gray-200 text-gray-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {entry.performedBy} · {entry.role}
                                      </span>
                                    </div>
                                    {entry.actionDescription && (
                                      <p className="text-sm text-gray-600 mt-1">{entry.actionDescription}</p>
                                    )}
                                    {(entry.attachmentUrl || entry.imageUrl) && (
                                      <div className="mt-2 flex gap-3">
                                        {entry.imageUrl && (
                                          <a href={entry.imageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-[#134430] hover:underline">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            View image
                                          </a>
                                        )}
                                        {entry.attachmentUrl && (
                                          <a href={entry.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-[#134430] hover:underline">
                                            <Paperclip className="h-3.5 w-3.5" />
                                            View attachment
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">No activity recorded yet</p>
                        )}
                      </div>

                      {/* Message History */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                          Message History {expandedDetail.messages && `(${expandedDetail.messages.length})`}
                        </h4>
                        {detailLoading ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin">⏳</div>
                            <p className="text-gray-600 font-medium mt-2">Loading messages...</p>
                          </div>
                        ) : expandedDetail.messages && expandedDetail.messages.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {expandedDetail.messages.map((msg, idx) => (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-lg border-2 ${
                                  msg.sender === 'ADMIN'
                                    ? 'bg-[#E7F1E9] border-[#BFE0CC] rounded-bl-none'
                                    : 'bg-gray-100 border-gray-300 rounded-br-none'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${
                                    msg.sender === 'ADMIN'
                                      ? 'text-[#134430] bg-[#D5E8DA] px-2.5 py-1 rounded'
                                      : 'text-gray-700 bg-gray-200 px-2.5 py-1 rounded'
                                  }`}>
                                    {msg.sender === 'ADMIN' ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                    {msg.sender === 'ADMIN' ? 'Admin' : 'Student'}
                                  </span>
                                  <span className="text-xs text-gray-500 font-bold">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <p className={`text-sm leading-relaxed ${
                                  msg.sender === 'ADMIN'
                                    ? 'text-[#134430] font-medium'
                                    : 'text-gray-700'
                                }`}>
                                  {msg.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">No messages yet</p>
                          </div>
                        )}
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={() => fetchComplaintDetail(complaint.complaintId)}
                        disabled={detailLoading}
                        className="w-full py-3 bg-[#134430] hover:bg-[#0F3626] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 ${detailLoading ? 'animate-spin' : ''}`} />
                        {detailLoading ? 'Refreshing...' : 'Refresh Messages'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Complaints
