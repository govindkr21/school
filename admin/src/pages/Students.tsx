import React, { useEffect, useState } from 'react'
import { apiGet, apiPost, apiUpload } from '../lib/api'

type CanonicalField = 'fullName' | 'admissionNumber' | 'dob' | 'contactNumber'
const CANONICAL_FIELDS: CanonicalField[] = ['fullName', 'admissionNumber', 'dob', 'contactNumber']

type ImportAnalysis = {
  importId: string
  headers: string[]
  sampleRows: string[][]
  totalRows: number
  suggestedMapping: Record<CanonicalField, number | null>
  fieldLabels: Record<CanonicalField, string>
  aiUsed: boolean
  aiNote?: string
}

const Students: React.FC = () => {
  const [students, setStudents] = useState([] as any[])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ fullName: '', admissionNumber: '', dob: '', contactNumber: '' })

  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null)
  const [mapping, setMapping] = useState<Record<CanonicalField, number | null>>({ fullName: null, admissionNumber: null, dob: null, contactNumber: null })
  const [importing, setImporting] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadErrors, setUploadErrors] = useState<{ row?: number; admissionNumber?: string; reason: string }[]>([])

  function updateField<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName,
        admissionNumber: form.admissionNumber,
        dob: form.dob,
        contactNumber: form.contactNumber
      }
      const res = await apiPost('/students/add', payload)
      setMessage(res.message || 'Student added')
      setForm({ fullName: '', admissionNumber: '', dob: '', contactNumber: '' })
      setTimeout(() => loadStudents(), 300)
    } catch (err: any) {
      setError(err.message || 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadMessage('')
    setUploadErrors([])
    setAnalysis(null)
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload('/students/upload/analyze', fd)
      const data: ImportAnalysis = res.data
      setAnalysis(data)
      setMapping(data.suggestedMapping)
    } catch (err: any) {
      setUploadError(err.message || 'Could not read that file')
    } finally {
      setAnalyzing(false)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  function updateMapping(field: CanonicalField, value: string) {
    setMapping((m) => ({ ...m, [field]: value === '' ? null : Number(value) }))
  }

  function cancelImport() {
    setAnalysis(null)
    setMapping({ fullName: null, admissionNumber: null, dob: null, contactNumber: null })
  }

  async function handleConfirmImport() {
    if (!analysis) return
    setUploadError('')
    setUploadMessage('')
    setUploadErrors([])
    setImporting(true)
    try {
      const res = await apiPost('/students/upload/confirm', { importId: analysis.importId, mapping })
      setUploadMessage(res.message || 'Upload processed')
      setUploadErrors(res.data?.errors || [])
      setAnalysis(null)
      setTimeout(() => loadStudents(), 500)
    } catch (err: any) {
      setUploadError(err.message || 'Import failed')
      setUploadErrors(err.data?.errors || [])
    } finally {
      setImporting(false)
    }
  }

  async function loadStudents() {
    try {
      const res = await apiGet('/students/admin')
      setStudents(res.data || [])
    } catch (err) {
      setStudents([])
    }
  }

  useEffect(() => { loadStudents() }, [])

  const mappingComplete = mapping.fullName !== null && mapping.admissionNumber !== null && mapping.dob !== null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Student Registration</h2>
          <p className="text-sm text-gray-500">Onboard new students individually or in bulk batches. Upload a CSV or Excel file in any column order — column headers are matched automatically, and you'll confirm the mapping before anything is imported.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card md:col-span-2">
          <h3 className="font-semibold mb-4">Manual Registration</h3>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full p-2 border rounded" placeholder="Full Name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.admissionNumber} onChange={(e) => updateField('admissionNumber', e.target.value)} className="p-2 border rounded" placeholder="Admission No" required />
              <input value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} className="p-2 border rounded" placeholder="Contact Number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.dob} onChange={(e) => updateField('dob', e.target.value)} type="date" className="p-2 border rounded" placeholder="DOB" required />
              <div className="hidden sm:block" />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {message && <div className="text-sm text-green-600">{message}</div>}
            <button type="submit" disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Register Student'}</button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Bulk Import</h3>
          <div className="border-dashed border-2 border-gray-200 rounded p-6 text-center">
            <p className="mb-4">Drag & drop a CSV or Excel (.xlsx) file here or click to browse from files</p>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileSelected} disabled={analyzing || importing} />
            {analyzing && <div className="mt-3 text-sm text-gray-500">Reading file and detecting columns…</div>}
            {uploadError && <div className="mt-3 text-sm text-red-600">{uploadError}</div>}
            {uploadMessage && (
              <div className={`mt-3 text-sm ${uploadMessage.startsWith('No students') ? 'text-red-600' : 'text-green-600'}`}>
                {uploadMessage}
              </div>
            )}
          </div>
          {uploadErrors.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto text-left text-xs border rounded p-2 bg-red-50">
              <div className="font-semibold mb-1 text-red-700">Skipped rows ({uploadErrors.length})</div>
              {uploadErrors.map((e, i) => (
                <div key={i} className="text-red-700">
                  {e.row ? `Row ${e.row}` : e.admissionNumber ? `Admission #${e.admissionNumber}` : 'Row'}: {e.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <div className="card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h3 className="font-semibold">Confirm column mapping ({analysis.totalRows} row{analysis.totalRows === 1 ? '' : 's'} found)</h3>
            <span className={`self-start text-xs px-2 py-1 rounded ${analysis.aiUsed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {analysis.aiUsed ? 'AI-detected mapping' : 'Rule-based mapping (AI unavailable)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {CANONICAL_FIELDS.map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{analysis.fieldLabels[field]}{field !== 'contactNumber' ? ' *' : ''}</label>
                <select
                  className="w-full p-2 border rounded text-sm"
                  value={mapping[field] === null ? '' : mapping[field]}
                  onChange={(e) => updateMapping(field, e.target.value)}
                >
                  <option value="">— Not in file —</option>
                  {analysis.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left text-xs border">
              <thead className="bg-gray-50">
                <tr>{analysis.headers.map((h, i) => <th key={i} className="p-2 border-b font-medium whitespace-nowrap">{h || `Column ${i + 1}`}</th>)}</tr>
              </thead>
              <tbody>
                {analysis.sampleRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => <td key={j} className="p-2 whitespace-nowrap">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!mappingComplete && <div className="text-sm text-red-600 mb-3">Student Name, Admission Number and Date of Birth must all be mapped to a column.</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirmImport}
              disabled={!mappingComplete || importing}
              className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {importing ? 'Importing…' : `Confirm & Import ${analysis.totalRows} student${analysis.totalRows === 1 ? '' : 's'}`}
            </button>
            <button onClick={cancelImport} disabled={importing} className="border px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="font-semibold">Registered Students ({students.length})</div>
          <div className="flex flex-wrap items-center gap-2">
            <input className="p-2 border rounded flex-1 min-w-[140px]" placeholder="Filter by name..." />
            <button onClick={() => loadStudents()} className="p-2 border rounded">Refresh</button>
            <button className="p-2 border rounded">Export</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Admission Number</th>
                <th className="pb-3">DOB</th>
                <th className="pb-3">Contact</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">No student records loaded. Use the form or upload a file to add students.</td>
                </tr>
              )}
              {students.map((s: any) => (
                <tr key={s._id} className="border-t">
                  <td className="py-3">{s.fullName}</td>
                  <td className="py-3">{s.admissionNumber}</td>
                  <td className="py-3">{new Date(s.dob).toLocaleDateString()}</td>
                  <td className="py-3">{s.contactNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Students
