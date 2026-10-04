import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

export default function ProtectedLayout() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-base text-primary flex flex-col font-sans">
      <Navbar />
      <Outlet />
    </div>
  )
}