import { create } from 'zustand'

export type DmTabId = 'campaigns' | 'party' | 'planner' | 'encounters' | 'monsters' | 'npcs' | 'notes' | 'sessions' | 'hub' | 'ai' | 'combat'

interface DmUIState {
  activeDmTab: DmTabId
  activeCampaignId: string | null
  /** Session plan the planner should open (set when jumping in from elsewhere). */
  openPlanId: string | null
  /** Encounter template the planner should open (set when jumping in from a session beat). */
  openTemplateId: string | null
  setActiveDmTab: (tab: DmTabId) => void
  setActiveCampaignId: (id: string | null) => void
  setOpenPlanId: (id: string | null) => void
  setOpenTemplateId: (id: string | null) => void
}

export const useDmStore = create<DmUIState>((set) => ({
  activeDmTab: 'campaigns',
  activeCampaignId: null,
  openPlanId: null,
  openTemplateId: null,
  setActiveDmTab: (tab) => set({ activeDmTab: tab }),
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),
  setOpenPlanId: (id) => set({ openPlanId: id }),
  setOpenTemplateId: (id) => set({ openTemplateId: id }),
}))
