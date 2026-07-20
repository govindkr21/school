import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  registerAdmin,
  loginAdmin,
  getAdminMe,
  updateAdminProfile,
  changePassword,
  requestSuspension,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword
} from '../controllers/authController'
import { registerRequest, resendRegisterOtp, verifyOtp } from '../controllers/registrationController'
import { adminAuth } from '../middlewares/auth'

const router = Router()

// Stricter limiter for OTP-sending endpoints, layered on top of the app-wide limiter.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
})

router.post('/admin/register', registerAdmin)
router.post('/admin/login', loginAdmin)
router.get('/admin/me', adminAuth, getAdminMe)
router.put('/admin/profile', adminAuth, updateAdminProfile)
router.post('/admin/change-password', adminAuth, changePassword)
router.post('/admin/request-suspension', adminAuth, requestSuspension)

// registration flow
router.post('/admin/register-request', otpLimiter, registerRequest)
router.post('/admin/register-request/resend', otpLimiter, resendRegisterOtp)
router.post('/admin/verify-otp', verifyOtp)

// forgot password flow
router.post('/admin/forgot-password', otpLimiter, requestPasswordReset)
router.post('/admin/forgot-password/verify-otp', verifyPasswordResetOtp)
router.post('/admin/forgot-password/reset', resetPassword)

export default router
