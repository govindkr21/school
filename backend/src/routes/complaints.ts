import { Router } from 'express'
import { createComplaint, trackComplaint, adminListComplaints, updateComplaintStatus, getMyComplaints, getAdminDashboardStats } from '../controllers/complaintController'
import { studentAuth, adminAuth } from '../middlewares/auth'
import { complaintImageUpload } from '../middlewares/complaintImageUpload'

const router = Router()

router.post('/', studentAuth, complaintImageUpload, createComplaint)
router.get('/track/:complaintId', trackComplaint)
router.get('/my-complaints', studentAuth, getMyComplaints)

// admin
router.get('/admin', adminAuth, adminListComplaints)
router.get('/admin/stats', adminAuth, getAdminDashboardStats)
router.patch('/admin/:complaintId/status', adminAuth, updateComplaintStatus)

export default router
