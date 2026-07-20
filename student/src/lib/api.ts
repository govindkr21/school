const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export async function apiGet(path: string) {
  const token = localStorage.getItem('studentToken')
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || 'Request failed')
  return payload
}

export async function apiPost(path: string, body: any) {
  const token = localStorage.getItem('studentToken')
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || 'Request failed')
  return payload
}

export async function apiUpload(path: string, form: FormData) {
  const token = localStorage.getItem('studentToken')
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    // No Content-Type here — the browser sets multipart/form-data with the
    // correct boundary itself when the body is a FormData instance.
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: form
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || 'Request failed')
  return payload
}
