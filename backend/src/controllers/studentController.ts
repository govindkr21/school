import { Request, Response } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import Student from '../models/Student'
import School from '../models/School'
import { issueMathCaptcha, verifyMathCaptcha } from '../services/mathCaptchaService'
import { parseWorkbook } from '../services/workbookParser'
import { suggestColumnMapping } from '../services/llmColumnMapper'
import { createImportSession, getImportSession, deleteImportSession } from '../services/importSessionStore'
import { CanonicalField, FIELD_LABELS, parseDob } from '../utils/studentImportFields'

// multer setup
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    // .xls (legacy binary Excel) isn't supported by the xlsx parser we use — only
    // modern .xlsx (OOXML) and .csv.
    if (['.csv', '.xlsx'].includes(ext)) cb(null, true)
    else cb(new Error('Only .csv or .xlsx files are accepted'))
  }
})

export const uploadMiddleware = upload.single('file')

// Step 1: parse the uploaded workbook, ask the LLM (with a heuristic fallback)
// which column maps to which field, and hold the parsed rows in memory so the
// admin can review/adjust the mapping before anything is written to the DB.
export async function analyzeStudentImport(req: Request, res: Response) {
  const file = (req as any).file
  const admin = (req as any).user
  if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })

  let parsed
  try {
    parsed = await parseWorkbook(file.path, file.originalname)
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Failed to read file: ' + err.message })
  } finally {
    try { fs.unlinkSync(file.path) } catch (e) { }
  }

  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return res.status(400).json({ success: false, message: 'The file had no readable header row or data rows.' })
  }

  const { mapping, usedAI, aiError } = await suggestColumnMapping(parsed.headers, parsed.rows)

  const importId = createImportSession({
    schoolId: admin.schoolId,
    headers: parsed.headers,
    rows: parsed.rows,
    originalFilename: file.originalname
  })

  return res.json({
    success: true,
    data: {
      importId,
      headers: parsed.headers,
      sampleRows: parsed.rows.slice(0, 5),
      totalRows: parsed.rows.length,
      suggestedMapping: mapping,
      fieldLabels: FIELD_LABELS,
      aiUsed: usedAI,
      aiNote: usedAI ? undefined : (aiError || 'AI mapping unavailable, used rule-based matching instead')
    }
  })
}

// Step 2: the admin has confirmed (or corrected) which column is which. Clean,
// validate, dedupe and import using the exact mapping — no more guessing.
export async function confirmStudentImport(req: Request, res: Response) {
  const admin = (req as any).user
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })

  const { importId, mapping } = req.body as { importId?: string; mapping?: Partial<Record<CanonicalField, number | null>> }
  if (!importId || !mapping) return res.status(400).json({ success: false, message: 'Missing importId or mapping' })

  const session = getImportSession(importId, admin.schoolId)
  if (!session) return res.status(410).json({ success: false, message: 'This import has expired — please upload the file again' })

  for (const field of ['fullName', 'admissionNumber', 'dob'] as CanonicalField[]) {
    const idx = mapping[field]
    if (idx === null || idx === undefined || idx < 0 || idx >= session.headers.length) {
      return res.status(400).json({ success: false, message: `Please select a column for ${FIELD_LABELS[field]}` })
    }
  }

  const results: { schoolId: string; fullName: string; admissionNumber: string; dob: Date; contactNumber: string }[] = []
  const errors: { row?: number; admissionNumber?: string; reason: string }[] = []
  const total = session.rows.length

  session.rows.forEach((row, i) => {
    const get = (field: CanonicalField) => {
      const idx = mapping[field]
      if (idx === null || idx === undefined) return ''
      return (row[idx] ?? '').toString().trim()
    }
    const fullName = get('fullName')
    const admissionNumber = get('admissionNumber')
    const dobRaw = get('dob')
    const contactNumber = get('contactNumber')

    if (!fullName || !admissionNumber || !dobRaw) {
      errors.push({ row: i + 2, reason: 'Missing required fields (name, admission number or DOB)' })
      return
    }
    const dob = parseDob(dobRaw)
    if (!dob) {
      errors.push({ row: i + 2, reason: `Invalid DOB "${dobRaw}" — use YYYY-MM-DD or DD-MM-YYYY` })
      return
    }

    results.push({ schoolId: admin.schoolId, fullName, admissionNumber, dob, contactNumber })
  })

  // Dedupe within the file itself first (keep the first occurrence of each admission number).
  const seenInFile = new Set<string>()
  const uniqueRows: typeof results = []
  for (const r of results) {
    if (seenInFile.has(r.admissionNumber)) {
      errors.push({ admissionNumber: r.admissionNumber, reason: 'Duplicate admission number in file' })
      continue
    }
    seenInFile.add(r.admissionNumber)
    uniqueRows.push(r)
  }

  // Drop rows that already exist for this school, in one query instead of one-per-row.
  let existingAdmissionNumbers = new Set<string>()
  try {
    const existing = await Student.find({
      schoolId: admin.schoolId,
      admissionNumber: { $in: uniqueRows.map((r) => r.admissionNumber) }
    }).select('admissionNumber')
    existingAdmissionNumbers = new Set(existing.map((s) => s.admissionNumber))
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Database error while checking duplicates: ' + err.message })
  }

  const toInsert = uniqueRows.filter((r) => {
    if (existingAdmissionNumbers.has(r.admissionNumber)) {
      errors.push({ admissionNumber: r.admissionNumber, reason: 'Duplicate admission number (already registered)' })
      return false
    }
    return true
  })

  let insertedCount = 0
  try {
    if (toInsert.length > 0) {
      const inserted = await Student.insertMany(toInsert, { ordered: false })
      insertedCount = inserted.length
    }
  } catch (err: any) {
    // insertMany with ordered:false still inserts everything it can; bulk write errors
    // list exactly which documents failed (e.g. a race on the unique index).
    const writeErrors = err?.writeErrors || []
    insertedCount = toInsert.length - writeErrors.length
    for (const we of writeErrors) {
      const failedDoc = toInsert[we.index]
      errors.push({ admissionNumber: failedDoc?.admissionNumber, reason: 'Failed to save (duplicate or invalid data)' })
    }
    if (writeErrors.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to save students: ' + err.message })
    }
  }

  deleteImportSession(importId)

  const message = insertedCount > 0
    ? `Added ${insertedCount} of ${total} student${total === 1 ? '' : 's'}${errors.length ? ` (${errors.length} skipped)` : ''}`
    : `No students were added — all ${total} row${total === 1 ? '' : 's'} failed (see details below)`

  return res.json({
    success: true,
    message,
    data: { total, insertedCount, failedCount: errors.length, errors }
  })
}

