import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import StudentLayout from './components/StudentLayout'
import FindSchool from './pages/FindSchool'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import NewComplaint from './pages/NewComplaint'
import Tracker from './pages/Tracker'
import Suggestions from './pages/Suggestions'
import TrackComplaint from './pages/TrackComplaint'

const App: React.FC = () => (
  <StudentLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/find-school" replace />} />
      <Route path="/find-school" element={<FindSchool />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/new-complaint" element={<NewComplaint />} />
      <Route path="/tracker" element={<Tracker />} />
      <Route path="/suggestions" element={<Suggestions />} />
      {/* Public — no student login required, matches the backend's public track endpoint */}
      <Route path="/track" element={<TrackComplaint />} />
    </Routes>
  </StudentLayout>
)

export default App
