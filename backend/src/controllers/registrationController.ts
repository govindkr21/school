import { Request, Response } from 'express'
import PendingRegistration from '../models/PendingRegistration'
import Admin from '../models/Admin'
import bcrypt from 'bcrypt'
import { issueOtp, resendOtp, verifyOtp as verifyOtpCode } from '../services/otpService'
import { sendOtpEmail } from '../services/emailService'

export async function registerRequest(req: Request, res: Response) {
  const { orgName, address, email, phone, orgCode, state, district, orgType, password } = req.body
  if (!orgName || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' })

  const existingAdmin = await Admin.findOne({ email })
  if (existingAdmin) return res.status(409).json({ success: false, message: 'Email already registered' })

  const passwordHash = await bcrypt.hash(password, 10)
  await PendingRegistration.findOneAndUpdate(
    { email },
    { orgName, address, phone, orgCode, state, district, orgType, passwordHash, otpVerified: false },
    { upsert: true, new: true }
  )

  const issued = await issueOtp(email, 'ADMIN_REGISTER')
  if (!issued.ok) {
    if (issued.reason === 'COOLDOWN') {
      return res.status(429).json({ success: false, message: 'A code was already sent. Please wait before requesting another.', data: { retryAfterSeconds: issued.retryAfterSeconds } })
    }
    return res.status(429).json({ success: false, message: 'Maximum resend limit reached. Please try again later.' })
  }

  const emailSent = await sendOtpEmail({ to: email, otp: issued.otp, purpose: 'ADMIN_REGISTER', orgName })

  return res.json({
    success: true,
    message: emailSent ? 'Verification code sent to your email' : 'OTP generated in demo mode (email not configured)',
    data: emailSent ? undefined : { debugOtp: issued.otp }
  })
}

export async function resendRegisterOtp(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' })

  const pr = await PendingRegistration.findOne({ email })
  if (!pr) return res.status(404).json({ success: false, message: 'Registration not found' })
  if (pr.otpVerified) return res.status(400).json({ success: false, message: 'Email already verified' })

  const issued = await resendOtp(email, 'ADMIN_REGISTER')
  if (!issued.ok) {
    if (issued.reason === 'COOLDOWN') {
      return res.status(429).json({ success: false, message: 'Please wait before requesting another code.', data: { retryAfterSeconds: issued.retryAfterSeconds } })
    }
    if (issued.reason === 'MAX_RESENDS') {
      return res.status(429).json({ success: false, message: 'Maximum resend limit reached. Please restart registration.' })
    }
    return res.status(400).json({ success: false, message: 'No pending verification found. Please restart registration.' })
  }

  const emailSent = await sendOtpEmail({ to: email, otp: issued.otp, purpose: 'ADMIN_REGISTER', orgName: pr.orgName })

  return res.json({
    success: true,
    message: emailSent ? 'Verification code resent' : 'OTP generated in demo mode (email not configured)',
    data: emailSent ? undefined : { debugOtp: issued.otp }
  })
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing fields' })

  const pr = await PendingRegistration.findOne({ email })
  if (!pr) return res.status(404).json({ success: false, message: 'Registration not found' })
  if (pr.otpVerified) return res.json({ success: true, message: 'Already verified' })

  const result = await verifyOtpCode(email, 'ADMIN_REGISTER', otp)
  if (!result.ok) {
    if (result.reason === 'EXPIRED') return res.status(400).json({ success: false, message: 'OTP expired. Please request a new code.' })
    if (result.reason === 'LOCKED') return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' })
    if (result.reason === 'INVALID') return res.status(400).json({ success: false, message: 'Invalid OTP', data: { attemptsRemaining: result.attemptsRemaining } })
    return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' })
  }

  pr.otpVerified = true
  await pr.save()
  return res.json({ success: true, message: 'Verified' })
}
