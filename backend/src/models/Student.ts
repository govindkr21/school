import mongoose, { Schema, Document } from 'mongoose'

export interface IStudent extends Document {
  schoolId: string
  fullName: string
  admissionNumber: string
  dob: Date
  contactNumber?: string
  className?: string
  section?: string
  rollNumber?: string
}

const StudentSchema: Schema = new Schema({
  schoolId: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  admissionNumber: { type: String, required: true },
  dob: { type: Date, required: true },
  contactNumber: { type: String },
  className: { type: String },
  section: { type: String },
  rollNumber: { type: String }
}, { timestamps: true })

// Compound indexes for efficient queries
StudentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true })
StudentSchema.index({ schoolId: 1, fullName: 1 })
StudentSchema.index({ schoolId: 1, createdAt: -1 })

export default mongoose.model<IStudent>('Student', StudentSchema)
