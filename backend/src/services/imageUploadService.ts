import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim()
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim()
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
const hasCloudinaryKeys = Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret)
const hasCloudinaryConfig = Boolean(cloudinaryUrl || hasCloudinaryKeys)

if (hasCloudinaryKeys) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret
  })
}

const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads/complaints')

export type UploadedImage = { secureUrl: string; publicId: string }

function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase()
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1'].includes(brand)) return '.heic'
  }
  return null
}

function uploadBufferToCloudinary(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'school-complaints',
        resource_type: 'image',
        overwrite: false,
        unique_filename: true
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloud image upload returned no result'))
        const deliveryUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
        resolve({ secureUrl: deliveryUrl, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

function cloudinaryFailure(error: any) {
  const providerError = error?.error || error || {}
  const httpCode = Number(providerError.http_code || providerError.status || 0)
  const providerMessage = String(providerError.message || '')
  const storageError: any = new Error(
    httpCode === 401
      ? 'Image storage credentials are invalid. Ensure the Cloudinary cloud name, API key, and API secret belong to the same product environment.'
      : httpCode === 400
        ? 'Cloudinary rejected the image. Please use a supported image and try again.'
        : 'Image storage is temporarily unavailable. Please try again.'
  )
  storageError.status = httpCode === 400 ? 400 : 503
  storageError.providerCode = httpCode || undefined
  storageError.providerMessage = providerMessage
  return storageError
}

async function saveImageLocally(buffer: Buffer, extension: string): Promise<UploadedImage> {
  await fs.promises.mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
  const filename = `${crypto.randomUUID()}${extension}`
  await fs.promises.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer, { flag: 'wx' })
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`
  return { secureUrl: `${baseUrl}/uploads/complaints/${filename}`, publicId: filename }
}

export async function uploadComplaintImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (!file.buffer?.length) throw new Error('The uploaded image was empty')
  const extension = detectImageExtension(file.buffer)
  if (!extension) throw new Error('The uploaded file content is not a supported image')

  if (hasCloudinaryConfig) {
    try {
      return await uploadBufferToCloudinary(file.buffer)
    } catch (error) {
      const normalizedError = cloudinaryFailure(error)
      if (process.env.NODE_ENV === 'production') throw normalizedError
      console.warn('Cloudinary upload failed; using development local storage fallback', {
        providerCode: normalizedError.providerCode,
        providerMessage: normalizedError.providerMessage
      })
      return saveImageLocally(file.buffer, extension)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const error: any = new Error('Image storage is not configured. Set all CLOUDINARY_* environment variables.')
    error.status = 503
    throw error
  }

  return saveImageLocally(file.buffer, extension)
}

export async function deleteComplaintImage(image: UploadedImage): Promise<void> {
  const isLocalImage = image.secureUrl.includes('/uploads/complaints/')
  if (hasCloudinaryConfig && !isLocalImage) {
    await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' })
    return
  }

  const filename = path.basename(image.publicId)
  if (filename !== image.publicId) return
  await fs.promises.unlink(path.join(LOCAL_UPLOAD_DIR, filename)).catch(() => {})
}

export function isCloudinaryConfigured() {
  return hasCloudinaryConfig
}
