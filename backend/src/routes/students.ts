import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { uploadMiddleware, analyzeStudentImport, confirmStudentImport, manualAddStudent, verifyStudent, adminListStudents, searchSchools, confirmCaptchaAndLogin } from '../controllers/studentController'
import { adminAuth } from '../middlewares/auth'

const router = Router()

const studentVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' }
})

router.get('/schools/search', searchSchools)
router.post('/upload/analyze', adminAuth, uploadMiddleware, analyzeStudentImport)
router.post('/upload/confirm', adminAuth, confirmStudentImport)
router.post('/add', adminAuth, manualAddStudent)
router.post('/verify', studentVerificationLimiter, verifyStudent)
router.post('/verify-captcha', studentVerificationLimiter, confirmCaptchaAndLogin)
router.get('/admin', adminAuth, adminListStudents)

export default router
