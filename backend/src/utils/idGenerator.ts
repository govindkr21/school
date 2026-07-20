import Counter from '../models/Counter'

export async function generateComplaintId(schoolName: string): Promise<string> {
  // Get first 3 letters of school name (uppercase)
  const schoolPrefix = schoolName.substring(0, 3).toUpperCase()
  
  // Use counter for sequential numbering per school
  const counterId = `COMPLAINT_${schoolPrefix}`
  const updated = await Counter.findOneAndUpdate(
    { name: counterId }, 
    { $inc: { seq: 1 } }, 
    { upsert: true, new: true }
  )
  
  const seq = updated.seq
  return `${schoolPrefix}${seq}`
}

export async function generateSchoolId(): Promise<string> {
  const year = new Date().getFullYear()
  const name = 'SCHOOL_' + year
  const updated = await Counter.findOneAndUpdate({ name }, { $inc: { seq: 1 } }, { upsert: true, new: true })
  const seq = updated.seq
  const padded = String(seq).padStart(6, '0')
  return `SCHOOL-${year}-${padded}`
}
