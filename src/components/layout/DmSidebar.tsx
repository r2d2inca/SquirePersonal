import { Link } from 'react-router'
import {
  Crown,
  Users,
  Skull,
  Ghost,
  StickyNote,
  BookOpen,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Swords,
  Compass,
  Sun,
  Moon,
  Dices,
  Globe,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useDmStore, type DmTabId } from '@/stores/dmStore'
import { useUIStore } from '@/stores/uiStore'
import { useThemeStore } from '@/stores/themeStore'
import { useDiceStore } from '@/stores/diceStore'
import { useSoundStore } from '@/stores/soundStore'
import { playSound } from '@/lib/sound'

const NAV_ITEMS: { id: DmTabId; label: string; icon: typeof Crown }[] = [
  { id: 'campaigns', label: 'Campaigns', icon: Crown },
  { id: 'party', label: 'Party Overview', icon: Users },
  { id: 'combat', label: 'Combat Tracker', icon: Swords },
  { id: 'monsters', label: 'Monster Manual', icon: Skull },
  { id: 'npcs', label: 'Custom NPCs', icon: Ghost },
  { id: 'notes', label: 'DM Notes', icon: StickyNote },
  { id: 'sessions', label: 'Session Recaps', icon: BookOpen },
  { id: 'hub', label: 'Campaign Hub', icon: Compass },
  { id: 'ai', label: 'AI Assistant', icon: MessageCircle },
]

interface DmSidebarProps {
  campaignName?: string
  memberCount?: number
  onLogout?: () => void
}

export function DmSidebar({ campaignName, memberCount, onLogout }: DmSidebarProps) {
  const { activeDmTab, setActiveDmTab } = useDmStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { theme, toggleTheme } = useThemeStore()
  const toggleDice = useDiceStore((s) => s.toggleOpen)
  const { enabled: soundEnabled, volume, toggleEnabled: toggleSound, setVolume } = useSoundStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-leather-900 border-r border-leather-600 flex flex-col z-40 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-leather-700 flex items-center gap-3">
        <Swords className="text-gold-400 shrink-0" size={24} />
        {sidebarOpen && (
          <div>
            <h1 className="font-display text-xl text-gold-400 tracking-wider">Squire</h1>
            <p className="font-display text-xs text-parchment-400 -mt-0.5">DM Hub</p>
          </div>
        )}
      </div>

      {/* Campaign summary */}
      {campaignName && sidebarOpen && (
        <div className="p-4 border-b border-leather-700">
          <p className={`font-display text-sm truncate ${theme === 'dark' ? 'text-ink-900' : 'text-parchment-100'}`}>{campaignName}</p>
          {memberCount !== undefined && (
            <p className={`text-xs ${theme === 'dark' ? 'text-ink-700' : 'text-parchment-400'}`}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeDmTab === id
          return (
            <button
              key={id}
              onClick={() => {
                playSound('click')
                setActiveDmTab(id)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                isActive
                  ? 'bg-leather-700 text-gold-400 border-l-2 border-gold-400'
                  : `${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-300 hover:text-parchment-100'} hover:bg-leather-800 border-l-2 border-transparent`
              }`}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="font-body text-sm">{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-leather-700">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
        >
          {theme === 'light' ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
          {sidebarOpen && <span className="font-body text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button
          onClick={toggleDice}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? 'Dice Roller' : undefined}
        >
          <Dices size={20} className="shrink-0" />
          {sidebarOpen && <span className="font-body text-sm">Dice Roller</span>}
        </button>
        <button
          onClick={toggleSound}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? (soundEnabled ? 'Mute Sound' : 'Unmute Sound') : undefined}
        >
          {soundEnabled ? <Volume2 size={20} className="shrink-0" /> : <VolumeX size={20} className="shrink-0" />}
          {sidebarOpen && <span className="font-body text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>}
        </button>
        {sidebarOpen && soundEnabled && (
          <div className="px-4 pb-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              onPointerUp={() => playSound('click')}
              aria-label="Sound volume"
              className="w-full accent-gold-400 cursor-pointer"
            />
          </div>
        )}
        <Link
          to="/dashboard"
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? 'Switch to Player' : undefined}
        >
          <Shield size={20} className="shrink-0" />
          {sidebarOpen && <span className="font-body text-sm">Switch to Player</span>}
        </Link>
        <Link
          to="/"
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? 'Website' : undefined}
        >
          <Globe size={20} className="shrink-0" />
          {sidebarOpen && <span className="font-body text-sm">Website</span>}
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
            title={!sidebarOpen ? 'Log Out' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="font-body text-sm">Log Out</span>}
          </button>
        )}
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center justify-center py-3 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  )
}
