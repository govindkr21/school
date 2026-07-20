import { Request, Response } from 'express'
import Suggestion from '../models/Suggestion'
import Student from '../models/Student'

export async function createSuggestion(req: Request, res: Response) {
  const user = (req as any).user
  if (!user || user.role !== 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' })

  const { title, description, category } = req.body
  if (!title || !description) return res.status(400).json({ success: false, message: 'Missing fields' })

  const student = await Student.findById(user.studentId)
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const suggestion = await Suggestion.create({
    schoolId: student.schoolId,
    studentId: student._id,
    title,
    description,
    category
  })

  return res.json({
    success: true,
    message: 'Suggestion submitted successfully',
    data: { _id: suggestion._id }
  })
}

export async function adminListSuggestions(req: Request, res: Response) {
  const admin = (req as any).user
  const { page = 1, limit = 50 } = req.query
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })

  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50))
  const skip = (pageNum - 1) * limitNum

  const q = { schoolId: admin.schoolId }

  const suggestions = await Suggestion.find(q)
    .select('title description category createdAt studentId')
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  const total = await Suggestion.countDocuments(q)

  const studentIds = [...new Set(suggestions.map(s => s.studentId))]
  const students = await Student.find({ _id: { $in: studentIds } })
    .select('_id fullName admissionNumber')
    .lean()

  const studentMap = new Map(students.map(s => [s._id.toString(), s]))

  const enriched = suggestions.map(s => ({
    ...s,
    studentId: studentMap.get(s.studentId.toString()) || {}
  }))

  return res.json({
    success: true,
    data: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
}
