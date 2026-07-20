import mongoose, { Schema, Document } from 'mongoose'

export interface IOTP extends Document {
  schoolId: string
  admissionNumber: string
  otp: string
  expiresAt: Date
}

const OTPSchema: Schema = new Schema({
  schoolId: { type: String, required: true },
  admissionNumber: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
})

OTPSchema.index({ schoolId: 1, admissionNumber: 1 })

export default mongoose.model<IOTP>('OTP', OTPSchema)