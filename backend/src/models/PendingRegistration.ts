import mongoose from 'mongoose'

const PendingRegistrationSchema = new mongoose.Schema({
  orgName: { type: String, required: true },
  address: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  orgCode: { type: String },
  state: { type: String },
  district: { type: String },
  orgType: { type: String, enum: ['PVT', 'PUBLIC'] },
  passwordHash: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  otpVerified: { type: Boolean, default: false },
  planId: { type: String },
  razorpayOrderId: { type: String },
  paymentStatus: { type: String, enum: ['PENDING','PAID','FAILED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('PendingRegistration', PendingRegistrationSchema)
