import { Router } from 'express'
import auth from './auth'
import students from './students'
import complaints from './complaints'
import payments from './payments'
import suggestions from './suggestions'

const router = Router()
router.use('/auth', auth)
router.use('/students', students)
router.use('/complaints', complaints)
router.use('/payments', payments)
router.use('/suggestions', suggestions)

export default router
