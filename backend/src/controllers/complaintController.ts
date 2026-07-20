import { Request, Response } from 'express'
import Complaint from '../models/Complaint'
import Student from '../models/Student'
import School from '../models/School'
import Admin from '../models/Admin'
import Suggestion from '../models/Suggestion'
import { generateComplaintId } from '../utils/idGenerator'
import { recordActivity, getTimeline, synthesizeTimelineFromHistory, STATUS_TITLES } from '../services/activityService'
import { uploadComplaintImage } from '../services/imageUploadService'

export async function createComplaint(req: Request, res: Response) {
  const user = (req as any).user
  if (!user || user.role !== 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' })

  const { title, description, category, priority, hasPhysicalDamage, damageDescription, estimatedCost, damageLocation } = req.body
  if (!title || !description) return res.status(400).json({ success: false, message: 'Missing fields' })

  // Ensure student exists
  const student = await Student.findById(user.studentId)
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  // RATE LIMITING: Check if student already filed a complaint today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const complaintToday = await Complaint.findOne({
    studentId: student._id,
    createdAt: { $gte: today }
  })

  if (complaintToday) {
    return res.status(400).json({
      success: false,
      message: 'You can only file one complaint per day. Please try again tomorrow.'
    })
  }

  // Get school details to extract name for complaint ID
  const school = await School.findOne({ schoolId: student.schoolId })
  if (!school) return res.status(404).json({ success: false, message: 'School not found' })

  // Generate complaint ID based on school name (e.g., abc1, abc2)
  const complaintId = await generateComplaintId(school.name)

  const damageReported = hasPhysicalDamage === 'true' || hasPhysicalDamage === true
  const files = ((req as any).files || []) as Express.Multer.File[]
  let physicalDamage: any = undefined

  if (damageReported) {
    let images: { secureUrl: string; publicId: string }[] = []
    try {
      images = await Promise.all(files.map((f) => uploadComplaintImage(f)))
    } catch (err) {
      console.error('Damage image upload failed', err)
      return res.status(502).json({ success: false, message: 'Failed to upload damage images. Please try again.' })
    }
    physicalDamage = {
      hasDamage: true,
      description: damageDescription?.trim(),
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      location: damageLocation?.trim(),
      images
    }
  }

  // Create complaint with IN_PROGRESS status and initial status history
  const complaint = await Complaint.create({
    complaintId,
    schoolId: student.schoolId,
    studentId: student._id,
    title,
    description,
    category,
    priority,
    physicalDamage,
    status: 'IN_PROGRESS',
    statusHistory: [
      {
        status: 'IN_PROGRESS',
        changedAt: new Date(),
        changedBy: 'SYSTEM',
        message: 'Complaint received and registered'
      }
    ]
  })

  await recordActivity({
    complaintId: complaint.complaintId,
    status: complaint.status,
    actionTitle: 'Complaint submitted',
    actionDescription: damageReported ? 'Complaint received and registered, with reported physical damage' : 'Complaint received and registered',
    performedBy: student.fullName,
    role: 'SYSTEM'
  })

  return res.json({
    success: true,
    message: 'Complaint created successfully',
    data: {
      complaintId: complaint.complaintId,
      _id: complaint._id,
      status: complaint.status
    }
  })
}

export async function trackComplaint(req: Request, res: Response) {
  const { complaintId } = req.params
  if (!complaintId) return res.status(400).json({ success: false, message: 'Missing complaintId' })
  const complaint = await Complaint.findOne({ complaintId })
    .select('complaintId title status description category priority assignedTo physicalDamage createdAt updatedAt resolvedAt statusHistory messages')
    .populate('studentId', 'fullName admissionNumber')
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' })

  let timeline = await getTimeline(complaint.complaintId)
  if (timeline.length === 0) {
    timeline = synthesizeTimelineFromHistory(complaint) as any
  }

  return res.json({ success: true, data: { ...complaint.toObject(), timeline } })
}

