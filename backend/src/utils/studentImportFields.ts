// Canonical fields the student importer ultimately needs, shared between the
// heuristic fallback matcher, the LLM column mapper, and the actual import.
export const CANONICAL_FIELDS = ['fullName', 'admissionNumber', 'dob', 'contactNumber'] as const
export type CanonicalField = typeof CANONICAL_FIELDS[number]

export const FIELD_LABELS: Record<CanonicalField, string> = {
  fullName: 'Student Name',
  admissionNumber: 'Admission Number',
  dob: 'Date of Birth',
  contactNumber: 'Contact Number'
}

// Normalizes a header to a bare lowercase key (strips BOM, spaces, punctuation)
// so "Admission Number", "admission_number", "AdmissionNo" etc. all resolve the same way.
export function normalizeHeader(header: string) {
  return header.replace(/^﻿/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

const FIELD_ALIASES: Record<CanonicalField, string[]> = {
  fullName: ['fullname', 'name', 'studentname', 'childname'],
  admissionNumber: ['admissionnumber', 'admissionno', 'admissionid', 'admno', 'admn', 'rollno', 'rollnumber'],
  dob: ['dob', 'dateofbirth', 'birthdate', 'birthday'],
  contactNumber: ['contactnumber', 'contact', 'phone', 'mobile', 'mobilenumber', 'contactno', 'phonenumber', 'guardianphone', 'parentcontact']
}

// Best-effort column guess with no external calls: matches each header against
// known aliases first, then falls back to a substring/edit-distance nudge.
export function heuristicColumnGuess(headers: string[]): Record<CanonicalField, number | null> {
  const normalized = headers.map(normalizeHeader)
  const result: Record<CanonicalField, number | null> = {
    fullName: null,
    admissionNumber: null,
    dob: null,
    contactNumber: null
  }

  for (const field of CANONICAL_FIELDS) {
    let bestIndex: number | null = null
    for (const alias of FIELD_ALIASES[field]) {
      const idx = normalized.findIndex((h) => h === alias)
      if (idx !== -1) { bestIndex = idx; break }
    }
    if (bestIndex === null) {
      // Loose fallback: header contains the alias as a substring (e.g. "StudentFullName").
      for (const alias of FIELD_ALIASES[field]) {
        const idx = normalized.findIndex((h) => h.includes(alias))
        if (idx !== -1) { bestIndex = idx; break }
      }
    }
    result[field] = bestIndex
  }

  return result
}

// Indian school records overwhelmingly use DD-MM-YYYY / DD/MM/YYYY dates, which
// `new Date(...)` parses incorrectly or rejects outright. This parses day-first
// formats explicitly before falling back to native parsing for ISO/other formats.
// Always builds a UTC-midnight Date for a given calendar date. Student
// verification compares `new Date(student.dob).toISOString().slice(0, 10)`
// against a bare "YYYY-MM-DD" string from an <input type="date"> — per spec,
// that bare string parses as UTC midnight. Building DOBs with the LOCAL-time
// Date constructor (`new Date(y, m, d)`) instead of `Date.UTC` shifts the
// stored date back a day on any server whose timezone is ahead of UTC (e.g.
// IST, UTC+5:30), silently breaking every bulk-imported student's login.
function utcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  return isNaN(date.getTime()) ? null : date
}

export function parseDob(raw: string): Date | null {
  const trimmed = raw.trim()

  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const date = utcDate(Number(y), Number(m), Number(d))
    if (date) return date
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch
    if (y.length === 2) y = (Number(y) > 30 ? '19' : '20') + y
    const day = Number(d)
    const month = Number(m)
    const year = Number(y)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = utcDate(year, month, day)
      if (date) return date
    }
  }

  // Bare "YYYY-MM-DD" is parsed as UTC by the Date constructor per spec, so this
  // fallback stays consistent with the branches above for anything they missed.
  const fallback = new Date(trimmed)
  if (!isNaN(fallback.getTime())) return fallback

  return null
}

// Excel on Windows in many locales (including India) saves "CSV" with a `;`
// delimiter instead of `,` whenever the system's decimal separator isn't a dot.
export function detectDelimiter(headerLine: string): string {
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = 0
  for (const candidate of candidates) {
    const count = headerLine.split(candidate).length - 1
    if (count > bestCount) {
      bestCount = count
      best = candidate
    }
  }
  return best
}
