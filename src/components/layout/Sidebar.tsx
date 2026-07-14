import { Link } from 'react-router'
import {
  ScrollText,
  Swords,
  Backpack,
  MessageCircle,
  BookOpen,
  Map,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Crown,
  Users,
  Compass,
  Sun,
  Moon,
  Dices,
  Globe,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useUIStore, type TabId } from '@/stores/uiStore'
import { useThemeStore } from '@/stores/themeStore'
import { useDiceStore } from '@/stores/diceStore'
import { useSoundStore } from '@/stores/soundStore'
import { playSound } from '@/lib/sound'

const NAV_ITEMS: { id: TabId; label: string; icon: typeof ScrollText }[] = [
  { id: 'character', label: 'Character', icon: Shield },
  { id: 'spells', label: 'Spells & Magic', icon: ScrollText },
  { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'ai', label: 'AI Assistant', icon: MessageCircle },
  { id: 'sessions', label: 'Session Logs', icon: BookOpen },
  { id: 'lore', label: 'Lore Tracker', icon: Map },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'campaign', label: 'Campaign', icon: Compass },
]

interface SidebarProps {
  characterName?: string
  characterClass?: string
  characterLevel?: number
  onLogout?: () => void
  onJoinCampaign?: () => void
}

export function Sidebar({ characterName, characterClass, characterLevel, onLogout, onJoinCampaign }: SidebarProps) {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar } = useUIStore()
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
          <h1 className="font-display text-xl text-gold-400 tracking-wider">Squire</h1>
        )}
      </div>

      {/* Character summary */}
      {characterName && sidebarOpen && (
        <div className="p-4 border-b border-leather-700">
          <p className={`font-display text-sm truncate ${theme === 'dark' ? 'text-ink-900' : 'text-parchment-100'}`}>{characterName}</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-ink-700' : 'text-parchment-400'}`}>
            Level {characterLevel} {characterClass}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => {
                playSound('click')
                setActiveTab(id)
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
          to="/dm"
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? 'DM Hub' : undefined}
        >
          <Crown size={20} className="shrink-0" />
          {sidebarOpen && <span className="font-body text-sm">DM Hub</span>}
        </Link>
        <Link
          to="/"
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
          title={!sidebarOpen ? 'Website' : undefined}
        >
          <Globe size={20} className="shrink-0" />
          {sidebarOpen && <span className="font-body text-sm">Website</span>}
        </Link>
        {onJoinCampaign && (
          <button
            onClick={onJoinCampaign}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-leather-800 transition-colors cursor-pointer ${theme === 'dark' ? 'text-ink-700 hover:text-ink-900' : 'text-parchment-400 hover:text-parchment-100'}`}
            title={!sidebarOpen ? 'Join Campaign' : undefined}
          >
            <Users size={20} className="shrink-0" />
            {sidebarOpen && <span className="font-body text-sm">Join Campaign</span>}
          </button>
        )}
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
