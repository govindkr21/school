import { Router } from 'express'
import { uploadMiddleware, analyzeStudentImport, confirmStudentImport, manualAddStudent, verifyStudent, adminListStudents, searchSchools, confirmOTPAndLogin } from '../controllers/studentController'
import { adminAuth } from '../middlewares/auth'

const router = Router()

router.get('/schools/search', searchSchools)
router.post('/upload/analyze', adminAuth, uploadMiddleware, analyzeStudentImport)
router.post('/upload/confirm', adminAuth, confirmStudentImport)
router.post('/add', adminAuth, manualAddStudent)
router.post('/verify', verifyStudent)
router.post('/verify-otp', confirmOTPAndLogin)
router.get('/admin', adminAuth, adminListStudents)

export default router
