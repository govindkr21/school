import mongoose, { Schema, Document } from 'mongoose'

export interface IAdmin extends Document {
  name: string
  email: string
  passwordHash: string
  schoolId: string
  contactNumber?: string
  profilePic?: string
  role: 'ADMIN'
}

const AdminSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  schoolId: { type: String, required: true, index: true },
  contactNumber: { type: String },
  profilePic: { type: String },
  role: { type: String, default: 'ADMIN' }
}, { timestamps: true })

AdminSchema.index({ email: 1 })
AdminSchema.index({ schoolId: 1 })

export default mongoose.model<IAdmin>('Admin', AdminSchema)
