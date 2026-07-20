import { Request, Response, NextFunction } from 'express'

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err)
  const status = err.status || 500
  return res.status(status).json({ success: false, message: err.message || 'Internal Server Error' })
}
