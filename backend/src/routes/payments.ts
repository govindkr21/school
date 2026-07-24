import { Router } from 'express'
import { createOrder, confirmPayment, getAdminBilling } from '../controllers/paymentController'
import { adminAuth } from '../middlewares/auth'

const router = Router()
router.post('/razorpay/order', createOrder)
router.post('/razorpay/confirm', confirmPayment)
router.get('/admin/billing', adminAuth, getAdminBilling)

export default router
