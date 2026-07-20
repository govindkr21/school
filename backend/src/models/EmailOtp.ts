import mongoose, { Schema, Document } from 'mongoose'

export type OtpPurpose = 'ADMIN_REGISTER' | 'PASSWORD_RESET'

export interface IEmailOtp extends Document {
  email: string
  purpose: OtpPurpose
  otpHash: string
  expiresAt: Date
  attempts: number
  resendCount: number
  lastSentAt: Date
  verified: boolean
  createdAt: Date
  deletedAt: Date | null
}

const EmailOtpSchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: ['ADMIN_REGISTER', 'PASSWORD_RESET'], required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
})

// One active (non-deleted) OTP per email+purpose is enforced at the application layer.
EmailOtpSchema.index({ email: 1, purpose: 1, deletedAt: 1 })
// TTL cleanup: purge consumed/expired-long-ago documents automatically after 1 day.
EmailOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })

export default mongoose.model<IEmailOtp>('EmailOtp', EmailOtpSchema)
