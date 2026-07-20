import { Request, Response } from 'express'
import Razorpay from 'razorpay'
import PendingRegistration from '../models/PendingRegistration'
import crypto from 'crypto'
import School from '../models/School'
import Admin from '../models/Admin'
import jwt from 'jsonwebtoken'

const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
const razor = hasRazorpayKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    })
  : null

const PLANS: Record<string, number> = {
  'plan_12': 5999,
  'plan_24': 10999,
  'plan_36': 20999
}

function signInToken(admin: InstanceType<typeof Admin>) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  return jwt.sign({ adminId: admin._id, schoolId: admin.schoolId, role: 'ADMIN' }, process.env.JWT_SECRET || 'replace_me', { expiresIn })
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { email, planId } = req.body
    if (!email || !planId) return res.status(400).json({ success: false, message: 'Missing fields' })
    const pr = await PendingRegistration.findOne({ email })
    if (!pr) return res.status(404).json({ success: false, message: 'Registration not found' })
    if (!pr.otpVerified) return res.status(400).json({ success: false, message: 'Email not verified' })
    const amount = PLANS[planId]
    if (!amount) return res.status(400).json({ success: false, message: 'Invalid plan' })

    // Already paid and account created — don't create a second order, just let the
    // client re-run confirm/login instead of double-charging.
    if (pr.paymentStatus === 'PAID') {
      return res.status(409).json({ success: false, message: 'This registration has already been paid for. Please sign in instead.' })
    }

    let order: any
    if (hasRazorpayKeys && razor) {
      try {
        order = await razor.orders.create({ amount: amount * 100, currency: 'INR', receipt: `reg_${pr._id}` })
      } catch (err: any) {
        console.error('razorpay order creation failed', err)
        return res.status(502).json({ success: false, message: 'Unable to reach Razorpay. Please try again in a moment.' })
      }
    } else {
      order = {
        id: `order_demo_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
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
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: { token: signInToken(existingAdmin), schoolId: existingAdmin.schoolId, adminId: existingAdmin._id, demoMode: !hasRazorpayKeys }
      })
    }

    pr.paymentStatus = 'PAID'
    await pr.save()

    const schoolId = 'SCHOOL-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    const school = await School.create({ schoolId, name: pr.orgName, state: pr.state, district: pr.district, contactNumber: pr.phone, status: 'ACTIVE' })
    const admin = await Admin.create({ name: pr.orgName, email: pr.email, passwordHash: pr.passwordHash, schoolId: school.schoolId })

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
