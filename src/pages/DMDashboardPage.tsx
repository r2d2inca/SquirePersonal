import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useCampaignMembers } from '@/hooks/useCampaignMembers'
import { usePartyCharacters } from '@/hooks/usePartyCharacters'
import { useNpcs } from '@/hooks/useNpcs'
import { useDmNotes } from '@/hooks/useDmNotes'
import { useDmSessionLogs } from '@/hooks/useDmSessionLogs'
import { useAI } from '@/hooks/useAI'
import { useDmStore } from '@/stores/dmStore'
import { DmShell } from '@/components/layout/DmShell'
import { CampaignListPanel } from '@/components/dm/CampaignListPanel'
import { PartyOverviewPanel } from '@/components/dm/PartyOverviewPanel'
import { MonsterManualPanel } from '@/components/dm/MonsterManualPanel'
import { NpcPanel } from '@/components/dm/NpcPanel'
import { DmNotesPanel } from '@/components/dm/DmNotesPanel'
import { DmSessionLogPanel } from '@/components/dm/DmSessionLogPanel'
import { DmAIChatPanel } from '@/components/dm/DmAIChatPanel'
import { DmCampaignHubPanel } from '@/components/dm/DmCampaignHubPanel'
import { SharedCombatPanel } from '@/components/dm/SharedCombatPanel'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function DMDashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const { activeDmTab, activeCampaignId, setActiveCampaignId, setActiveDmTab } = useDmStore()

  const { campaigns, isLoading: campaignsLoading, addCampaign, updateCampaign, deleteCampaign } = useCampaigns(user?.id)
  const { members } = useCampaignMembers(activeCampaignId)
  const { characters: partyCharacters, isLoading: partyLoading } = usePartyCharacters(activeCampaignId)
  const { npcs, addNpc, updateNpc, deleteNpc } = useNpcs(user?.id, activeCampaignId)
  const { notes: dmNotes, addNote: addDmNote, updateNote: updateDmNote, deleteNote: deleteDmNote } = useDmNotes(user?.id, activeCampaignId)
  const { sessions: dmSessions, addSession: addDmSession, updateSession: updateDmSession, deleteSession: deleteDmSession } = useDmSessionLogs(user?.id, activeCampaignId)
  const { messages, isLoading: aiLoading, sendMessage, clearMessages } = useAI()

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) ?? null

  // Auto-select first campaign if none selected
  useEffect(() => {
    if (!activeCampaignId && campaigns.length > 0) {
      setActiveCampaignId(campaigns[0].id)
    }
  }, [campaigns, activeCampaignId, setActiveCampaignId])

  // Redirect to campaign wizard if DM has no campaigns
  // Wait for both auth and campaigns to fully load before checking
  useEffect(() => {
    if (!authLoading && user && !campaignsLoading && campaigns.length === 0 && !sessionStorage.getItem('campaign-just-created')) {
      navigate('/new-campaign')
    }
    if (campaigns.length > 0) {
      sessionStorage.removeItem('campaign-just-created')
    }
  }, [campaignsLoading, campaigns.length, navigate])

  // Build member counts for campaign list
  const memberCounts: Record<string, number> = {}
  if (activeCampaignId) {
    memberCounts[activeCampaignId] = members.length
  }

  function handleSelectCampaign(id: string) {
    setActiveCampaignId(id)
    setActiveDmTab('party')
  }

  function handleCampaignChange(id: string) {
    setActiveCampaignId(id)
  }

  function handleAISendMessage(message: string) {
    // Build DM context
    const partySummary = partyCharacters.map((c) => ({
      name: c.name,
      class: c.class,
      level: c.level,
      hp: `${c.current_hp}/${c.max_hp}`,
    }))

    const dmContext = JSON.stringify({
      mode: 'dm',
      campaignName: activeCampaign?.name ?? 'No campaign',
      partyMembers: partySummary,
      recentNotes: dmNotes.slice(0, 5).map((n) => ({ title: n.title, content: n.content })),
      recentSessions: dmSessions.slice(0, 3).map((s) => ({ title: s.title, summary: s.summary })),
    }, null, 2)

    sendMessage(message, {
      character: null,
      activeEffects: [],
      spells: [],
      spellSlots: [],
      equippedItems: [],
      recentSessions: [],
      relevantLore: [],
    }, dmContext)
  }

  if (authLoading || campaignsLoading || !user) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <DmShell
      campaign={activeCampaign}
      campaigns={campaigns}
      memberCount={members.length}
      onCampaignChange={handleCampaignChange}
      onLogout={signOut}
    >
      {activeDmTab === 'campaigns' && (
        <CampaignListPanel
          campaigns={campaigns}
          userId={user!.id}
          memberCounts={memberCounts}
          onAdd={addCampaign}
          onUpdate={(id, updates) => updateCampaign({ id, updates })}
          onDelete={deleteCampaign}
          onSelect={handleSelectCampaign}
        />
      )}

      {activeDmTab === 'party' && (
        <PartyOverviewPanel
          characters={partyCharacters}
          isLoading={partyLoading}
          hasCampaign={!!activeCampaignId}
          campaignId={activeCampaignId}
        />
      )}

      {activeDmTab === 'combat' && activeCampaignId && (
        <SharedCombatPanel
          campaignId={activeCampaignId}
          userId={user!.id}
          partyCharacters={partyCharacters}
          hasCampaign={true}
        />
      )}
      {activeDmTab === 'combat' && !activeCampaignId && (
        <SharedCombatPanel
          campaignId=""
          userId={user!.id}
          partyCharacters={[]}
          hasCampaign={false}
        />
      )}

      {activeDmTab === 'monsters' && (
        <MonsterManualPanel
          userId={user!.id}
          campaignId={activeCampaignId}
          onSaveAsNpc={addNpc}
        />
      )}

      {activeDmTab === 'npcs' && (
        <NpcPanel
          npcs={npcs}
          userId={user!.id}
          campaignId={activeCampaignId}
          onAdd={addNpc}
          onUpdate={(id, updates) => updateNpc({ id, updates })}
          onDelete={deleteNpc}
        />
      )}

      {activeDmTab === 'notes' && activeCampaignId && (
        <DmNotesPanel
          notes={dmNotes}
          userId={user!.id}
          campaignId={activeCampaignId}
          onAdd={addDmNote}
          onUpdate={(id, updates) => updateDmNote({ id, updates })}
          onDelete={deleteDmNote}
        />
      )}

      {activeDmTab === 'notes' && !activeCampaignId && (
        <DmNotesPanel
          notes={[]}
          userId={user!.id}
          campaignId=""
          onAdd={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      )}

      {activeDmTab === 'sessions' && activeCampaignId && (
        <DmSessionLogPanel
          sessions={dmSessions}
          userId={user!.id}
          campaignId={activeCampaignId}
          onAdd={addDmSession}
          onUpdate={(id, updates) => updateDmSession({ id, updates })}
          onDelete={deleteDmSession}
        />
      )}

      {activeDmTab === 'sessions' && !activeCampaignId && (
        <DmSessionLogPanel
          sessions={[]}
          userId={user!.id}
          campaignId=""
          onAdd={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      )}

      {activeDmTab === 'hub' && activeCampaignId && (
        <DmCampaignHubPanel
          campaignId={activeCampaignId}
          campaignName={activeCampaign?.name ?? 'Campaign'}
          userId={user!.id}
        />
      )}

      {activeDmTab === 'ai' && (
        <DmAIChatPanel
          messages={messages}
          isLoading={aiLoading}
          onSendMessage={handleAISendMessage}
          onClear={clearMessages}
        />
      )}
    </DmShell>
  )
}
