import { create } from 'zustand'

export type DmTabId = 'campaigns' | 'party' | 'monsters' | 'npcs' | 'notes' | 'sessions' | 'hub' | 'ai' | 'combat'

interface DmUIState {
  activeDmTab: DmTabId
  activeCampaignId: string | null
  setActiveDmTab: (tab: DmTabId) => void
  setActiveCampaignId: (id: string | null) => void
}

export const useDmStore = create<DmUIState>((set) => ({
  activeDmTab: 'campaigns',
  activeCampaignId: null,
  setActiveDmTab: (tab) => set({ activeDmTab: tab }),
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),
}))
