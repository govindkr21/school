import crypto from 'crypto'

const CAPTCHA_TTL_MS = 5 * 60 * 1000
const TOKEN_VERSION = 'v1'

type CaptchaPayload = {
  answer: string
  studentId: string
  schoolId: string
  admissionNumber: string
  expiresAt: number
  nonce: string
}

export type MathCaptcha = {
  prompt: string
  token: string
  expiresInSeconds: number
}

function encryptionKey() {
  const secret = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'replace_me'
  return crypto.createHash('sha256').update(`student-captcha:${secret}`).digest()
}

function seal(payload: CaptchaPayload) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from(TOKEN_VERSION))
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()
  return [TOKEN_VERSION, iv.toString('base64url'), ciphertext.toString('base64url'), tag.toString('base64url')].join('.')
}

function unseal(token: string): CaptchaPayload | null {
  try {
    const [version, ivPart, ciphertextPart, tagPart, extra] = token.split('.')
    if (version !== TOKEN_VERSION || !ivPart || !ciphertextPart || !tagPart || extra) return null

    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'))
    decipher.setAAD(Buffer.from(TOKEN_VERSION))
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final()
    ]).toString('utf8')
    return JSON.parse(plaintext) as CaptchaPayload
  } catch {
    return null
  }
}

function randomInt(min: number, max: number) {
  return crypto.randomInt(min, max + 1)
}

function createQuestion(): { prompt: string; answer: string } {
  const kind = randomInt(0, 5)

  if (kind === 0) {
    const a = randomInt(2, 25)
    const b = randomInt(2, 25)
    return { prompt: `${a} + ${b} = ?`, answer: String(a + b) }
  }
  if (kind === 1) {
    const a = randomInt(2, 12)
    const b = randomInt(2, 12)
    return { prompt: `${a} × ${b} = ?`, answer: String(a * b) }
  }
  if (kind === 2) {
    const a = randomInt(2, 15)
    return { prompt: `What is ${a}²?`, answer: String(a * a) }
  }
  if (kind === 3) {
    const length = randomInt(2, 12)
    const width = randomInt(2, 12)
    return { prompt: `Area of a ${length} × ${width} rectangle = ?`, answer: String(length * width) }
  }
  if (kind === 4) {
    const side = randomInt(2, 15)
    return { prompt: `Perimeter of a square with side ${side} = ?`, answer: String(4 * side) }
  }

  const larger = randomInt(10, 35)
  const smaller = randomInt(2, larger - 1)
  return { prompt: `${larger} − ${smaller} = ?`, answer: String(larger - smaller) }
}

export function issueMathCaptcha(identity: {
  studentId: string
  schoolId: string
  admissionNumber: string
}): MathCaptcha {
  const question = createQuestion()
  const expiresAt = Date.now() + CAPTCHA_TTL_MS
  const token = seal({
    ...identity,
    answer: question.answer,
    expiresAt,
    nonce: crypto.randomBytes(16).toString('hex')
  })

  return {
    prompt: question.prompt,
    token,
    expiresInSeconds: Math.floor(CAPTCHA_TTL_MS / 1000)
  }
}

export function verifyMathCaptcha(token: string, candidate: unknown):
  | { ok: true; identity: Omit<CaptchaPayload, 'answer' | 'expiresAt' | 'nonce'> }
  | { ok: false; reason: 'INVALID' | 'EXPIRED' | 'WRONG_ANSWER' } {
  const payload = unseal(token)
  if (!payload || !payload.answer || !payload.studentId || !payload.schoolId || !payload.admissionNumber) {
    return { ok: false, reason: 'INVALID' }
  }
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
    return { ok: false, reason: 'EXPIRED' }
  }

  const normalized = String(candidate ?? '').trim()
  if (!/^-?\d+$/.test(normalized)) return { ok: false, reason: 'WRONG_ANSWER' }

  const expectedBuffer = Buffer.from(payload.answer)
  const candidateBuffer = Buffer.from(normalized)
  if (expectedBuffer.length !== candidateBuffer.length || !crypto.timingSafeEqual(expectedBuffer, candidateBuffer)) {
    return { ok: false, reason: 'WRONG_ANSWER' }
  }

  return {
    ok: true,
    identity: {
      studentId: payload.studentId,
      schoolId: payload.schoolId,
      admissionNumber: payload.admissionNumber
    }
  }
}
