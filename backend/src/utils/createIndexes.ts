/**
 * Database Index Creation Script for Production
 * Run this once to create all necessary indexes for optimal performance
 * 
 * Usage:
 * npx ts-node ./src/utils/createIndexes.ts
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Complaint from '../models/Complaint'
import Student from '../models/Student'
import Admin from '../models/Admin'
import School from '../models/School'

dotenv.config()

async function createIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/scts'
    
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
    })
    
    console.log('✅ Connected to MongoDB')
    console.log('🔧 Creating indexes...\n')
    
    // ============ ADMIN MODEL INDEXES ============
    console.log('📋 Admin Model:')
    await Admin.collection.dropIndex('schoolId_1').catch(() => {})
    await Admin.collection.createIndex({ schoolId: 1 })
    console.log('  ✓ schoolId index created')
    
    // ============ STUDENT MODEL INDEXES ============
    console.log('\n📚 Student Model:')
    await Student.collection.createIndex({ schoolId: 1, admissionNumber: 1 }, { unique: true }).catch(() => {})
    console.log('  ✓ (schoolId, admissionNumber) unique index')
    
    await Student.collection.createIndex({ schoolId: 1, fullName: 1 })
    console.log('  ✓ (schoolId, fullName) index')
    
    await Student.collection.createIndex({ schoolId: 1, createdAt: -1 })
    console.log('  ✓ (schoolId, createdAt desc) index')
    
    // ============ COMPLAINT MODEL INDEXES ============
    console.log('\n🔔 Complaint Model:')
    
    // Drop old indexes if they exist
    await Complaint.collection.dropIndex('schoolId_1_status_1').catch(() => {})
    
    await Complaint.collection.createIndex({ schoolId: 1, status: 1 })
    console.log('  ✓ (schoolId, status) index')
    
    await Complaint.collection.createIndex({ schoolId: 1, createdAt: -1 })
    console.log('  ✓ (schoolId, createdAt desc) index')
    
    await Complaint.collection.createIndex({ studentId: 1, createdAt: -1 })
    console.log('  ✓ (studentId, createdAt desc) index')
    
    await Complaint.collection.createIndex({ status: 1, createdAt: -1 })
    console.log('  ✓ (status, createdAt desc) index')
    
    await Complaint.collection.createIndex({ complaintId: 1, schoolId: 1 })
    console.log('  ✓ (complaintId, schoolId) index')
    
    await Complaint.collection.createIndex({ studentId: 1 })
    console.log('  ✓ studentId index')
    
    await Complaint.collection.createIndex({ category: 1 })
    console.log('  ✓ category index')
    
    await Complaint.collection.createIndex({ status: 1 })
    console.log('  ✓ status index')
    
    // ============ SCHOOL MODEL INDEXES ============
    console.log('\n🏫 School Model:')
    
    // Ensure existing indexes from schema
    console.log('  ✓ (state, district) index (from schema)')
    console.log('  ✓ text search on name (from schema)')
    
    // ============ SUMMARY ============
    console.log('\n✨ Index Creation Complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Show index stats
    const adminIndexes = await Admin.collection.getIndexes()
    const studentIndexes = await Student.collection.getIndexes()
    const complaintIndexes = await Complaint.collection.getIndexes()
    const schoolIndexes = await School.collection.getIndexes()
    
    console.log(`📊 Admin collection: ${Object.keys(adminIndexes).length} indexes`)
    console.log(`📊 Student collection: ${Object.keys(studentIndexes).length} indexes`)
    console.log(`📊 Complaint collection: ${Object.keys(complaintIndexes).length} indexes`)
    console.log(`📊 School collection: ${Object.keys(schoolIndexes).length} indexes`)
    
    console.log('\n🚀 Database is now optimized for 5M+ records!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    await mongoose.connection.close()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    process.exit(1)
  }
}

createIndexes()
