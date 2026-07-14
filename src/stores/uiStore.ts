import { create } from 'zustand'

export type TabId = 'character' | 'spells' | 'inventory' | 'ai' | 'sessions' | 'lore' | 'notes' | 'campaign'

export type CampaignSubTab = 'members' | 'sessions' | 'lore' | 'chat' | 'quests' | 'combat'

interface UIState {
  activeTab: TabId
  sidebarOpen: boolean
  modalOpen: string | null
  campaignSubTab: CampaignSubTab
  setActiveTab: (tab: TabId) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  setCampaignSubTab: (tab: CampaignSubTab) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'character',
  sidebarOpen: true,
  modalOpen: null,
  campaignSubTab: 'members',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ modalOpen: id }),
  closeModal: () => set({ modalOpen: null }),
  setCampaignSubTab: (tab) => set({ campaignSubTab: tab }),
}))
