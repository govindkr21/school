export type AdminProfile = {
  adminId?: string
  schoolId?: string
  email?: string
  orgName?: string
  adminName?: string
}

export function getAdminToken() {
  return localStorage.getItem('admin_token') || localStorage.getItem('adminToken')
}

export function setAdminSession(token: string, profile: AdminProfile) {
  localStorage.setItem('admin_token', token)
  localStorage.setItem('admin_profile', JSON.stringify(profile))
}

export function setAdminProfile(profile: AdminProfile) {
  localStorage.setItem('admin_profile', JSON.stringify(profile))
}

export function clearAdminSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('adminToken')
  localStorage.removeItem('admin_profile')
}

export function getAdminProfile(): AdminProfile {
  try {
    return JSON.parse(localStorage.getItem('admin_profile') || '{}')
  } catch {
    return {}
  }
}
