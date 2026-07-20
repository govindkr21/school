import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import School from '../models/School'
import Admin from '../models/Admin'
import SuspensionRequest from '../models/SuspensionRequest'
import { AuthRequest } from '../middlewares/auth'
import { issueOtp, verifyOtp as verifyOtpCode } from '../services/otpService'
import { sendOtpEmail } from '../services/emailService'

export async function registerAdmin(req: Request, res: Response) {
  const { schoolName, adminName, email, password, state, district, contactNumber } = req.body
  if (!schoolName || !adminName || !email || !password || !state || !district) return res.status(400).json({ success: false, message: 'Missing fields' })

  // create school
  const schoolId = 'SCHOOL-' + Math.random().toString(36).substring(2, 9).toUpperCase()
  const school = await School.create({ schoolId, name: schoolName, state, district, contactNumber, status: 'ACTIVE' })

  const passwordHash = await bcrypt.hash(password, 10)
  const admin = await Admin.create({ name: adminName, email, passwordHash, schoolId: school.schoolId })

  const secret = process.env.JWT_SECRET || 'replace_me'
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  const token = jwt.sign({ adminId: admin._id, schoolId: school.schoolId, role: 'ADMIN' }, secret, { expiresIn })

  return res.json({
    success: true,
    message: 'Registered',
    data: {
      token,
      schoolId: school.schoolId,
      adminId: admin._id,
      profile: {
        adminId: admin._id,
        schoolId: school.schoolId,
        adminName: admin.name,
        email: admin.email,
        orgName: school.name
      }
    }
  })
}

export async function loginAdmin(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' })
  const admin = await Admin.findOne({ email })
  if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, admin.passwordHash)
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' })
  const secret = process.env.JWT_SECRET || 'replace_me'
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  const token = jwt.sign({ adminId: admin._id, schoolId: admin.schoolId, role: 'ADMIN' }, secret, { expiresIn })
  const school = await School.findOne({ schoolId: admin.schoolId })
  return res.json({
    success: true,
    message: 'Logged in',
    data: {
      token,
      profile: {
        adminId: admin._id,
        schoolId: admin.schoolId,
        adminName: admin.name,
        email: admin.email,
        orgName: school?.name || ''
      }
    }
  })
}

export async function getAdminMe(req: AuthRequest, res: Response) {
  const adminId = req.user?.adminId
  if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' })

  const admin = await Admin.findById(adminId)
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
  const school = await School.findOne({ schoolId: admin.schoolId })

  return res.json({
    success: true,
    data: {
      adminId: admin._id,
      schoolId: admin.schoolId,
      adminName: admin.name,
      email: admin.email,
      contactNumber: admin.contactNumber,
      profilePic: admin.profilePic,
      orgName: school?.name || '',
      state: school?.state || '',
      district: school?.district || ''
    }
  })
}

export async function updateAdminProfile(req: AuthRequest, res: Response) {
  const adminId = req.user?.adminId
  const { name, email, contactNumber, profilePic } = req.body

  try {
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email, contactNumber, profilePic },
      { new: true }
    )
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })

    const school = await School.findOne({ schoolId: admin.schoolId })

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        adminId: admin._id,
        schoolId: admin.schoolId,
        adminName: admin.name,
        email: admin.email,
        contactNumber: admin.contactNumber,
        profilePic: admin.profilePic,
        orgName: school?.name || '',
        state: school?.state || '',
        district: school?.district || ''
      }
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  const adminId = req.user?.adminId
  const { newPassword } = req.body

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await Admin.findByIdAndUpdate(adminId, { passwordHash })

    return res.json({ success: true, message: 'Password changed successfully' })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' })

  const admin = await Admin.findOne({ email })
  // Always respond success so this endpoint can't be used to enumerate registered emails.
  if (!admin) {
    return res.json({ success: true, message: 'If that email is registered, a reset code has been sent.' })
  }

  const issued = await issueOtp(email, 'PASSWORD_RESET')
  if (!issued.ok) {
    if (issued.reason === 'COOLDOWN') {
      return res.status(429).json({ success: false, message: 'A code was already sent. Please wait before requesting another.', data: { retryAfterSeconds: issued.retryAfterSeconds } })
    }
    return res.status(429).json({ success: false, message: 'Maximum resend limit reached. Please try again later.' })
  }

  const emailSent = await sendOtpEmail({ to: email, otp: issued.otp, purpose: 'PASSWORD_RESET' })
  return res.json({
    success: true,
    message: 'If that email is registered, a reset code has been sent.',
    data: emailSent ? undefined : { debugOtp: issued.otp }
  })
}

export async function verifyPasswordResetOtp(req: Request, res: Response) {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing fields' })

  const result = await verifyOtpCode(email, 'PASSWORD_RESET', otp)
  if (!result.ok) {
    if (result.reason === 'EXPIRED') return res.status(400).json({ success: false, message: 'Code expired. Please request a new one.' })
    if (result.reason === 'LOCKED') return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' })
    if (result.reason === 'INVALID') return res.status(400).json({ success: false, message: 'Invalid code', data: { attemptsRemaining: result.attemptsRemaining } })
    return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' })
  }

  const secret = process.env.JWT_SECRET || 'replace_me'
  const resetToken = jwt.sign({ email, purpose: 'PASSWORD_RESET_CONFIRMED' }, secret, { expiresIn: '10m' })
  return res.json({ success: true, message: 'Verified', data: { resetToken } })
}

export async function resetPassword(req: Request, res: Response) {
  const { resetToken, newPassword } = req.body
  if (!resetToken || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' })
  if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

  let payload: any
  try {
    const secret = process.env.JWT_SECRET || 'replace_me'
    payload = jwt.verify(resetToken, secret)
  } catch {
    return res.status(401).json({ success: false, message: 'Reset link expired or invalid. Please start over.' })
  }

  if (payload.purpose !== 'PASSWORD_RESET_CONFIRMED' || !payload.email) {
    return res.status(401).json({ success: false, message: 'Invalid reset token' })
  }

  const admin = await Admin.findOne({ email: payload.email })
  if (!admin) return res.status(404).json({ success: false, message: 'Account not found' })

  admin.passwordHash = await bcrypt.hash(newPassword, 10)
  await admin.save()

  return res.json({ success: true, message: 'Password reset successfully' })
}

export async function requestSuspension(req: AuthRequest, res: Response) {
  const adminId = req.user?.adminId
  const schoolId = req.user?.schoolId
  const { reason } = req.body

  if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' })

  try {
    await SuspensionRequest.create({
      schoolId,
      adminId,
      reason,
      status: 'PENDING'
    })

    return res.json({ success: true, message: 'Suspension request submitted successfully' })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
