import { useState } from 'react'
import { Eye, EyeOff, Users, Check } from 'lucide-react'

interface LoreVisibilityMenuProps {
  isRevealed: boolean
  visibleTo: string[]
  members: { id: string; name: string }[]
  onChange: (isRevealed: boolean, visibleTo: string[]) => void
}

type Mode = 'everyone' | 'select' | 'hidden'

function deriveMode(isRevealed: boolean, visibleTo: string[]): Mode {
  if (isRevealed) return 'everyone'
  if (visibleTo.length > 0) return 'select'
  return 'hidden'
}

export function LoreVisibilityMenu({ isRevealed, visibleTo, members, onChange }: LoreVisibilityMenuProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>(deriveMode(isRevealed, visibleTo))

  const Icon = mode === 'everyone' ? Eye : mode === 'select' ? Users : EyeOff
  const color =
    mode === 'everyone' ? 'text-heal' : mode === 'select' ? 'text-gold-600' : 'text-ink-300'
  const label =
    mode === 'everyone' ? 'Visible to all'
    : mode === 'select' ? `Shared with ${visibleTo.length}`
    : 'Hidden'

  function selectMode(next: Mode) {
    setMode(next)
    if (next === 'everyone') onChange(true, [])
    else if (next === 'hidden') onChange(false, [])
    else onChange(false, visibleTo) // keep current selection
  }

  function toggleMember(id: string) {
    const next = visibleTo.includes(id)
      ? visibleTo.filter((m) => m !== id)
      : [...visibleTo, id]
    onChange(false, next)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-1 transition-colors cursor-pointer hover:text-ink-700 ${color}`}
        title={`Visibility: ${label}`}
      >
        <Icon size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-parchment-50 border border-parchment-300 rounded-lg shadow-lg p-1">
            <div className="px-2 py-1 text-[10px] font-display uppercase tracking-wider text-ink-400">
              Who can see this
            </div>
            {([
              { m: 'everyone' as Mode, icon: Eye, text: 'Everyone' },
              { m: 'select' as Mode, icon: Users, text: 'Select players' },
              { m: 'hidden' as Mode, icon: EyeOff, text: 'Hidden (DM only)' },
            ]).map(({ m, icon: OptIcon, text }) => (
              <button
                key={m}
                onClick={() => selectMode(m)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                  mode === m ? 'bg-parchment-200 text-ink-900' : 'text-ink-700 hover:bg-parchment-200'
                }`}
              >
                <OptIcon size={14} />
                <span className="flex-1 text-left">{text}</span>
                {mode === m && <Check size={14} className="text-gold-600" />}
              </button>
            ))}

            {mode === 'select' && (
              <div className="mt-1 border-t border-parchment-200 pt-1 max-h-48 overflow-y-auto">
                {members.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-ink-400">No players to share with</div>
                ) : (
                  members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-ink-700 hover:bg-parchment-200 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleTo.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="accent-gold-500"
                      />
                      <span className="truncate">{member.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
