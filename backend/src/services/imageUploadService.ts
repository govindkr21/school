import fs from 'fs'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

const hasCloudinaryKeys = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
)

if (hasCloudinaryKeys) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads/complaints')
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true })
}

export type UploadedImage = { secureUrl: string; publicId: string }

// Uploads a single multer disk-storage file and returns only the pointer
// (secure_url + public_id) — never the raw bytes — for storage in Mongo.
// Uses Cloudinary when CLOUDINARY_* env vars are set; otherwise falls back
// to serving the file from this server's own /uploads static route, so the
// feature works end-to-end before Cloudinary credentials exist.
export async function uploadComplaintImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (hasCloudinaryKeys) {
    const result = await cloudinary.uploader.upload(file.path, { folder: 'school-complaints' })
    fs.unlink(file.path, () => {})
    return { secureUrl: result.secure_url, publicId: result.public_id }
  }

  const destPath = path.join(LOCAL_UPLOAD_DIR, file.filename)
  fs.renameSync(file.path, destPath)
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`
  return { secureUrl: `${baseUrl}/uploads/complaints/${file.filename}`, publicId: file.filename }
}

export function isCloudinaryConfigured() {
  return hasCloudinaryKeys
}
