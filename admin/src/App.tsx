import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AdminShell from './components/AdminShell'
import { getAdminToken } from './lib/session'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import Plans from './pages/Plans'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Complaints from './pages/Complaints'
import SuggestionsPage from './pages/Suggestions'
import SettingsPage from './pages/Settings'
import Settings from './pages/Settings'

const RequireAuth: React.FC = () => {
  return getAdminToken() ? <Outlet /> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={getAdminToken() ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}

export default App
