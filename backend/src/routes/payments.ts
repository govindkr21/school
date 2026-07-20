import { Router } from 'express'
import { createOrder, confirmPayment } from '../controllers/paymentController'

const router = Router()
router.post('/razorpay/order', createOrder)
router.post('/razorpay/confirm', confirmPayment)

export default router
