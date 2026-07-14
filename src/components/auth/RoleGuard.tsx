import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function RoleGuard() {
  const { user } = useAuth()
  const { profile, isLoading } = useProfile(user?.id)

  // While profile is loading, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If profile failed to load or hasn't loaded yet, pass through
  if (!profile) {
    return <Outlet />
  }

  // If no role chosen yet, redirect to role selection
  if (!profile.role) {
    return <Navigate to="/select-role" replace />
  }

  // Both player and DM dashboards are freely accessible
  return <Outlet />
}
