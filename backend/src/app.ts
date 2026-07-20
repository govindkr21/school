import express from 'express'
import path from 'path'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import mongoose from 'mongoose'
import routes from './routes'
import errorHandler from './middlewares/errorHandler'

const app = express()

// Basic security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors())
app.use(express.json())
app.use(mongoSanitize())

// Railway health check target — without a 200 here, Railway's edge can mark
// the deployment unhealthy and 502 all traffic even though the app is alive.
app.get('/', (_req, res) => res.status(200).json({ status: 'ok' }))

// Serves locally-stored complaint damage images when Cloudinary isn't configured.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rate limiter (simple)
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use(limiter)

// Routes
app.use('/api/v1', routes)

// Error handler
app.use(errorHandler)

// Connect to MongoDB when starting the app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scts'
mongoose.connect(MONGO_URI, {
  maxPoolSize: 20,  // Connection pool for production (5M+ records)
  minPoolSize: 5,
  maxIdleTimeMS: 45000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  // eslint-disable-next-line no-console
  console.log('MongoDB connected with optimized pool')
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection error:', err)
  process.exit(1)
})

export default app
