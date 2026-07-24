import { Request, Response } from 'express'
import Razorpay from 'razorpay'
import PendingRegistration from '../models/PendingRegistration'
import crypto from 'crypto'
import School from '../models/School'
import Admin from '../models/Admin'
import jwt from 'jsonwebtoken'
import BillingRecord from '../models/BillingRecord'
import { addPlanMonths, SUBSCRIPTION_PLANS } from '../config/subscriptionPlans'
import { AuthRequest } from '../middlewares/auth'

const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
const razor = hasRazorpayKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    })
  : null

function signInToken(admin: InstanceType<typeof Admin>) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  return jwt.sign({ adminId: admin._id, schoolId: admin.schoolId, role: 'ADMIN' }, process.env.JWT_SECRET || 'replace_me', { expiresIn })
}

function createInvoiceNumber(providerOrderId: string, paidAt: Date) {
  const fingerprint = crypto.createHash('sha256').update(providerOrderId).digest('hex').slice(0, 10).toUpperCase()
  return `MDN-${paidAt.getUTCFullYear()}-${fingerprint}`
}

async function ensureBillingRecord(options: {
  admin: InstanceType<typeof Admin>
  school: InstanceType<typeof School>
  registration: InstanceType<typeof PendingRegistration>
  providerOrderId: string
  providerPaymentId?: string
  paidAt: Date
}) {
  const plan = SUBSCRIPTION_PLANS[options.registration.planId || '']
  if (!plan) throw new Error('The selected subscription plan is no longer valid')

  try {
    return await BillingRecord.findOneAndUpdate(
      { providerOrderId: options.providerOrderId },
      {
        $setOnInsert: {
          schoolId: options.school.schoolId,
          adminId: options.admin._id,
          billingEmail: options.admin.email,
          organizationName: options.school.name,
          planId: plan.id,
          planName: plan.name,
          planMonths: plan.months,
          amount: plan.amount,
          currency: plan.currency,
          provider: hasRazorpayKeys ? 'RAZORPAY' : 'DEMO',
          providerOrderId: options.providerOrderId,
          providerPaymentId: options.providerPaymentId,
          invoiceNumber: createInvoiceNumber(options.providerOrderId, options.paidAt),
          status: 'PAID',
          paidAt: options.paidAt,
          startsAt: options.paidAt,
          expiresAt: addPlanMonths(options.paidAt, plan.months)
        }
      },
      { upsert: true, new: true, runValidators: true }
    )
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await BillingRecord.findOne({ providerOrderId: options.providerOrderId })
      if (existing) return existing
    }
    throw error
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { email, planId } = req.body
    if (!email || !planId) return res.status(400).json({ success: false, message: 'Missing fields' })
    const pr = await PendingRegistration.findOne({ email })
    if (!pr) return res.status(404).json({ success: false, message: 'Registration not found' })
    if (!pr.otpVerified) return res.status(400).json({ success: false, message: 'Email not verified' })
    const plan = SUBSCRIPTION_PLANS[planId]
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' })

    // Already paid and account created — don't create a second order, just let the
    // client re-run confirm/login instead of double-charging.
    if (pr.paymentStatus === 'PAID') {
      return res.status(409).json({ success: false, message: 'This registration has already been paid for. Please sign in instead.' })
    }

    let order: any
    if (hasRazorpayKeys && razor) {
      try {
        order = await razor.orders.create({ amount: plan.amount * 100, currency: plan.currency, receipt: `reg_${pr._id}` })
      } catch (err: any) {
        console.error('razorpay order creation failed', err)
        return res.status(502).json({ success: false, message: 'Unable to reach Razorpay. Please try again in a moment.' })
      }
    } else {
      order = {
        id: `order_demo_${Date.now()}`,
        amount: plan.amount * 100,
        currency: plan.currency,
        receipt: `reg_${pr._id}`,
        status: 'created'
      }
    }

    pr.planId = planId
    pr.razorpayOrderId = order.id
    await pr.save()
    return res.json({ success: true, demoMode: !hasRazorpayKeys, order })
  } catch (err: any) {
    console.error('createOrder error', err)
    return res.status(500).json({ success: false, message: 'Unable to start payment' })
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, email } = req.body
    if (!razorpay_payment_id || !razorpay_order_id || !email) return res.status(400).json({ success: false, message: 'Missing fields' })
    const pr = await PendingRegistration.findOne({ email })
    if (!pr) return res.status(404).json({ success: false, message: 'Registration not found' })
    if (!pr.planId || !SUBSCRIPTION_PLANS[pr.planId]) return res.status(400).json({ success: false, message: 'Invalid subscription plan' })
    if (!pr.razorpayOrderId || pr.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment order does not match this registration' })
    }

    if (hasRazorpayKeys) {
      if (!razorpay_signature) return res.status(400).json({ success: false, message: 'Missing signature' })
      const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex')
      if (generated_signature !== razorpay_signature) return res.status(400).json({ success: false, message: 'Invalid signature' })
    }

    // Idempotency: if this registration was already confirmed (retry, double submit,
    // browser back/forward), don't try to create a duplicate School/Admin — just
    // re-issue a fresh token for the account that already exists.
    const existingAdmin = await Admin.findOne({ email: pr.email })
    if (existingAdmin) {
      const existingSchool = await School.findOne({ schoolId: existingAdmin.schoolId })
      if (!existingSchool) return res.status(404).json({ success: false, message: 'Organization not found' })
      const paidAt = pr.paidAt || new Date()
      pr.paymentStatus = 'PAID'
      pr.razorpayPaymentId = razorpay_payment_id
      pr.paidAt = paidAt
      await pr.save()
      await ensureBillingRecord({
        admin: existingAdmin,
        school: existingSchool,
        registration: pr,
        providerOrderId: razorpay_order_id,
        providerPaymentId: razorpay_payment_id,
        paidAt
      })
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: { token: signInToken(existingAdmin), schoolId: existingAdmin.schoolId, adminId: existingAdmin._id, demoMode: !hasRazorpayKeys }
      })
    }

    pr.paymentStatus = 'PAID'
    pr.razorpayPaymentId = razorpay_payment_id
    pr.paidAt = new Date()
    await pr.save()

    const schoolId = 'SCHOOL-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    const school = await School.create({ schoolId, name: pr.orgName, state: pr.state, district: pr.district, contactNumber: pr.phone, status: 'ACTIVE' })
    const admin = await Admin.create({ name: pr.orgName, email: pr.email, passwordHash: pr.passwordHash, schoolId: school.schoolId })
    await ensureBillingRecord({
      admin,
      school,
      registration: pr,
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      paidAt: pr.paidAt || new Date()
    })

    return res.json({
      success: true,
      message: 'Payment confirmed and account created',
      data: { token: signInToken(admin), schoolId: school.schoolId, adminId: admin._id, demoMode: !hasRazorpayKeys }
    })
  } catch (err: any) {
    console.error('confirmPayment error', err)
    return res.status(500).json({ success: false, message: 'Unable to confirm payment' })
  }
}

