import { useState } from 'react'
import { Users, Check, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useJoinCampaign } from '@/hooks/useJoinCampaign'

interface JoinCampaignModalProps {
  open: boolean
  onClose: () => void
}

export function JoinCampaignModal({ open, onClose }: JoinCampaignModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { joinCampaign, isJoining } = useJoinCampaign()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (code.trim().length < 4) {
      setError('Please enter a valid invite code.')
      return
    }

    try {
      await joinCampaign(code)
      setSuccess(true)
      setCode('')
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join campaign')
    }
  }

  function handleClose() {
    setCode('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Join Campaign" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-500">
          Enter the invite code shared by your Dungeon Master to join their campaign.
        </p>

        <div>
          <label className="block text-sm font-display uppercase tracking-wider text-ink-500 mb-1">
            Invite Code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-3 bg-parchment-50 border border-parchment-400 rounded-lg font-mono text-2xl text-center tracking-widest focus:outline-none focus:border-gold-400 uppercase"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Check size={14} />
            Successfully joined campaign!
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isJoining || success}>
          {isJoining ? 'Joining...' : success ? 'Joined!' : 'Join Campaign'}
        </Button>
      </form>
    </Modal>
  )
}
