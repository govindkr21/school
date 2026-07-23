import mongoose, { Document, Schema } from 'mongoose'

export interface IAdminNotificationState extends Document {
  adminId: mongoose.Types.ObjectId
  schoolId: string
  lastReadAt?: Date
  individuallyRead: string[]
}

const AdminNotificationStateSchema = new Schema<IAdminNotificationState>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true },
  schoolId: { type: String, required: true, index: true },
  lastReadAt: { type: Date },
  individuallyRead: { type: [String], default: [] }
}, { timestamps: true })

AdminNotificationStateSchema.index({ adminId: 1 }, { unique: true })

export default mongoose.model<IAdminNotificationState>('AdminNotificationState', AdminNotificationStateSchema)
