import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedLayout from './components/ProtectedLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TestEndpointPage from './pages/Testendpointpage'
import PricingPage from './pages/PricingPage'

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/projects" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/projects" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/test" element={<TestEndpointPage />} />
         <Route path="/pricing" element={<PricingPage />} /> 
      </Route>
     
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}