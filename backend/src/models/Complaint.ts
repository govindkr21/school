import mongoose, { Schema, Document } from 'mongoose'

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

export interface IComplaint extends Document {
  complaintId: string
  schoolId: string
  studentId: string
  title: string
  description: string
  category?: string
  priority?: 'Low' | 'Medium' | 'High'
  status: ComplaintStatus
  statusHistory?: {
    status: ComplaintStatus
    changedAt: Date
    changedBy?: 'ADMIN' | 'SYSTEM'
    message?: string
  }[]
  messages?: { sender: 'ADMIN' | 'STUDENT'; senderId?: string; message: string; createdAt?: Date }[]
  assignedTo?: string
  physicalDamage?: {
    hasDamage: boolean
    description?: string
    estimatedCost?: number
    location?: string
    images?: { secureUrl: string; publicId: string }[]
  }
  resolvedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const ComplaintSchema: Schema = new Schema({
  complaintId: { type: String, required: true, unique: true, index: true },
  schoolId: { type: String, required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'], default: 'IN_PROGRESS', index: true },
  
  // Track all status changes (like Amazon/Flipkart order tracking)
  statusHistory: [
    {
      status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'], required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, enum: ['ADMIN', 'SYSTEM'], default: 'ADMIN' },
      message: { type: String }  // Optional message with status change
    }
  ],
  
  // Messages between admin and student
  messages: [
    {
      sender: { type: String, enum: ['ADMIN', 'STUDENT'] },
      senderId: { type: Schema.Types.ObjectId },
      message: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  // Plain display field for now — no Teacher login/role yet, just a name admin can set.
  assignedTo: { type: String },

  // Only secureUrl + publicId are stored — the actual image bytes live in
  // Cloudinary (or, until that's configured, this server's local disk).
  physicalDamage: {
    hasDamage: { type: Boolean, default: false },
    description: { type: String },
    estimatedCost: { type: Number },
    location: { type: String },
    images: [
      {
        secureUrl: { type: String },
        publicId: { type: String }
      }
    ]
  },

  // Track when complaint was resolved
  resolvedAt: { type: Date }
}, { timestamps: true })

// Performance indexes for handling 5M+ complaints
ComplaintSchema.index({ schoolId: 1, status: 1 })
ComplaintSchema.index({ schoolId: 1, createdAt: -1 })
ComplaintSchema.index({ studentId: 1, createdAt: -1 })
ComplaintSchema.index({ status: 1, createdAt: -1 })
ComplaintSchema.index({ complaintId: 1, schoolId: 1 })
ComplaintSchema.index({ studentId: 1, status: 1 })
ComplaintSchema.index({ resolvedAt: 1 })

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema)
