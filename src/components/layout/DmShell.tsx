import type { ReactNode } from 'react'
import { DmSidebar } from './DmSidebar'
import { DmHeader } from './DmHeader'
import { DmMobileNav } from './DmMobileNav'
import { DiceRoller } from '@/components/ui/DiceRoller'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useUIStore } from '@/stores/uiStore'
import type { Campaign } from '@/lib/types/database'

interface DmShellProps {
  children: ReactNode
  campaign?: Campaign | null
  campaigns?: Campaign[]
  memberCount?: number
  onCampaignChange?: (id: string) => void
  onLogout?: () => void
}

export function DmShell({ children, campaign, campaigns, memberCount, onCampaignChange, onLogout }: DmShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="min-h-screen bg-parchment-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DmSidebar
          campaignName={campaign?.name}
          memberCount={memberCount}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 pb-20 md:pb-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}
      >
        <DmHeader
          campaign={campaign}
          campaigns={campaigns}
          memberCount={memberCount}
          onCampaignChange={onCampaignChange}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DmMobileNav />
      </div>

      <DiceRoller />
      <ToastContainer />
    </div>
  )
}
