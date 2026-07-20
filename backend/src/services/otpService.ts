import crypto from 'crypto'
import bcrypt from 'bcrypt'
import EmailOtp, { OtpPurpose } from '../models/EmailOtp'

export const OTP_EXPIRY_MS = 5 * 60 * 1000
export const MAX_ATTEMPTS = 5
export const MAX_RESENDS = 5
export const RESEND_COOLDOWN_MS = 30 * 1000

export type IssueResult =
  | { ok: true; otp: string }
  | { ok: false; reason: 'COOLDOWN'; retryAfterSeconds: number }
  | { ok: false; reason: 'MAX_RESENDS'; }
  | { ok: false; reason: 'NOT_FOUND' }

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' }
  | { ok: false; reason: 'EXPIRED' }
  | { ok: false; reason: 'LOCKED' }
  | { ok: false; reason: 'INVALID'; attemptsRemaining: number }

function generateSixDigitOtp() {
  return crypto.randomInt(100000, 1000000).toString()
}

export async function issueOtp(email: string, purpose: OtpPurpose): Promise<IssueResult> {
  const existing = await EmailOtp.findOne({ email, purpose, deletedAt: null })

  if (existing) {
    const msSinceLastSend = Date.now() - existing.lastSentAt.getTime()
    if (msSinceLastSend < RESEND_COOLDOWN_MS) {
      return { ok: false, reason: 'COOLDOWN', retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - msSinceLastSend) / 1000) }
    }
    if (existing.resendCount >= MAX_RESENDS) {
      return { ok: false, reason: 'MAX_RESENDS' }
    }
  }

  const otp = generateSixDigitOtp()
  const otpHash = await bcrypt.hash(otp, 10)
  const now = new Date()

  await EmailOtp.findOneAndUpdate(
    { email, purpose, deletedAt: null },
    {
      $set: {
        email,
        purpose,
        otpHash,
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
        attempts: 0,
        verified: false,
        lastSentAt: now
      },
      $inc: { resendCount: existing ? 1 : 0 },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true, new: true }
  )

  return { ok: true, otp }
}

export async function resendOtp(email: string, purpose: OtpPurpose): Promise<IssueResult> {
  const existing = await EmailOtp.findOne({ email, purpose, deletedAt: null })
  if (!existing) return { ok: false, reason: 'NOT_FOUND' }
  return issueOtp(email, purpose)
}

export async function verifyOtp(email: string, purpose: OtpPurpose, candidate: string): Promise<VerifyResult> {
  const record = await EmailOtp.findOne({ email, purpose, deletedAt: null })
  if (!record) return { ok: false, reason: 'NOT_FOUND' }
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' }
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'LOCKED' }

  const matches = await bcrypt.compare(candidate, record.otpHash)
  if (!matches) {
    record.attempts += 1
    await record.save()
    return { ok: false, reason: 'INVALID', attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts) }
  }

  record.verified = true
  record.deletedAt = new Date()
  await record.save()
  return { ok: true }
}
