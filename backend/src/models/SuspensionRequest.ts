import mongoose, { Schema, Document } from 'mongoose'

export interface ISuspensionRequest extends Document {
  schoolId: string
  adminId: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
}

const SuspensionRequestSchema: Schema = new Schema({
  schoolId: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true })

export default mongoose.model<ISuspensionRequest>('SuspensionRequest', SuspensionRequestSchema)
