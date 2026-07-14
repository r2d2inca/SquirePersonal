import { useState } from 'react'
import { Crown, Users, Skull, MessageCircle, MoreHorizontal, Ghost, StickyNote, BookOpen, Compass, Swords } from 'lucide-react'
import { useDmStore, type DmTabId } from '@/stores/dmStore'

const PRIMARY_TABS: { id: DmTabId; label: string; icon: typeof Crown }[] = [
  { id: 'campaigns', label: 'Campaigns', icon: Crown },
  { id: 'party', label: 'Party', icon: Users },
  { id: 'monsters', label: 'Monsters', icon: Skull },
  { id: 'ai', label: 'Assistant', icon: MessageCircle },
]

const MORE_TABS: { id: DmTabId; label: string; icon: typeof Ghost }[] = [
  { id: 'combat', label: 'Combat', icon: Swords },
  { id: 'npcs', label: 'NPCs', icon: Ghost },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'hub', label: 'Campaign Hub', icon: Compass },
]

export function DmMobileNav() {
  const { activeDmTab, setActiveDmTab } = useDmStore()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_TABS.some((t) => t.id === activeDmTab)

  return (
    <>
      {/* More menu popup */}
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-16 right-2 bg-parchment-100 border border-parchment-400 rounded-lg shadow-[var(--shadow-lg)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveDmTab(id)
                  setMoreOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors cursor-pointer ${
                  activeDmTab === id ? 'bg-gold-200 text-gold-700' : 'text-ink-700 hover:bg-parchment-200'
                }`}
              >
                <Icon size={18} />
                <span className="font-body text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-leather-900 border-t border-leather-600 flex z-30 pb-[env(safe-area-inset-bottom)]">
        {PRIMARY_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeDmTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveDmTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors cursor-pointer ${
                isActive ? 'text-gold-400' : 'text-parchment-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-display uppercase">{label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors cursor-pointer ${
            isMoreActive ? 'text-gold-400' : 'text-parchment-400'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-display uppercase">More</span>
        </button>
      </nav>
    </>
  )
}
