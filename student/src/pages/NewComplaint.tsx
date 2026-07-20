import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Copy, Upload, X } from 'lucide-react'
import { apiUpload } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }
const CATEGORIES = ['Academic', 'Infrastructure', 'Transport', 'Canteen', 'Administrative', 'Other']
const MAX_LENGTH = 1000
const MAX_IMAGES = 5
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const NewComplaint: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Academic')
  const [priority, setPriority] = useState('Medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [complaintId, setComplaintId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [hasPhysicalDamage, setHasPhysicalDamage] = useState(false)
  const [damageDescription, setDamageDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [damageLocation, setDamageLocation] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState('')

  const studentName = localStorage.getItem('studentName') || 'Student'
  const schoolName = localStorage.getItem('schoolName') || 'Institution'

  useEffect(() => {
    const token = localStorage.getItem('studentToken')
    if (!token) navigate('/find-school')
  }, [])

  const handleCopyId = () => {
    if (complaintId) {
      navigator.clipboard.writeText(complaintId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddImages = (fileList: FileList | null) => {
    if (!fileList) return
    setImageError('')
    const incoming = Array.from(fileList)
    const accepted: File[] = []
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setImageError('Only JPG, PNG, and WEBP images are allowed')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setImageError('Each image must be under 5MB')
        continue
      }
      accepted.push(file)
    }
    setImages((prev) => {
      const combined = [...prev, ...accepted]
      if (combined.length > MAX_IMAGES) {
        setImageError(`You can attach up to ${MAX_IMAGES} images`)
        return combined.slice(0, MAX_IMAGES)
      }
      return combined
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      form.append('category', category)
      form.append('priority', priority)
      form.append('hasPhysicalDamage', String(hasPhysicalDamage))
      if (hasPhysicalDamage) {
        form.append('damageDescription', damageDescription)
        form.append('estimatedCost', estimatedCost)
        form.append('damageLocation', damageLocation)
        images.forEach((file) => form.append('images', file))
      }

      const res = await apiUpload('/complaints', form)
      if (res.success) {
        setComplaintId(res.data.complaintId)
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F0] p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E7F1E9]">
            <CheckCircle2 className="h-10 w-10 text-[#1B5E3F]" />
          </div>
          <h2 className="text-3xl" style={heading}>Complaint submitted</h2>
          <p className="mt-3 text-[16px] text-[#5C6B62]">Your case has been registered and is now being tracked.</p>

          {complaintId && (
            <div className="mt-8 rounded-2xl border border-[#EAE1CC] bg-white p-6">
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Your case number</div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-[#E7F1E9] p-4">
                <span className="text-2xl text-[#1B5E3F]" style={heading}>{complaintId}</span>
                <button
                  onClick={handleCopyId}
                  className={`rounded-lg p-2.5 transition-all ${copied ? 'bg-[#1B5E3F] text-white' : 'bg-white text-[#5C6B62] hover:bg-[#DED2B6]/40'}`}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="mt-2 text-sm font-medium text-[#1B5E3F]">Copied to clipboard</p>}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button onClick={() => navigate('/tracker')} className="w-full rounded-[10px] bg-[#1B5E3F] py-3.5 font-medium text-[#FBF8F0] hover:bg-[#134430]">
              Track your complaint
            </button>
            <button onClick={() => navigate('/dashboard')} className="w-full rounded-[10px] border border-[#DED2B6] bg-white py-3.5 font-medium text-[#14231B] hover:border-[#134430]">
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Step 1 of 2</div>
            <h1 className="mt-2 text-2xl sm:text-3xl" style={heading}>What happened?</h1>
            <p className="mt-2 max-w-xl text-[16px] text-[#5C6B62]">
              Write it in your own words. Nobody sees this except the staff member it is assigned to.
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="shrink-0 text-sm text-[#5C6B62] hover:text-[#134430]">Cancel</button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-4 py-2 text-sm transition ${category === c ? 'bg-[#1B5E3F] font-medium text-[#FBF8F0]' : 'border border-[#DED2B6] bg-white text-[#14231B] hover:border-[#134430]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="One line, so staff can find it later"
                className="w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="font-mono text-xs text-[#5C6B62]">Describe what happened</label>
                <span className="font-mono text-[12px] text-[#8B978F]">{description.length} / {MAX_LENGTH}</span>
              </div>
              <textarea
                required
                rows={6}
                maxLength={MAX_LENGTH}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened, where, and when?"
                className="w-full resize-none rounded-[10px] border border-[#1B5E3F]/25 bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Urgency</label>
              <div className="flex gap-1 rounded-[10px] border border-[#DED2B6] bg-white p-1">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg py-2 text-sm transition ${priority === p ? 'bg-[#134430] font-medium text-[#FBF8F0]' : 'text-[#5C6B62] hover:text-[#134430]'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Is there any physical damage?</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasPhysicalDamage(false)}
                  className={`flex-1 rounded-[10px] border py-3 text-sm font-medium transition ${!hasPhysicalDamage ? 'border-[#1B5E3F] bg-[#E7F1E9] text-[#134430]' : 'border-[#DED2B6] bg-white text-[#5C6B62] hover:border-[#134430]'}`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setHasPhysicalDamage(true)}
                  className={`flex-1 rounded-[10px] border py-3 text-sm font-medium transition ${hasPhysicalDamage ? 'border-[#1B5E3F] bg-[#E7F1E9] text-[#134430]' : 'border-[#DED2B6] bg-white text-[#5C6B62] hover:border-[#134430]'}`}
                >
                  Yes
                </button>
              </div>
            </div>

            {hasPhysicalDamage && (
              <div className="space-y-4 rounded-[10px] border border-[#DED2B6] bg-[#FBF8F0] p-4">
                <div>
                  <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Damage description</label>
                  <textarea
                    rows={3}
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="What got damaged, and how?"
                    className="w-full resize-none rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Estimated cost (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Location</label>
                    <input
                      value={damageLocation}
                      onChange={(e) => setDamageLocation(e.target.value)}
                      placeholder="e.g. Block C stairwell"
                      className="w-full rounded-[10px] border border-[#DED2B6] bg-white px-4 py-3 text-[16px] text-[#14231B] outline-none focus:border-[#1B5E3F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Upload images (optional, up to {MAX_IMAGES})</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#DED2B6] bg-white px-4 py-4 text-sm text-[#5C6B62] transition hover:border-[#1B5E3F]">
                    <Upload className="h-4 w-4" />
                    Choose photos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleAddImages(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {imageError && <p className="mt-2 text-xs text-[#A63A2E]">{imageError}</p>}

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {images.map((file, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-[#DED2B6]">
                          <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <div className="rounded-[10px] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">{error}</div>}

            <button
              disabled={loading}
              className="w-full rounded-[10px] bg-[#1B5E3F] py-4 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Submit complaint'}
            </button>
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">Filing as</div>
              <div className="mt-3 rounded-[10px] border border-[#1B5E3F] bg-[#E7F1E9] p-4">
                <div className="text-[16px] font-medium text-[#14231B]">{studentName}</div>
                <div className="mt-1 text-xs text-[#5C6B62]">{schoolName} · staff can reply to you directly</div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#134430] p-6">
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#2F7B55]">What happens next</div>
              <div className="mt-4 space-y-4 text-sm text-[#FBF8F0]">
                <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#FBF8F0]" />You get a case number</div>
                <div className="flex items-center gap-3 text-[#FBF8F0]/70"><span className="h-2 w-2 rounded-full bg-[#FBF8F0]/50" />Staff review within 48 hours</div>
                <div className="flex items-center gap-3 text-[#FBF8F0]/70"><span className="h-2 w-2 rounded-full bg-[#FBF8F0]/50" />You are told the outcome</div>
              </div>
              <p className="mt-4 text-xs text-[#FBF8F0]/45">Nothing appears on your report card.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewComplaint
