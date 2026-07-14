import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Shield, Crown, Swords, LogOut } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function RoleSelectPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile, isLoading, updateRole } = useProfile(user?.id)
  const [error, setError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  // If user already has a role, redirect them
  useEffect(() => {
    if (profile?.role === 'player') {
      navigate('/dashboard', { replace: true })
    } else if (profile?.role === 'dm') {
      navigate('/dm', { replace: true })
    }
  }, [profile?.role, navigate])

  async function handleSelectRole(role: 'player' | 'dm') {
    if (!user) {
      setError('Not logged in. Please refresh and try again.')
      return
    }

    setError(null)
    setSelecting(true)

    try {
      // Use the mutation so React Query cache updates before navigation
      await updateRole(role)

      if (role === 'player') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/dm', { replace: true })
      }
    } catch (err) {
      console.error('Role selection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to set role. Please try again.')
      setSelecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment-200 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <Swords className="text-gold-400 mx-auto mb-4" size={48} />
          <h1 className="font-display text-4xl text-ink-900 mb-2">Welcome to Squire</h1>
          <p className="text-ink-500 text-lg">Every hero needs a Squire</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Card */}
          <button
            type="button"
            onClick={() => handleSelectRole('player')}
            disabled={selecting}
            className="group bg-parchment-50 border-2 border-parchment-400 hover:border-gold-400 rounded-xl p-8 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <div className="w-20 h-20 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold-200 transition-colors">
              <Shield className="text-gold-600" size={36} />
            </div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">Player</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              Create a character, track spells and inventory, log sessions, and get AI-powered advice for your adventures.
            </p>
          </button>

          {/* DM Card */}
          <button
            type="button"
            onClick={() => handleSelectRole('dm')}
            disabled={selecting}
            className="group bg-parchment-50 border-2 border-parchment-400 hover:border-gold-400 rounded-xl p-8 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <div className="w-20 h-20 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold-200 transition-colors">
              <Crown className="text-gold-600" size={36} />
            </div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">Dungeon Master</h2>
            <p className="text-ink-500 text-sm leading-relaxed">
              Manage campaigns, view your party, browse the Monster Manual, create NPCs, and plan your sessions.
            </p>
          </button>
        </div>

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
