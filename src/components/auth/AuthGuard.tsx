import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function AuthGuard() {
  const { user, loading, needsPasswordSetup } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || needsPasswordSetup) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
