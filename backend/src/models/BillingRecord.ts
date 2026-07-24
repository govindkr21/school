import mongoose, { Document, Schema } from 'mongoose'

export interface IBillingRecord extends Document {
  schoolId: string
  adminId: mongoose.Types.ObjectId
  billingEmail: string
  organizationName: string
  planId: string
  planName: string
  planMonths: number
  amount: number
  currency: 'INR'
  provider: 'RAZORPAY' | 'DEMO' | 'LEGACY'
  providerOrderId: string
  providerPaymentId?: string
  invoiceNumber: string
  status: 'PAID' | 'REFUNDED'
  paidAt: Date
  startsAt: Date
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const BillingRecordSchema = new Schema<IBillingRecord>({
  schoolId: { type: String, required: true, index: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  billingEmail: { type: String, required: true },
  organizationName: { type: String, required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  planMonths: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  provider: { type: String, enum: ['RAZORPAY', 'DEMO', 'LEGACY'], required: true },
  providerOrderId: { type: String, required: true },
  providerPaymentId: { type: String },
  invoiceNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['PAID', 'REFUNDED'], default: 'PAID' },
  paidAt: { type: Date, required: true },
  startsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true })

BillingRecordSchema.index({ schoolId: 1, paidAt: -1 })
BillingRecordSchema.index({ providerOrderId: 1 }, { unique: true })
BillingRecordSchema.index(
  { providerPaymentId: 1 },
  { unique: true, partialFilterExpression: { providerPaymentId: { $type: 'string' } } }
)

export default mongoose.model<IBillingRecord>('BillingRecord', BillingRecordSchema)
