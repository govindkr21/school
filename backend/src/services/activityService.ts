import ComplaintActivity, { ActivityRole, IComplaintActivity } from '../models/ComplaintActivity'
import { IComplaint } from '../models/Complaint'

export const STATUS_TITLES: Record<string, string> = {
  PENDING: 'Marked awaiting review',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Marked resolved'
}

export async function recordActivity(params: {
  complaintId: string
  status: string
  actionTitle: string
  actionDescription?: string
  performedBy: string
  role: ActivityRole
  attachmentUrl?: string
  imageUrl?: string
}): Promise<IComplaintActivity> {
  return ComplaintActivity.create(params)
}

export async function getTimeline(complaintId: string) {
  return ComplaintActivity.find({ complaintId }).sort({ createdAt: 1 }).lean()
}

// Complaints created before this feature existed have no ComplaintActivity
// rows yet. Synthesize an equivalent timeline from the legacy statusHistory
// array so old complaints still render a sensible history instead of nothing.
export function synthesizeTimelineFromHistory(complaint: Pick<IComplaint, 'complaintId' | 'createdAt' | 'statusHistory'>) {
  const entries = complaint.statusHistory && complaint.statusHistory.length > 0
    ? complaint.statusHistory
    : [{ status: 'IN_PROGRESS' as const, changedAt: complaint.createdAt || new Date(), changedBy: 'SYSTEM' as const, message: undefined }]

  return entries.map((h) => ({
    complaintId: complaint.complaintId,
    status: h.status,
    actionTitle: STATUS_TITLES[h.status] || h.status,
    actionDescription: h.message,
    performedBy: h.changedBy === 'SYSTEM' ? 'System' : 'School admin',
    role: h.changedBy || 'SYSTEM',
    attachmentUrl: undefined,
    imageUrl: undefined,
    createdAt: h.changedAt
  }))
}
