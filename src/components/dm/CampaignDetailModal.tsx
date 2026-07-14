import { Copy, Check, UserMinus, Crown, Users } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Campaign, CampaignMember } from '@/lib/types/database'

interface CampaignDetailModalProps {
  open: boolean
  onClose: () => void
  campaign: Campaign
  members: CampaignMember[]
  onRemoveMember: (memberId: string) => void
}

export function CampaignDetailModal({
  open,
  onClose,
  campaign,
  members,
  onRemoveMember,
}: CampaignDetailModalProps) {
  const [copied, setCopied] = useState(false)

  function handleCopyCode() {
    navigator.clipboard.writeText(campaign.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const players = members.filter((m) => m.role === 'player')

  return (
    <Modal open={open} onClose={onClose} title={campaign.name} size="md">
      <div className="space-y-6">
        {/* Invite Code */}
        <div>
          <label className="block text-sm font-display uppercase tracking-wider text-ink-500 mb-2">
            Invite Code
          </label>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl tracking-widest text-ink-900 bg-parchment-100 border border-parchment-400 rounded-lg px-4 py-2">
              {campaign.invite_code}
            </span>
            <Button size="sm" onClick={handleCopyCode}>
              {copied ? <><Check size={14} className="mr-1" /> Copied</> : <><Copy size={14} className="mr-1" /> Copy</>}
            </Button>
          </div>
          <p className="text-xs text-ink-400 mt-1">Share this code with players to join your campaign.</p>
        </div>

        {/* Members List */}
        <div>
          <label className="block text-sm font-display uppercase tracking-wider text-ink-500 mb-2">
            <Users size={14} className="inline mr-1" />
            Members ({members.length})
          </label>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-parchment-50 border border-parchment-300 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  {member.role === 'dm' ? (
                    <Crown size={16} className="text-gold-500" />
                  ) : (
                    <Users size={16} className="text-ink-400" />
                  )}
                  <div>
                    <p className="text-sm font-display text-ink-900">
                      {member.profiles?.display_name || 'Unknown'}
                      {member.role === 'dm' && <span className="text-gold-500 ml-1">(DM)</span>}
                    </p>
                    {member.characters && (
                      <p className="text-xs text-ink-500">
                        {member.characters.name} — Level {member.characters.level} {member.characters.class}
                      </p>
                    )}
                    {!member.characters && member.role === 'player' && (
                      <p className="text-xs text-ink-400 italic">No character linked</p>
                    )}
                  </div>
                </div>
                {member.role === 'player' && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="p-1 text-ink-300 hover:text-danger transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
