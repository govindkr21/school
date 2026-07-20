import crypto from 'crypto'

export interface ImportSession {
  schoolId: string
  headers: string[]
  rows: string[][]
  originalFilename: string
  createdAt: number
}

const SESSION_TTL_MS = 20 * 60 * 1000
const sessions = new Map<string, ImportSession>()

export function createImportSession(data: Omit<ImportSession, 'createdAt'>): string {
  const importId = crypto.randomUUID()
  sessions.set(importId, { ...data, createdAt: Date.now() })
  return importId
}

// Returns the session only if it exists, hasn't expired, and belongs to the
// requesting school — prevents one school's admin from reading another's
// in-flight import by guessing/reusing an importId.
export function getImportSession(importId: string, schoolId: string): ImportSession | null {
  const session = sessions.get(importId)
  if (!session) return null
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(importId)
    return null
  }
  if (session.schoolId !== schoolId) return null
  return session
}

export function deleteImportSession(importId: string) {
  sessions.delete(importId)
}

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id)
  }
}, 5 * 60 * 1000).unref()
