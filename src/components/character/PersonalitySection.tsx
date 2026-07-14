import { useState } from 'react'
import { Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface PersonalitySectionProps {
  character: Character
  onUpdate?: (updates: CharacterUpdate) => void
}

const FIELDS: { key: keyof Character; label: string }[] = [
  { key: 'personality_traits', label: 'Personality Traits' },
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'backstory', label: 'Backstory' },
]

export function PersonalitySection({ character, onUpdate }: PersonalitySectionProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ backstory: true })

  function startEdit(key: string) {
    setDraft((character[key as keyof Character] as string) || '')
    setEditing(key)
  }

  function save() {
    if (!editing || !onUpdate) return
    onUpdate({ [editing]: draft })
    setEditing(null)
  }

  function cancel() {
    setEditing(null)
  }

  return (
    <div>
      <SectionHeader>Personality</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => {
          const value = character[key] as string
          const isEditing = editing === key

          return (
            <div key={key} className="bg-parchment-50 border border-parchment-300 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-display uppercase tracking-wider text-ink-500">{label}</span>
                {onUpdate && !isEditing && (
                  <button
                    onClick={() => startEdit(key)}
                    className="text-ink-300 hover:text-gold-500 transition-colors cursor-pointer"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1 bg-parchment-50 border border-gold-400 rounded text-sm text-ink-700 font-body focus:outline-none focus:ring-1 focus:ring-gold-400"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={save} className="p-1 text-heal hover:text-heal/80 cursor-pointer">
                      <Check size={14} />
                    </button>
                    <button onClick={cancel} className="p-1 text-danger hover:text-danger/80 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : value && value.length > 200 ? (
                <div>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">
                    {collapsed[key] ? value.slice(0, 200) + '...' : value}
                  </p>
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 mt-1 cursor-pointer"
                  >
                    {collapsed[key] ? <><ChevronDown size={12} /> Show more</> : <><ChevronUp size={12} /> Show less</>}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ink-700 whitespace-pre-wrap">{value || <span className="text-ink-300 italic">Not set</span>}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
