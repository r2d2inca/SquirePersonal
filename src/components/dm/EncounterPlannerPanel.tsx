import { useState } from 'react'
import { Plus, Flag, Trash2, Play, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EncounterTemplateEditor } from './EncounterTemplateEditor'
import { EncounterDifficultyCard } from './EncounterDifficultyCard'
import { useEncounterTemplates } from '@/hooks/useEncounterTemplates'
import { useLaunchEncounter } from '@/hooks/useLaunchEncounter'
import { useDmStore } from '@/stores/dmStore'
import type { Character, EncounterTemplate, Npc } from '@/lib/types/database'

interface EncounterPlannerPanelProps {
  campaignId: string
  userId: string
  npcs: Npc[]
  partyCharacters: Character[]
}

export function EncounterPlannerPanel({ campaignId, userId, npcs, partyCharacters }: EncounterPlannerPanelProps) {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useEncounterTemplates(userId, campaignId)
  const launcher = useLaunchEncounter(campaignId, userId, partyCharacters)
  const openTemplateId = useDmStore((s) => s.openTemplateId)
  const setOpenTemplateId = useDmStore((s) => s.setOpenTemplateId)
  const [deleteTarget, setDeleteTarget] = useState<EncounterTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const partyLevels = partyCharacters.map((c) => c.level)
  const openTemplate = openTemplateId ? templates.find((t) => t.id === openTemplateId) ?? null : null

  async function handleCreate() {
    setCreating(true)
    try {
      const created = await addTemplate({
        campaign_id: campaignId,
        user_id: userId,
        name: 'New Encounter',
        description: '',
        monsters: [],
        tactics: '',
        loot: '',
        map_image_url: null,
        sort_order: templates.length,
      })
      setOpenTemplateId(created.id)
    } finally {
      setCreating(false)
    }
  }

  async function handleDuplicate(t: EncounterTemplate) {
    const created = await addTemplate({
      campaign_id: campaignId,
      user_id: userId,
      name: `${t.name} (copy)`,
      description: t.description,
      monsters: t.monsters.map((m) => ({ ...m, id: crypto.randomUUID() })),
      tactics: t.tactics,
      loot: t.loot,
      map_image_url: t.map_image_url,
      sort_order: templates.length,
    })
    setOpenTemplateId(created.id)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
  }

  const replaceDialog = (
    <ConfirmDialog
      open={!!launcher.pendingReplace}
      onClose={launcher.cancelReplace}
      onConfirm={() => void launcher.confirmReplace()}
      title="Replace live encounter?"
      message={`"${launcher.liveEncounter?.name || 'The current encounter'}" is still in the Combat tab. Launching "${launcher.pendingReplace?.name ?? ''}" will end and discard it.`}
      confirmLabel="Replace & Launch"
    />
  )

  if (openTemplate) {
    return (
      <>
        <EncounterTemplateEditor
          key={openTemplate.id}
          template={openTemplate}
          npcs={npcs}
          partyLevels={partyLevels}
          partySize={partyCharacters.length}
          isLaunching={launcher.isLaunching}
          onBack={() => setOpenTemplateId(null)}
          onSave={(updates) => updateTemplate({ id: openTemplate.id, updates })}
          onLaunch={(t) => launcher.launch(t)}
        />
        {replaceDialog}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink-900">Encounter Planner</h2>
          <p className="text-sm text-ink-500 mt-1">Build fights ahead of time, check the math, launch them in one click.</p>
        </div>
        <Button onClick={handleCreate} size="sm" disabled={creating}>
          {creating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Plus size={14} className="mr-1" />} New Encounter
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<Flag size={48} />}
          title="No Saved Encounters"
          description="Pre-build encounters from SRD monsters and your own NPCs. They stay here between sessions and launch straight into the combat tracker."
          action={{ label: 'Build an Encounter', onClick: handleCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:border-gold-400 transition-colors">
              <div onClick={() => setOpenTemplateId(t.id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg text-ink-900 truncate">{t.name}</h3>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => launcher.launch(t)} className="p-1.5 text-ink-300 hover:text-gold-500 cursor-pointer" title="Launch into combat" disabled={launcher.isLaunching}>
                      <Play size={14} />
                    </button>
                    <button onClick={() => handleDuplicate(t)} className="p-1.5 text-ink-300 hover:text-ink-700 cursor-pointer" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-ink-300 hover:text-danger cursor-pointer" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {t.description && <p className="text-sm text-ink-500 line-clamp-2 mb-3">{t.description}</p>}
                <EncounterDifficultyCard monsters={t.monsters} partyLevels={partyLevels} compact />
                {t.monsters.length > 0 && (
                  <p className="text-xs text-ink-400 mt-2 truncate">
                    {t.monsters.map((m) => (m.quantity > 1 ? `${m.quantity}× ${m.name}` : m.name)).join(', ')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteTemplate(deleteTarget.id); setDeleteTarget(null) }}
        title="Delete Encounter"
        message={`Delete "${deleteTarget?.name ?? ''}"? Session plans that reference it will keep their notes but lose the link.`}
      />
      {replaceDialog}
    </div>
  )
}
