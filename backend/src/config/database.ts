/**
 * Database Configuration for Scale (100K admins + 5M+ students)
 * Optimizations:
 * - Connection pooling (20 max connections)
 * - Compound indexes for common query patterns
 * - Lean queries for read-only operations
 * - Pagination for large result sets
 * - Batch operations for bulk updates
 */

export const DATABASE_CONFIG = {
  // Connection Pool Settings
  MAX_POOL_SIZE: 20,
  MIN_POOL_SIZE: 5,
  
  // Query Optimization
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Indexing Strategy
  INDEXES: {
    // Admin model
    ADMIN_BY_SCHOOL: { schoolId: 1 },
    ADMIN_BY_EMAIL: { email: 1 },
    
    // Student model
    STUDENT_BY_SCHOOL_ADM: { schoolId: 1, admissionNumber: 1 },
    STUDENT_BY_SCHOOL_NAME: { schoolId: 1, fullName: 1 },
    STUDENT_BY_SCHOOL_DATE: { schoolId: 1, createdAt: -1 },
    
    // Complaint model (critical for performance)
    COMPLAINT_BY_SCHOOL_STATUS: { schoolId: 1, status: 1 },
    COMPLAINT_BY_SCHOOL_DATE: { schoolId: 1, createdAt: -1 },
    COMPLAINT_BY_STUDENT_DATE: { studentId: 1, createdAt: -1 },
    COMPLAINT_BY_STATUS_DATE: { status: 1, createdAt: -1 },
    COMPLAINT_COMPOSITE: { complaintId: 1, schoolId: 1 },
  },

  // Query Optimization Tips
  OPTIMIZATION_TIPS: [
    "✅ Use lean() for read-only queries (10-50% faster)",
    "✅ Implement pagination with skip/limit",
    "✅ Use compound indexes for multi-field queries",
    "✅ Batch operations for bulk inserts/updates",
    "✅ Connection pooling maxPoolSize: 20",
    "✅ Avoid N+1 queries using aggregation or batch populates",
    "✅ Use select() to fetch only needed fields",
    "✅ Create indexes on frequently queried fields",
  ],

  // Estimated Performance at Scale
  EXPECTED_PERFORMANCE: {
    "Single complaint lookup": "10-20ms",
    "List 50 complaints with pagination": "50-100ms",
    "Search complaints by status": "100-200ms",
    "Student complaint history (20 items)": "100-150ms",
    "Admin dashboard load": "200-400ms",
  },

  // MongoDB Recommendations
  MONGODB_RECOMMENDATIONS: {
    "RAM": "At least 8GB for 5M records",
    "Storage": "100GB+ for complaints with messages",
    "Replication": "Use replica set for HA",
    "Sharding": "Consider sharding by schoolId for 10M+ complaints",
    "Backup": "Daily backups with point-in-time recovery",
  }
}

/**
 * Example: Running database index creation
 * 
 * const { Complaint, Student, Admin, School } = require('./models')
 * 
 * async function ensureIndexes() {
 *   // Create all indexes
 *   await Complaint.collection.createIndex({ schoolId: 1, status: 1 })
 *   await Complaint.collection.createIndex({ studentId: 1, createdAt: -1 })
 *   await Student.collection.createIndex({ schoolId: 1, admissionNumber: 1 })
 *   await Admin.collection.createIndex({ schoolId: 1 })
 *   console.log('All indexes created successfully')
 * }
 * 
 * ensureIndexes()
 */
