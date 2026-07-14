import { useMemo } from 'react'
import { Users, BookOpen, Map, MessageCircle, Compass, Target, Swords } from 'lucide-react'
import { useUIStore, type CampaignSubTab } from '@/stores/uiStore'
import { useCampaignMembers } from '@/hooks/useCampaignMembers'
import { useCampaignSessionLogs } from '@/hooks/useCampaignSessionLogs'
import { useCampaignLore } from '@/hooks/useCampaignLore'
import { useCampaignQuests } from '@/hooks/useCampaignQuests'
import { EmptyState } from '@/components/ui/EmptyState'
import { CampaignMembersSection } from '@/components/campaign/CampaignMembersSection'
import { CampaignSessionLogsSection } from '@/components/campaign/CampaignSessionLogsSection'
import { CampaignLoreSection } from '@/components/campaign/CampaignLoreSection'
import { CampaignChatSection } from '@/components/campaign/CampaignChatSection'
import { CampaignQuestsSection } from '@/components/campaign/CampaignQuestsSection'
import { CampaignCombatSection } from '@/components/campaign/CampaignCombatSection'

const SUB_TABS: { id: CampaignSubTab; label: string; icon: typeof Users }[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'lore', label: 'Lore', icon: Map },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'combat', label: 'Combat', icon: Swords },
]

interface DmCampaignHubPanelProps {
  campaignId: string
  campaignName: string
  userId: string
}

export function DmCampaignHubPanel({ campaignId, campaignName, userId }: DmCampaignHubPanelProps) {
  const { members } = useCampaignMembers(campaignId)
  const { logs, addLog, updateLog, deleteLog } = useCampaignSessionLogs(campaignId)
  const { entries: loreEntries, addEntry: addLore, updateEntry: updateLore, deleteEntry: deleteLore } = useCampaignLore(campaignId)
  const { quests, addQuest, updateQuest, deleteQuest } = useCampaignQuests(campaignId)
  const campaignSubTab = useUIStore((s) => s.campaignSubTab)
  const setCampaignSubTab = useUIStore((s) => s.setCampaignSubTab)

  const memberNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of members) {
      const name = m.characters?.name ?? m.profiles?.display_name ?? (m.role === 'dm' ? 'Dungeon Master' : 'Unknown')
      map[m.user_id] = m.role === 'dm' ? `${name} (DM)` : name
    }
    return map
  }, [members])

  if (!campaignId) {
    return (
      <EmptyState
        icon={<Compass size={48} />}
        title="No Campaign Selected"
        description="Select a campaign from the Campaigns tab first."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900">{campaignName} — Shared Hub</h1>
        <p className="text-sm text-ink-500 mt-1">Shared content visible to all campaign members</p>
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

      {campaignSubTab === 'members' && <CampaignMembersSection members={members} />}

      {campaignSubTab === 'sessions' && (
        <CampaignSessionLogsSection
          logs={logs}
          campaignId={campaignId}
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
          campaignId={campaignId}
          userId={userId}
          memberNames={memberNames}
          onAdd={addLore}
          onUpdate={(id, updates) => updateLore({ id, updates })}
          onDelete={deleteLore}
          isDm
        />
      )}

      {campaignSubTab === 'quests' && (
        <CampaignQuestsSection
          quests={quests}
          campaignId={campaignId}
          userId={userId}
          onAdd={addQuest}
          onUpdate={(id, updates) => updateQuest({ id, updates })}
          onDelete={deleteQuest}
        />
      )}

      {campaignSubTab === 'chat' && (
        <CampaignChatSection
          campaignId={campaignId}
          userId={userId}
          members={members}
          memberNames={memberNames}
        />
      )}

      {campaignSubTab === 'combat' && (
        <CampaignCombatSection
          campaignId={campaignId}
          userId={userId}
        />
      )}
    </div>
  )
}
