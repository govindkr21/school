import { NextFunction, Request, Response } from 'express'
import multer from 'multer'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 5

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, HEIC, and HEIF images are allowed'))
    }
    cb(null, true)
  }
}).array('images', MAX_FILES)

export function complaintImageUpload(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: any) => {
    if (!error) return next()

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'Each image must be 5MB or smaller.' })
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: 'You can upload up to 5 images using the images field.' })
      }
    }

    return res.status(400).json({ success: false, message: error.message || 'Invalid image upload.' })
  })
}
