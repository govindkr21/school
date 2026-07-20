import mongoose, { Schema, Document } from 'mongoose'

export interface ISuggestion extends Document {
  schoolId: string
  studentId: string
  title: string
  description: string
  category?: string
  createdAt?: Date
  updatedAt?: Date
}

const SuggestionSchema: Schema = new Schema({
  schoolId: { type: String, required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String }
}, { timestamps: true })

SuggestionSchema.index({ schoolId: 1, createdAt: -1 })

export default mongoose.model<ISuggestion>('Suggestion', SuggestionSchema)
