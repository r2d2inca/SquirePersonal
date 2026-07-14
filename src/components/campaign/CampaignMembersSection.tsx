import { Crown, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { CampaignMember } from '@/lib/types/database'

interface CampaignMembersSectionProps {
  members: CampaignMember[]
}

export function CampaignMembersSection({ members }: CampaignMembersSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-ink-900">Party Members</h2>

      {members.length === 0 ? (
        <p className="text-ink-500 text-sm">No members in this campaign yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const char = member.characters
            const isDM = member.role === 'dm'
            return (
              <Card key={member.id}>
                <div className="flex items-start gap-3">
                  {char?.portrait_url ? (
                    <img
                      src={char.portrait_url}
                      alt={char.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-parchment-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-leather-700 flex items-center justify-center shrink-0">
                      {isDM ? (
                        <Crown size={18} className="text-gold-400" />
                      ) : (
                        <Shield size={18} className="text-parchment-200" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm text-ink-900 truncate">
                        {char?.name ?? member.profiles?.display_name ?? 'Unknown'}
                      </span>
                      {isDM && <Badge variant="gold">DM</Badge>}
                    </div>
                    {char ? (
                      <>
                        <p className="text-sm text-ink-700 mt-0.5">
                          {char.race} {char.class}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                          <span>Lvl {char.level}</span>
                          <span>HP {char.current_hp}/{char.max_hp}</span>
                          <span>AC {char.armor_class}</span>
                        </div>
                        {char.max_hp > 0 && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-parchment-300 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-health transition-all"
                              style={{ width: `${Math.min(100, (char.current_hp / char.max_hp) * 100)}%` }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-ink-300 mt-1">No character linked</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
