import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { DiceRoller } from '@/components/ui/DiceRoller'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useUIStore } from '@/stores/uiStore'
import type { Character, ActiveEffect } from '@/lib/types/database'

interface AppShellProps {
  children: ReactNode
  character?: Character | null
  activeEffects?: ActiveEffect[]
  onLogout?: () => void
  onJoinCampaign?: () => void
}

export function AppShell({ children, character, activeEffects, onLogout, onJoinCampaign }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div
      className="min-h-screen bg-parchment-200"
      style={{ backgroundImage: 'var(--app-bloom)', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          characterName={character?.name}
          characterClass={character?.class}
          characterLevel={character?.level}
          onLogout={onLogout}
          onJoinCampaign={onJoinCampaign}
        />
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 pb-20 md:pb-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}
      >
        <Header character={character} activeEffects={activeEffects} />
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      <DiceRoller />
      <ToastContainer />
    </div>
  )
}
