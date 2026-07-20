import React from 'react'

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#FBF8F0] text-[#14231B]">
    {children}
  </div>
)

export default StudentLayout
