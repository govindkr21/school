import mongoose, { Schema, Document } from 'mongoose'

export interface ISchool extends Document {
  schoolId: string
  name: string
  state: string
  district: string
  contactNumber?: string
  status: 'PENDING' | 'ACTIVE'
  createdAt: Date
  updatedAt: Date
}

const SchoolSchema: Schema = new Schema({
  schoolId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  contactNumber: { type: String },
  status: { type: String, enum: ['PENDING', 'ACTIVE'], default: 'PENDING' }
}, { timestamps: true })

SchoolSchema.index({ state: 1, district: 1 })
SchoolSchema.index({ name: 'text' })

export default mongoose.model<ISchool>('School', SchoolSchema)
