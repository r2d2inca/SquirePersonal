import { useState } from 'react'
import { useEncounter } from '@/hooks/useEncounter'
import { useEncounterActions } from '@/hooks/useEncounterActions'
import { useDmStore } from '@/stores/dmStore'
import { pushToast } from '@/stores/toastStore'
import { buildLaunchCombatants } from '@/lib/encounterPlanning'
import type { Character, EncounterTemplate } from '@/lib/types/database'

/**
 * Turns a saved encounter into the campaign's live encounter and jumps to the
 * Combat tab. Only one live (non-completed) encounter exists per campaign, so
 * launching while one is running asks before replacing it.
 */
export function useLaunchEncounter(campaignId: string, userId: string, partyCharacters: Character[]) {
  const { encounter: liveEncounter } = useEncounter(campaignId)
  const actions = useEncounterActions(campaignId)
  const setActiveDmTab = useDmStore((s) => s.setActiveDmTab)
  const [pending, setPending] = useState<EncounterTemplate | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)

  async function performLaunch(template: EncounterTemplate, includeParty: boolean) {
    setIsLaunching(true)
    try {
      if (liveEncounter) await actions.deleteEncounter(liveEncounter.id)
      const encounter = await actions.createEncounter({
        campaign_id: campaignId,
        dm_user_id: userId,
        status: 'setup',
        current_turn_combatant_id: null,
        round: 1,
        grid_width: 20,
        grid_height: 15,
        map_image_url: template.map_image_url,
        name: template.name,
        template_id: template.id,
      })
      const rows = buildLaunchCombatants(template, partyCharacters, {
        encounterId: encounter.id,
        gridWidth: encounter.grid_width,
        gridHeight: encounter.grid_height,
      }, includeParty)
      if (rows.length > 0) await actions.addCombatants(rows)
      pushToast({ message: `Launched "${template.name}" — roll initiative when ready.`, tone: 'heal' })
      setActiveDmTab('combat')
    } catch (err) {
      pushToast({ message: err instanceof Error ? err.message : 'Could not launch encounter', tone: 'danger' })
    } finally {
      setIsLaunching(false)
      setPending(null)
    }
  }

  /** Entry point for buttons. Defers to a confirm step if combat is already live. */
  function launch(template: EncounterTemplate, includeParty = true) {
    if (template.monsters.length === 0) {
      pushToast({ message: 'Add at least one creature before launching.', tone: 'danger' })
      return
    }
    if (liveEncounter && liveEncounter.status !== 'completed') {
      setPending(template)
      return
    }
    void performLaunch(template, includeParty)
  }

  return {
    launch,
    isLaunching,
    liveEncounter,
    /** Set while waiting for the DM to confirm replacing a live encounter. */
    pendingReplace: pending,
    confirmReplace: () => pending && performLaunch(pending, true),
    cancelReplace: () => setPending(null),
  }
}
