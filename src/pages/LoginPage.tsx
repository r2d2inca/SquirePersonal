import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router'

export function LoginPage() {
  const { user, loading, needsPasswordSetup } = useAuth()

  if (loading) return null
  if (user && !needsPasswordSetup) return <Navigate to="/dashboard" replace />

  return <LoginForm />
}
