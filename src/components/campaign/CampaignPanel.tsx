import { useMemo } from 'react'
import { Users, BookOpen, Map, MessageCircle, Compass, Target, Swords } from 'lucide-react'
import { useUIStore, type CampaignSubTab } from '@/stores/uiStore'
import { usePlayerCampaign } from '@/hooks/usePlayerCampaign'
import { useCampaignMembers } from '@/hooks/useCampaignMembers'
import { useCampaignSessionLogs } from '@/hooks/useCampaignSessionLogs'
import { useCampaignLore } from '@/hooks/useCampaignLore'
import { useCampaignQuests } from '@/hooks/useCampaignQuests'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CampaignMembersSection } from './CampaignMembersSection'
import { CampaignSessionLogsSection } from './CampaignSessionLogsSection'
import { CampaignLoreSection } from './CampaignLoreSection'
import { CampaignChatSection } from './CampaignChatSection'
import { CampaignQuestsSection } from './CampaignQuestsSection'
import { CampaignCombatSection } from './CampaignCombatSection'

const SUB_TABS: { id: CampaignSubTab; label: string; icon: typeof Users }[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'lore', label: 'Lore', icon: Map },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'combat', label: 'Combat', icon: Swords },
]

interface CampaignPanelProps {
  userId: string
}

export function CampaignPanel({ userId }: CampaignPanelProps) {
  const { campaign, isLoading } = usePlayerCampaign(userId)
  const { members } = useCampaignMembers(campaign?.id)
  const { logs, addLog, updateLog, deleteLog } = useCampaignSessionLogs(campaign?.id)
  const { entries: loreEntries, addEntry: addLore, updateEntry: updateLore, deleteEntry: deleteLore } = useCampaignLore(campaign?.id)
  const { quests, addQuest, updateQuest, deleteQuest } = useCampaignQuests(campaign?.id)
  const campaignSubTab = useUIStore((s) => s.campaignSubTab)
  const setCampaignSubTab = useUIStore((s) => s.setCampaignSubTab)

  // Build a user_id -> display name map, preferring character name over profile name
  const memberNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of members) {
      const name = m.characters?.name ?? m.profiles?.display_name ?? (m.role === 'dm' ? 'Dungeon Master' : 'Unknown')
      map[m.user_id] = m.role === 'dm' ? `${name} (DM)` : name
    }
    return map
  }, [members])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!campaign) {
    return (
      <EmptyState
        icon={<Compass size={48} />}
        title="No Campaign"
        description="You haven't joined a campaign yet. Use the Join Campaign button in the sidebar to enter an invite code from your DM."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div>
        <h1 className="font-display text-2xl text-ink-900">{campaign.name}</h1>
        {campaign.description && (
          <p className="text-sm text-ink-500 mt-1">{campaign.description}</p>
        )}
      </div>

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 border-b border-parchment-300">
        {SUB_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = campaignSubTab === id
          return (
            <button
              key={id}
              onClick={() => setCampaignSubTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? 'border-gold-400 text-gold-600'
                  : 'border-transparent text-ink-300 hover:text-ink-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Active sub-section */}
      {campaignSubTab === 'members' && <CampaignMembersSection members={members} />}

      {campaignSubTab === 'sessions' && (
        <CampaignSessionLogsSection
          logs={logs}
          campaignId={campaign.id}
          userId={userId}
          memberNames={memberNames}
          onAdd={addLog}
          onUpdate={(id, updates) => updateLog({ id, updates })}
          onDelete={deleteLog}
        />
      )}

      {campaignSubTab === 'lore' && (
        <CampaignLoreSection
          entries={loreEntries}
          campaignId={campaign.id}
          userId={userId}
          memberNames={memberNames}
          onAdd={addLore}
          onUpdate={(id, updates) => updateLore({ id, updates })}
          onDelete={deleteLore}
        />
      )}

      {campaignSubTab === 'quests' && (
        <CampaignQuestsSection
          quests={quests}
          campaignId={campaign.id}
          userId={userId}
          onAdd={addQuest}
          onUpdate={(id, updates) => updateQuest({ id, updates })}
          onDelete={deleteQuest}
        />
      )}

      {campaignSubTab === 'chat' && (
        <CampaignChatSection
          campaignId={campaign.id}
          userId={userId}
          members={members}
          memberNames={memberNames}
        />
      )}

      {campaignSubTab === 'combat' && (
        <CampaignCombatSection
          campaignId={campaign.id}
          userId={userId}
        />
      )}
    </div>
  )
}
