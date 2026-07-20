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