export async function manualAddStudent(req: Request, res: Response) {
  const { fullName, admissionNumber, dob, className, section, rollNumber, contactNumber } = req.body
  const admin = (req as any).user
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })
  if (!fullName || !admissionNumber || !dob) return res.status(400).json({ success: false, message: 'Missing fields' })
  const existing = await Student.findOne({ schoolId: admin.schoolId, admissionNumber })
  if (existing) return res.status(409).json({ success: false, message: 'Duplicate admission number' })
  const student = await Student.create({ schoolId: admin.schoolId, fullName, admissionNumber, dob: new Date(dob), contactNumber, className, section, rollNumber })
  return res.json({ success: true, message: 'Student created', data: student })
}

export async function verifyStudent(req: Request, res: Response) {
  const { schoolId, fullName, admissionNumber, dob } = req.body
  if (!schoolId || !fullName || !admissionNumber || !dob) return res.status(400).json({ success: false, message: 'Missing fields' })
  const school = await School.findOne({ schoolId, status: 'ACTIVE' })
  if (!school) return res.status(404).json({ success: false, message: 'School not found or inactive' })
  const student = await Student.findOne({ schoolId, admissionNumber })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
  // match fullName & dob
  const nameMatch = student.fullName.toLowerCase().trim() === fullName.toLowerCase().trim()
  const dobMatch = new Date(student.dob).toISOString().slice(0, 10) === new Date(dob).toISOString().slice(0, 10)
  if (!nameMatch || !dobMatch) return res.status(401).json({ success: false, message: 'Verification failed' })

  const captcha = issueMathCaptcha({
    studentId: student._id.toString(),
    schoolId: student.schoolId,
    admissionNumber: student.admissionNumber
  })

  return res.json({ 
    success: true, 
    message: 'Student details verified. Complete the math challenge to sign in.',
    data: { 
      requiresCaptcha: true,
      captcha
    } 
  })
}

export async function confirmCaptchaAndLogin(req: Request, res: Response) {
  const { captchaToken, answer } = req.body
  if (!captchaToken || answer === undefined || answer === null) {
    return res.status(400).json({ success: false, message: 'CAPTCHA token and answer are required' })
  }

  const result = verifyMathCaptcha(String(captchaToken), answer)
  if (!result.ok) {
    if (result.reason === 'EXPIRED') {
      return res.status(410).json({ success: false, message: 'Math challenge expired. Please request a new one.' })
    }
    if (result.reason === 'WRONG_ANSWER') {
      return res.status(401).json({ success: false, message: 'Incorrect answer. Please try again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid math challenge. Please request a new one.' })
  }

  const student = await Student.findOne({
    _id: result.identity.studentId,
    schoolId: result.identity.schoolId,
    admissionNumber: result.identity.admissionNumber
  })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const secret = process.env.JWT_SECRET || 'replace_me'
  const expiresIn = (process.env.STUDENT_TOKEN_EXPIRES || '7d') as jwt.SignOptions['expiresIn']
  const token = jwt.sign({ studentId: student._id, schoolId: student.schoolId, role: 'STUDENT' }, secret, { expiresIn })

  return res.json({ 
    success: true, 
    message: 'Verified',
    data: { 
      token, 
      studentId: student._id,
      fullName: student.fullName
    } 
  })
}


export async function searchSchools(req: Request, res: Response) {
  const { state, district, query } = req.query
  const filter: any = { status: 'ACTIVE' }
  if (state) filter.state = state
  if (district) filter.district = district
  if (query) {
    filter.name = { $regex: query, $options: 'i' }
  }

  try {
    const schools = await School.find(filter).select('schoolId name state district').limit(50)
    return res.json({ success: true, data: schools })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function adminListStudents(req: Request, res: Response) {
  const admin = (req as any).user
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })
  const students = await Student.find({ schoolId: admin.schoolId }).sort({ createdAt: -1 }).limit(5000)
  students.sort((a, b) => {
    const aNum = parseInt(a.admissionNumber) || 0
    const bNum = parseInt(b.admissionNumber) || 0
    return aNum - bNum
  })
  return res.json({ success: true, data: students })
}
