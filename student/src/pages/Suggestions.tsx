import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Home, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react'
import { apiPost } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }
const fieldClass = 'w-full rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] px-4 py-3 text-[16px] text-[#14231B] outline-none transition focus:border-[#1B5E3F] focus:bg-white'

const Suggestions: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Academic')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const schoolName = localStorage.getItem('schoolName') || 'Institution'

  useEffect(() => {
    const token = localStorage.getItem('studentToken')
    if (!token) navigate('/find-school')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiPost('/suggestions', { title, description, category })
      if (res.success) {
        setSuccess(true)
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F0] p-6">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E7F1E9]">
          <CheckCircle2 className="h-10 w-10 text-[#1B5E3F]" />
        </div>
        <h2 className="text-3xl" style={heading}>Thank you</h2>
        <p className="mt-2 max-w-sm text-center text-[16px] text-[#5C6B62]">Your suggestion has been submitted and will be reviewed by the school administration.</p>
        <p className="mt-6 text-sm text-[#8B978F]">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0]">
      <header className="sticky top-0 z-20 border-b border-[#EAE1CC] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="text-lg" style={heading}>Madnir</div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 rounded-[10px] border border-[#DED2B6] bg-white px-3 py-2.5 text-sm font-medium text-[#14231B] hover:border-[#134430] sm:px-4">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to dashboard</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#134430]">
            <Lightbulb className="h-6 w-6 text-[#FBF8F0]" />
          </div>
          <div>
            <h2 className="text-3xl" style={heading}>Send your suggestions</h2>
            <p className="mt-1 text-[16px] text-[#5C6B62]">Help {schoolName} improve.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#EAE1CC] bg-white p-5 sm:p-8">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Suggestion title</label>
              <input required placeholder="e.g., Improve canteen facilities" className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Category</label>
              <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Academic</option>
                <option>Infrastructure</option>
                <option>Canteen & Food</option>
                <option>Transport</option>
                <option>Facilities</option>
                <option>Curriculum</option>
                <option>Extracurricular</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Detailed suggestion</label>
              <textarea required rows={6} placeholder="Please provide detailed feedback on how we can improve..." className={`${fieldClass} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}

            <button disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-[#1B5E3F] py-4 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Send className="h-5 w-5" />Submit suggestion</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Suggestions