export async function getMyComplaints(req: Request, res: Response) {
  const user = (req as any).user
  if (!user || user.role !== 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' })
  
  const student = await Student.findById(user.studentId)
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
  
  const { page = 1, limit = 20, filter = 'active' } = req.query
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20))
  const skip = (pageNum - 1) * limitNum
  
  // Separate active and resolved complaints
  let query: any = { studentId: student._id }
  
  if (filter === 'resolved') {
    query.status = 'RESOLVED'
  } else if (filter === 'active' || !filter) {
    query.status = { $in: ['PENDING', 'IN_PROGRESS'] }
  }
  // else if filter is 'all', no status filter is applied
  
  // Use lean() for faster queries
  const complaints = await Complaint.find(query)
    .select('complaintId title status category priority description assignedTo createdAt updatedAt resolvedAt statusHistory messages')
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
  
  const total = await Complaint.countDocuments(query)
  
  // Transform to include message count and latest admin message preview
  const transformedComplaints = complaints.map(c => {
    const messageCount = c.messages?.filter(m => m.sender === 'ADMIN').length || 0
    const latestAdminMessage = c.messages?.filter(m => m.sender === 'ADMIN').reverse()[0]
    const latestStatusUpdate = c.statusHistory && c.statusHistory.length > 0 
      ? c.statusHistory[c.statusHistory.length - 1] 
      : null
    
    return {
      _id: c._id,
      complaintId: c.complaintId,
      title: c.title,
      status: c.status,
      category: c.category,
      priority: c.priority,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      resolvedAt: c.resolvedAt,
      assignedTo: c.assignedTo,
      adminMessageCount: messageCount,
      latestAdminMessage: latestAdminMessage ? {
        message: latestAdminMessage.message,
        createdAt: latestAdminMessage.createdAt
      } : null,
      latestStatusUpdate: latestStatusUpdate
    }
  })
  
  return res.json({ 
    success: true, 
    data: transformedComplaints,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
}

export async function getAdminDashboardStats(req: Request, res: Response) {
  const admin = (req as any).user
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })

  try {
    const schoolId = admin.schoolId

    // Get counts for different statuses
    const [total, pending, progress, resolved, suggestions] = await Promise.all([
      Complaint.countDocuments({ schoolId }),
      Complaint.countDocuments({ schoolId, status: 'PENDING' }),
      Complaint.countDocuments({ schoolId, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ schoolId, status: 'RESOLVED' }),
      Suggestion.countDocuments({ schoolId })
    ])

    // Recent complaints
    const recent = await Complaint.find({ schoolId })
      .select('complaintId title status category createdAt studentId')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    // Map student names
    const studentIds = recent.map(r => r.studentId)
    const students = await Student.find({ _id: { $in: studentIds } }).select('fullName').lean()
    const studentMap = new Map(students.map(s => [s._id.toString(), s.fullName]))

    const recentEnriched = recent.map(r => ({
      ...r,
      studentName: studentMap.get(r.studentId.toString()) || 'Unknown Student'
    }))

    return res.json({
      success: true,
      data: {
        stats: {
          total,
          active: pending + progress,
          resolved,
          unresolved: pending,
          suggestions
        },
        recent: recentEnriched
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

export async function adminListComplaints(req: Request, res: Response) {
  const admin = (req as any).user
  const { status, page = 1, limit = 50 } = req.query
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })
  
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50))
  const skip = (pageNum - 1) * limitNum
  
  const q: any = { schoolId: admin.schoolId }
  if (status) q.status = status
  
  // Use lean() for faster read-only queries
  const complaints = await Complaint.find(q)
    .select('complaintId title status category priority assignedTo physicalDamage createdAt studentId')
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
  
  // Get total count for pagination
  const total = await Complaint.countDocuments(q)
  
  // Batch populate student data efficiently
  const studentIds = [...new Set(complaints.map(c => c.studentId))]
  const students = await Student.find({ _id: { $in: studentIds } })
    .select('_id fullName admissionNumber')
    .lean()
  
  const studentMap = new Map(students.map(s => [s._id.toString(), s]))
  
  const enrichedComplaints = complaints.map(c => ({
    ...c,
    studentId: studentMap.get(c.studentId.toString()) || {}
  }))
  
  return res.json({ 
    success: true, 
    data: enrichedComplaints,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
}

export async function updateComplaintStatus(req: Request, res: Response) {
  const admin = (req as any).user
  const { complaintId } = req.params
  const { status, message, actionTitle, actionDescription, attachmentUrl, imageUrl, assignedTo } = req.body
  if (!admin?.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })
  if (!complaintId || !status) return res.status(400).json({ success: false, message: 'Missing fields' })
  if (message && message.length > 200) return res.status(400).json({ success: false, message: 'Message exceeds 200 characters' })

  const complaint = await Complaint.findOne({ complaintId })
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' })
  if (complaint.schoolId !== admin.schoolId) return res.status(403).json({ success: false, message: 'Forbidden' })

  complaint.status = status

  // Add to status history (tracking like Amazon/Flipkart) — kept for backward
  // compatibility with the student-facing Tracker page, which already reads this.
  if (!complaint.statusHistory) complaint.statusHistory = []
  complaint.statusHistory.push({
    status: status as any,
    changedAt: new Date(),
    changedBy: 'ADMIN',
    message: message?.trim()
  })

  // If resolved, set resolvedAt timestamp
  if (status === 'RESOLVED') {
    complaint.resolvedAt = new Date()
  }

  if (typeof assignedTo === 'string') {
    complaint.assignedTo = assignedTo.trim() || undefined
  }

  // Add message if provided
  if (message && message.trim()) {
    complaint.messages = complaint.messages || []
    complaint.messages.push({ sender: 'ADMIN', senderId: admin._id, message: message.trim(), createdAt: new Date() } as any)
  }

  await complaint.save()

  const adminDoc = await Admin.findById(admin.adminId).select('name').lean()
  await recordActivity({
    complaintId: complaint.complaintId,
    status,
    actionTitle: (actionTitle && actionTitle.trim()) || STATUS_TITLES[status] || status,
    actionDescription: (actionDescription && actionDescription.trim()) || message?.trim(),
    performedBy: adminDoc?.name || 'School admin',
    role: 'ADMIN',
    attachmentUrl: attachmentUrl?.trim() || undefined,
    imageUrl: imageUrl?.trim() || undefined
  })

  return res.json({ success: true, message: 'Status updated', data: complaint })
}
