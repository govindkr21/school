import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { clearAdminSession, getAdminProfile } from '../lib/session'
import { apiGet } from '../lib/api'

const heading = { fontFamily: "'Vesper Libre', serif" }

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  'flex items-center justify-between rounded-[10px] px-4 py-3 text-[16px] transition ' +
  (isActive ? 'bg-[#FBF8F0] font-medium text-[#134430]' : 'text-[#FBF8F0]/65 hover:bg-white/5')

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const profile = getAdminProfile()
  const [openCount, setOpenCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    apiGet('/complaints/admin/stats')
      .then((res) => {
        if (active) setOpenCount(res?.data?.stats?.active ?? null)
      })
      .catch(() => {
        if (active) setOpenCount(null)
      })
    return () => {
      active = false
    }
  }, [])

  const handleLogout = () => {
    clearAdminSession()
    navigate('/login')
  }

  const handleNavClick = () => onClose()

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col justify-between overflow-y-auto bg-[#134430] p-4 text-[#FBF8F0] transition-transform duration-200 ease-out ' +
          'md:static md:z-auto md:h-screen md:w-64 md:max-w-none md:translate-x-0 ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div>
          <div className="mb-8 flex items-center justify-between rounded-2xl bg-[#1B5E3F]/55 px-4 py-4">
            <div>
              <div className="text-lg" style={heading}>Madnir</div>
              <div className="mt-1 font-mono text-[12px] text-[#FBF8F0]/50">{profile.orgName || 'District Central'}</div>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-[#FBF8F0]/70 hover:bg-white/10 md:hidden" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink to="/dashboard" className={navLinkClass} onClick={handleNavClick}>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/complaints" className={navLinkClass} onClick={handleNavClick}>
              <span>Complaints</span>
              {openCount !== null && (
                <span className="rounded-full bg-[#1B5E3F] px-2 py-0.5 font-mono text-[12px]">{openCount}</span>
              )}
            </NavLink>
            <NavLink to="/students" className={navLinkClass} onClick={handleNavClick}>
              <span>Students</span>
            </NavLink>
            <NavLink to="/suggestions" className={navLinkClass} onClick={handleNavClick}>
              <span>Suggestions</span>
            </NavLink>
            <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick}>
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        <div>
          <button
            onClick={() => { onClose(); navigate('/students') }}
            className="mb-4 w-full rounded-xl bg-[#FBF8F0] py-3 text-sm font-semibold text-[#134430] transition hover:bg-white"
          >
            Quick action: add student
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-[#FBF8F0]/12 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B5E3F] font-mono text-sm">
              {(profile.adminName || profile.email || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{profile.adminName || profile.email || 'Admin account'}</div>
              <div className="truncate font-mono text-[12px] text-[#FBF8F0]/50">{profile.schoolId || 'ACTIVE'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-3 w-full rounded-xl border border-[#FBF8F0]/15 py-2.5 text-sm text-[#FBF8F0]/80 transition hover:bg-white/5">
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
