import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: any
}

export function adminAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const token = auth.split(' ')[1]
  try {
    const secret = process.env.JWT_SECRET || 'replace_me'
    const payload = jwt.verify(token, secret) as any
    if (payload.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' })
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

export function studentAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const token = auth.split(' ')[1]
  try {
    const secret = process.env.JWT_SECRET || 'replace_me'
    const payload = jwt.verify(token, secret) as any
    if (payload.role !== 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' })
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}
