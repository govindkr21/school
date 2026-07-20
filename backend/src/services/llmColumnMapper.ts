import { CANONICAL_FIELDS, CanonicalField, heuristicColumnGuess } from '../utils/studentImportFields'

export interface ColumnMappingResult {
  mapping: Record<CanonicalField, number | null>
  usedAI: boolean
  aiError?: string
}

// Points at a locally-running model server with an OpenAI-compatible chat
// endpoint — Ollama (http://localhost:11434/v1) or LM Studio's local server
// (http://localhost:1234/v1) both work as-is. Model examples: qwen3:4b,
// qwen3:8b, gemma3, llama3.2, phi4-mini.
const BASE_URL = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434/v1'
const MODEL = process.env.LOCAL_LLM_MODEL || 'llama3.2'
const REQUEST_TIMEOUT_MS = 15_000

function buildPrompt(headers: string[], sampleRows: string[][]): string {
  const table = [headers, ...sampleRows]
    .map((row) => row.map((c) => (c ?? '').toString()).join(' | '))
    .join('\n')

  return `You are matching spreadsheet columns from a school's student roster export to a fixed set of fields.

Columns (0-indexed) and a few sample rows, pipe-separated:
${table}

Fields to identify, by column index:
- fullName: the student's full name
- admissionNumber: the school-issued admission/registration/roll number (an ID, not a phone number)
- dob: date of birth
- contactNumber: a phone/mobile/contact number (student's or guardian's)

Respond with ONLY a JSON object, no prose, no markdown fences, exactly this shape:
{"fullName": <index or null>, "admissionNumber": <index or null>, "dob": <index or null>, "contactNumber": <index or null>}

If a field has no matching column, use null. Use each column index at most once.`
}

function parseModelJson(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(jsonSlice)
}

function validateMapping(raw: any, headerCount: number): Record<CanonicalField, number | null> | null {
  if (!raw || typeof raw !== 'object') return null
  const result: Record<CanonicalField, number | null> = { fullName: null, admissionNumber: null, dob: null, contactNumber: null }
  const used = new Set<number>()
  for (const field of CANONICAL_FIELDS) {
    const value = raw[field]
    if (value === null || value === undefined) { result[field] = null; continue }
    const idx = Number(value)
    if (!Number.isInteger(idx) || idx < 0 || idx >= headerCount || used.has(idx)) return null
    used.add(idx)
    result[field] = idx
  }
  return result
}

export async function suggestColumnMapping(headers: string[], sampleRows: string[][]): Promise<ColumnMappingResult> {
  const heuristic = heuristicColumnGuess(headers)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 300,
        messages: [{ role: 'user', content: buildPrompt(headers, sampleRows.slice(0, 8)) }]
      })
    })

    if (!response.ok) throw new Error(`Local model server responded ${response.status}`)

    const body: any = await response.json()
    const text = body?.choices?.[0]?.message?.content
    if (!text) throw new Error('No text in model response')

    const parsed = parseModelJson(text)
    const validated = validateMapping(parsed, headers.length)
    if (!validated) throw new Error('Model returned an unusable mapping shape')

    // Fill in anything the model left null with the heuristic guess, so partial
    // AI answers still benefit from the free alias-based fallback.
    for (const field of CANONICAL_FIELDS) {
      if (validated[field] === null && heuristic[field] !== null) validated[field] = heuristic[field]
    }

    return { mapping: validated, usedAI: true }
  } catch (err: any) {
    const reason = err.name === 'AbortError' ? 'Local model server timed out' : err.message
    return { mapping: heuristic, usedAI: false, aiError: `${reason} (expected a local model server at ${BASE_URL})` }
  } finally {
    clearTimeout(timeout)
  }
}
