import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Menu } from 'lucide-react'
import { getAdminProfile } from '../lib/session'
import { apiGet, apiPost } from '../lib/api'
import BrandLogo from './BrandLogo'

type NotificationItem = {
  complaintId: string
  status: string
  title: string
  createdAt: string
  isRead: boolean
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
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await apiGet('/complaints/admin/notifications')
      setNotifications((res.data || []) as NotificationItem[])
      setUnreadCount(Number(res.unreadCount) || 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    if (active) loadNotifications(true)
    const timer = setInterval(() => { if (active) loadNotifications() }, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [loadNotifications])

  async function markAsRead(complaintId: string) {
    const target = notifications.find((notification) => notification.complaintId === complaintId)
    if (!target || target.isRead) return
    await apiPost(`/complaints/admin/notifications/${encodeURIComponent(complaintId)}/read`, {})
    setNotifications((items) => items.map((item) => item.complaintId === complaintId ? { ...item, isRead: true } : item))
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  async function markAllAsRead() {
    await apiPost('/complaints/admin/notifications/read-all', {})
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
  }

  async function openComplaint(notification: NotificationItem) {
    try {
      await markAsRead(notification.complaintId)
    } catch {
      // Opening the complaint must still work if the read-state request fails.
    }
    setOpen(false)
    navigate(`/complaints?id=${encodeURIComponent(notification.complaintId)}`)
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-[#EAE1CC] bg-[#FBF8F0]/95 px-3 py-3.5 backdrop-blur sm:px-5 md:px-8">
      <button onClick={onMenuClick} className="shrink-0 rounded-full border border-[#DED2B6] bg-white p-2.5 text-[#5C6B62] md:hidden" aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </button>
      <BrandLogo className="h-10 w-10 shrink-0 md:hidden" priority />
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
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#14231B]">Active complaints</div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead().catch(() => undefined)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#134430] hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
                  </button>
                )}
              </div>
              {loading && <div className="py-4 text-sm text-[#5C6B62]">Loading...</div>}
              {!loading && notifications.length === 0 && <div className="py-4 text-sm text-[#5C6B62]">No active complaints.</div>}
              {!loading && notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.complaintId} className={`rounded-xl border p-2 transition ${n.isRead ? 'border-[#EAE1CC] bg-white' : 'border-[#BFE0CC] bg-[#F2F8F4]'}`}>
                      <button onClick={() => openComplaint(n)} className="w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-xs text-[#1B5E3F]">{n.complaintId}</div>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#A63A2E]" aria-label="Unread" />}
                        </div>
                        <div className="line-clamp-1 text-sm text-[#14231B]">{n.title}</div>
                        <div className="font-mono text-[12px] text-[#8B978F]">{n.status}</div>
                      </button>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.complaintId).catch(() => undefined)}
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#134430] hover:underline"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as read
                        </button>
                      )}
                    </div>
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