export async function getAdminBilling(req: AuthRequest, res: Response) {
  const adminId = req.user?.adminId
  const schoolId = req.user?.schoolId
  if (!adminId || !schoolId) return res.status(401).json({ success: false, message: 'Unauthorized' })

  try {
    const [admin, school] = await Promise.all([
      Admin.findOne({ _id: adminId, schoolId }),
      School.findOne({ schoolId })
    ])
    if (!admin || !school) return res.status(404).json({ success: false, message: 'Organization not found' })

    let records = await BillingRecord.find({ schoolId }).sort({ paidAt: -1 }).lean()

    // Schools created before durable billing records were introduced still
    // have their paid registration. Convert it once into an immutable record.
    if (records.length === 0) {
      const registration = await PendingRegistration.findOne({ email: admin.email, paymentStatus: 'PAID' })
      const plan = registration?.planId ? SUBSCRIPTION_PLANS[registration.planId] : undefined
      if (registration && plan) {
        const paidAt = registration.paidAt || school.createdAt || registration.createdAt || new Date()
        const providerOrderId = registration.razorpayOrderId || `legacy_${school.schoolId}`
        try {
          await BillingRecord.findOneAndUpdate(
            { providerOrderId },
            {
              $setOnInsert: {
                schoolId: school.schoolId,
                adminId: admin._id,
                billingEmail: admin.email,
                organizationName: school.name,
                planId: plan.id,
                planName: plan.name,
                planMonths: plan.months,
                amount: plan.amount,
                currency: plan.currency,
                provider: registration.razorpayPaymentId?.startsWith('pay_demo_') ? 'DEMO' : 'LEGACY',
                providerOrderId,
                providerPaymentId: registration.razorpayPaymentId,
                invoiceNumber: createInvoiceNumber(providerOrderId, paidAt),
                status: 'PAID',
                paidAt,
                startsAt: paidAt,
                expiresAt: addPlanMonths(paidAt, plan.months)
              }
            },
            { upsert: true, new: true, runValidators: true }
          )
        } catch (error: any) {
          if (error?.code !== 11000) throw error
        }
        records = await BillingRecord.find({ schoolId }).sort({ paidAt: -1 }).lean()
      }
    }

    const current = records.find((record) => record.status === 'PAID') || null
    const now = Date.now()
    const subscription = current ? {
      planId: current.planId,
      planName: current.planName,
      planMonths: current.planMonths,
      startsAt: current.startsAt,
      expiresAt: current.expiresAt,
      status: current.expiresAt.getTime() >= now ? 'ACTIVE' : 'EXPIRED',
      daysRemaining: Math.max(0, Math.ceil((current.expiresAt.getTime() - now) / 86_400_000))
    } : null

    return res.json({
      success: true,
      data: {
        organization: {
          schoolId: school.schoolId,
          name: school.name,
          billingEmail: admin.email,
          registeredAt: school.createdAt
        },
        subscription,
        invoices: records.map((record) => ({
          invoiceNumber: record.invoiceNumber,
          planName: record.planName,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          paidAt: record.paidAt,
          provider: record.provider,
          providerOrderId: record.providerOrderId,
          providerPaymentId: record.providerPaymentId
        }))
      }
    })
  } catch (error) {
    console.error('Unable to load admin billing details', error)
    return res.status(500).json({ success: false, message: 'Unable to load plan and billing details' })
  }
}
