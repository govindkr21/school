const DEFAULT_API_BASE = 'http://localhost:4000/api/v1'

function getApiBaseUrl() {
  const configuredBase = (import.meta as any).env?.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE
  const baseWithProtocol = /^https?:\/\//i.test(configuredBase)
    ? configuredBase
    : `https://${configuredBase}`

  try {
    const url = new URL(baseWithProtocol)
    const hostname = url.hostname

    // Protect deployments from an accidentally pasted Railway URL twice, e.g.
    // "school.up.railway.appschool.up.railway.app/api/v1".
    for (let half = 1; half <= hostname.length / 2; half += 1) {
      const firstHalf = hostname.slice(0, half)
      if (firstHalf.endsWith('.up.railway.app') && firstHalf.repeat(2) === hostname) {
        url.hostname = firstHalf
        break
      }
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_API_BASE
  }
}

const API_BASE = getApiBaseUrl()
import { getAdminToken } from './session'

export async function apiPost(path: string, body: unknown) {
  const token = getAdminToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed') as Error & { data?: any }
    err.data = payload?.data
    throw err
  }

  return payload
}

export async function apiGet(path: string) {
  const token = getAdminToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed') as Error & { data?: any }
    err.data = payload?.data
    throw err
  }

  return payload
}

export async function apiPatch(path: string, body: unknown) {
  const token = getAdminToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed') as Error & { data?: any }
    err.data = payload?.data
    throw err
  }

  return payload
}

export async function apiUpload(path: string, form: FormData) {
  const token = getAdminToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: form
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed') as Error & { data?: any }
    err.data = payload?.data
    throw err
  }
  return payload
}

export async function apiPut(path: string, body: unknown) {
  const token = getAdminToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed') as Error & { data?: any }
    err.data = payload?.data
    throw err
  }

  return payload
}

export function getApiBase() {
  return API_BASE
}
