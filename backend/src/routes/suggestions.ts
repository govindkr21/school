import { Router } from 'express'
import { createSuggestion, adminListSuggestions } from '../controllers/suggestionController'
import { studentAuth, adminAuth } from '../middlewares/auth'

const router = Router()

router.post('/', studentAuth, createSuggestion)
router.get('/admin', adminAuth, adminListSuggestions)

export default router
