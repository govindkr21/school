import mongoose, { Schema, Document } from 'mongoose'

export type ActivityRole = 'ADMIN' | 'STUDENT' | 'SYSTEM'

export interface IComplaintActivity extends Document {
  complaintId: string
  status: string
  actionTitle: string
  actionDescription?: string
  performedBy: string
  role: ActivityRole
  attachmentUrl?: string
  imageUrl?: string
  createdAt: Date
}

// Append-only activity log for a complaint's lifecycle. Rows are never
// edited or deleted — each status change or admin/teacher action creates a
// new row, so the full history is always reconstructable in order.
const ComplaintActivitySchema: Schema = new Schema({
  complaintId: { type: String, required: true, index: true },
  status: { type: String, required: true },
  actionTitle: { type: String, required: true },
  actionDescription: { type: String },
  performedBy: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STUDENT', 'SYSTEM'], required: true },
  attachmentUrl: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
})

ComplaintActivitySchema.index({ complaintId: 1, createdAt: 1 })

export default mongoose.model<IComplaintActivity>('ComplaintActivity', ComplaintActivitySchema)
