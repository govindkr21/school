import React, { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import { Lightbulb, RefreshCw, User, IdCard, Folder, FileText } from 'lucide-react'

interface SuggestionRow {
  _id: string
  title: string
  description: string
  category?: string
  createdAt: string
  studentId?: {
    fullName: string
    admissionNumber: string
  }
}

const Suggestions: React.FC = () => {
  const [rows, setRows] = useState<SuggestionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  async function load() {
    setLoading(true)
    try {
      const payload = await apiGet('/suggestions/admin')
      setRows(payload.data || [])
    } catch (err) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredRows = rows.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.studentId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Suggestions</h2>
          <p className="text-gray-500 font-medium mt-1">Feedback and suggestions sent by students and parents.</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#134430] text-white rounded-xl font-bold hover:bg-[#0F3626] hover:shadow-lg transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-lg border border-gray-100">
        <div className="mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title, student, or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B5E3F] outline-none font-medium"
            />
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-3xl">⏳</div>
            <p className="text-gray-600 font-bold mt-4">Loading suggestions...</p>
          </div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">No suggestions yet</p>
            <p className="text-gray-400 text-sm">Suggestions sent by students will appear here</p>
          </div>
        )}

        {!loading && filteredRows.length > 0 && (
          <div className="space-y-2">
            {filteredRows.map((s) => (
              <div key={s._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
                <div className="p-3 sm:p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F1E9] text-[#134430]">
                          <Lightbulb className="h-3.5 w-3.5" />
                        </span>
                        <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{s.description}</p>
                    </div>
                    <div className="text-xs font-bold text-gray-500 sm:flex-shrink-0">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-gray-700">
                      <User className="h-3 w-3" />
                      {s.studentId?.fullName || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-gray-700">
                      <IdCard className="h-3 w-3" />
                      Admission: {s.studentId?.admissionNumber || 'N/A'}
                    </div>
                    {s.category && (
                      <div className="flex items-center gap-1 bg-[#E7F1E9] px-2 py-1 rounded-lg text-[#134430]">
                        <Folder className="h-3 w-3" />
                        {s.category}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Suggestions
