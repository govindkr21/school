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

type ApiError = Error & { status?: number; data?: unknown }

const STUDENT_SESSION_KEYS = [
  'studentToken',
  'studentSchoolId',
  'studentName',
  'schoolName',
  'studentAdmissionNumber'
]

function clearStudentSession() {
  STUDENT_SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
}

function throwApiError(response: Response, payload: any): never {
  const message = payload?.message || 'Request failed'

  // Only treat authentication-middleware responses as an expired login.
  // CAPTCHA endpoints also use 401 for a wrong answer and must not sign the
  // student out in that case.
  if (response.status === 401 && (message === 'Unauthorized' || message === 'Invalid token')) {
    clearStudentSession()
    const publicPaths = ['/', '/find-school', '/verify']
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.replace('/find-school')
    }
  }

  const error = new Error(message) as ApiError
  error.status = response.status
  error.data = payload?.data
  throw error
}

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
  if (!response.ok) throwApiError(response, payload)
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
  if (!response.ok) throwApiError(response, payload)
  return payload
}

export async function apiUpload(path: string, form: FormData) {
  const token = localStorage.getItem('studentToken')
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 90_000)
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      // The browser must set multipart/form-data and its boundary.
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: form,
      signal: controller.signal
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throwApiError(response, payload?.message ? payload : { message: `Upload failed (${response.status})` })
    return payload
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('Image upload timed out. Check your connection and try again.')
    if (error instanceof TypeError) throw new Error('Could not reach the server. Check your connection and try again.')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
