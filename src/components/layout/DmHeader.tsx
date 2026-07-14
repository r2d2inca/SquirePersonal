import { Crown, Users } from 'lucide-react'
import type { Campaign, CampaignMember } from '@/lib/types/database'

interface DmHeaderProps {
  campaign?: Campaign | null
  campaigns?: Campaign[]
  memberCount?: number
  onCampaignChange?: (id: string) => void
}

export function DmHeader({ campaign, campaigns = [], memberCount, onCampaignChange }: DmHeaderProps) {
  return (
    <header className="bg-parchment-100 border-b border-parchment-300 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Crown size={18} className="text-gold-500" />
        {campaign ? (
          <>
            {campaigns.length > 1 ? (
              <select
                value={campaign.id}
                onChange={(e) => onCampaignChange?.(e.target.value)}
                className="font-display text-sm text-ink-900 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-display text-sm text-ink-900">{campaign.name}</span>
            )}
          </>
        ) : (
          <span className="font-display text-sm text-ink-500">No campaign selected</span>
        )}
      </div>

      {campaign && memberCount !== undefined && (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-ink-400" />
          <span className="font-mono text-sm text-ink-700">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}
    </header>
  )
}
