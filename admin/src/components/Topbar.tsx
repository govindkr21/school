import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { getAdminProfile } from '../lib/session'
import { apiGet } from '../lib/api'

type NotificationItem = {
  complaintId: string
  status: string
  title: string
  createdAt: string
}

interface TopbarProps {
  onMenuClick: () => void
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const profile = getAdminProfile()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let active = true
    async function loadNotifications() {
      setLoading(true)
      try {
        const res = await apiGet('/complaints/admin')
        if (!active) return
        const rows = (res.data || []) as any[]
        setNotifications(
          rows
            .filter((r) => r.status !== 'RESOLVED')
            .slice(0, 6)
            .map((r) => ({
              complaintId: r.complaintId,
              status: r.status,
              title: r.title,
              createdAt: r.createdAt
            }))
        )
      } catch {
        if (!active) return
        setNotifications([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNotifications()
    const timer = setInterval(loadNotifications, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const unreadCount = useMemo(() => notifications.length, [notifications])

  return (
    <header className="flex items-center justify-between gap-2 border-b border-[#EAE1CC] bg-[#FBF8F0]/95 px-3 py-3.5 backdrop-blur sm:px-5 md:px-8">
      <button onClick={onMenuClick} className="shrink-0 rounded-full border border-[#DED2B6] bg-white p-2.5 text-[#5C6B62] md:hidden" aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 rounded-[10px] border border-[#EAE1CC] bg-white px-3 py-2.5 sm:max-w-md sm:px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B978F" strokeWidth="1.6" className="shrink-0"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            className="w-full min-w-0 bg-transparent text-sm text-[#14231B] outline-none placeholder:text-[#8B978F]"
            placeholder="Search by case ID, student, or keyword"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="relative rounded-full border border-[#DED2B6] bg-white p-2.5 text-[#5C6B62]" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#A63A2E] px-1 font-mono text-[11px] font-bold text-white">{unreadCount}</span>
            )}
          </button>

          {open && (
            <div className="fixed left-3 right-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[#EAE1CC] bg-white p-3 shadow-[0_20px_50px_rgba(19,68,48,0.14)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-h-none">
              <div className="mb-2 text-sm font-semibold text-[#14231B]">Active complaints</div>
              {loading && <div className="py-4 text-sm text-[#5C6B62]">Loading...</div>}
              {!loading && notifications.length === 0 && <div className="py-4 text-sm text-[#5C6B62]">No active complaints.</div>}
              {!loading && notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <button
                      key={n.complaintId}
                      onClick={() => {
                        setOpen(false)
                        navigate('/complaints')
                      }}
                      className="w-full rounded-xl border border-[#EAE1CC] p-2 text-left transition hover:bg-[#FBF8F0]"
                    >
                      <div className="font-mono text-xs text-[#1B5E3F]">{n.complaintId}</div>
                      <div className="line-clamp-1 text-sm text-[#14231B]">{n.title}</div>
                      <div className="font-mono text-[12px] text-[#8B978F]">{n.status}</div>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setOpen(false); navigate('/complaints') }} className="mt-3 w-full rounded-xl border border-[#DED2B6] py-2 text-sm text-[#14231B] hover:border-[#134430]">Open manage complaints</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B5E3F] font-mono text-sm text-[#FBF8F0]">
            {(profile.adminName || profile.email || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-[#14231B]">{profile.adminName || 'Admin'}</div>
            <div className="font-mono text-[12px] text-[#8B978F]">{profile.orgName || profile.email || ''}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
