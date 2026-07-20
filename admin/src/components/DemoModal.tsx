import React, { useState } from 'react'

const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    pincode: '',
    phone: '',
    email: ''
  })

  if (!isOpen) return null

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const message = `*Madnir Demo Request*%0A%0A*Name:* ${formData.name}%0A*School/Org:* ${formData.schoolName}%0A*Pincode:* ${formData.pincode}%0A*Phone:* ${formData.phone}%0A*Email:* ${formData.email}`
    window.open(`https://wa.me/917303313269?text=${message}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Request for Demo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
          <input required placeholder="Your Name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#1B5E3F] focus:bg-white transition-all font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input required placeholder="Organization/School Name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#1B5E3F] focus:bg-white transition-all font-medium" value={formData.schoolName} onChange={e => setFormData({ ...formData, schoolName: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Pincode" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#1B5E3F] focus:bg-white transition-all font-medium" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
            <input required placeholder="Phone Number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#1B5E3F] focus:bg-white transition-all font-medium" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <input required type="email" placeholder="Email Address" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#1B5E3F] focus:bg-white transition-all font-medium" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <button type="submit" className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
            Submit via WhatsApp
          </button>
        </form>
      </div>
    </div>
  )
}

export default DemoModal
