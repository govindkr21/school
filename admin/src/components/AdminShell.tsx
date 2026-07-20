import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { apiGet } from '../lib/api'
import { getAdminProfile, getAdminToken, setAdminProfile } from '../lib/session'

const AdminShell: React.FC = () => {
  const [profileBootstrapped, setProfileBootstrapped] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    async function bootstrapProfile() {
      const token = getAdminToken()
      if (!token) {
        setProfileBootstrapped(true)
        return
      }

      const cached = getAdminProfile()
      if (cached?.schoolId && cached?.email && cached?.orgName) {
        setProfileBootstrapped(true)
        return
      }

      try {
        const res = await apiGet('/auth/admin/me')
        setAdminProfile(res.data || {})
      } catch {
        // Keep shell usable even if profile refresh fails.
      } finally {
        setProfileBootstrapped(true)
      }
    }

    bootstrapProfile()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBF8F0] text-[#14231B]" style={{ fontFamily: "'Vesper Libre', serif" }}>
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 md:p-8 lg:p-10">
          {profileBootstrapped && <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AdminShell
