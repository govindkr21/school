const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
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
