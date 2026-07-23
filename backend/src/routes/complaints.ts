import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createComplaint, trackComplaint, adminListComplaints, updateComplaintStatus, getMyComplaints, getAdminDashboardStats, getAdminComplaintDetail, getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '../controllers/complaintController'
import { studentAuth, adminAuth } from '../middlewares/auth'
import { complaintImageUpload } from '../middlewares/complaintImageUpload'

const router = Router()

const complaintCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.studentId?.toString() || req.ip,
  message: { success: false, message: 'Too many complaint submissions. Please try again later.' }
})

router.post('/', studentAuth, complaintCreationLimiter, complaintImageUpload, createComplaint)
router.get('/track/:complaintId', trackComplaint)
router.get('/my-complaints', studentAuth, getMyComplaints)

// admin
router.get('/admin', adminAuth, adminListComplaints)
router.get('/admin/stats', adminAuth, getAdminDashboardStats)
router.get('/admin/notifications', adminAuth, getAdminNotifications)
router.post('/admin/notifications/read-all', adminAuth, markAllAdminNotificationsRead)
router.post('/admin/notifications/:complaintId/read', adminAuth, markAdminNotificationRead)
router.get('/admin/:complaintId', adminAuth, getAdminComplaintDetail)
router.patch('/admin/:complaintId/status', adminAuth, updateComplaintStatus)

export default router
