import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { levelFromXP } from '@/lib/levelProgression'
import type { Character } from '@/lib/types/database'

interface XpAwardModalProps {
  open: boolean
  onClose: () => void
  characters: Character[]
  onAward: (characterId: string, amount: number) => Promise<unknown>
  isAwarding: boolean
}

export function XpAwardModal({ open, onClose, characters, onAward, isAwarding }: XpAwardModalProps) {
  const [amountStr, setAmountStr] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(characters.map((c) => c.id)))
  const [error, setError] = useState<string | null>(null)

  const amount = parseInt(amountStr) || 0
  const allSelected = selected.size === characters.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAward() {
    setError(null)
    if (amount <= 0) { setError('Enter an XP amount greater than 0.'); return }
    if (selected.size === 0) { setError('Select at least one character.'); return }
    try {
      await Promise.all([...selected].map((id) => onAward(id, amount)))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award XP.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Award XP" size="md">
      <div className="space-y-4">
        <div className="flex items-end gap-3">
          <Input
            type="number"
            min={1}
            label="XP to award"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g. 250"
            className="w-40"
          />
          <button
            onClick={() => setSelected(allSelected ? new Set() : new Set(characters.map((c) => c.id)))}
            className="text-xs text-gold-600 hover:text-gold-700 pb-2 cursor-pointer"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {characters.map((char) => {
            const projected = char.experience_points + (selected.has(char.id) ? amount : 0)
            const levelsUp = levelFromXP(projected) - char.level
            return (
              <label
                key={char.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-parchment-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(char.id)}
                  onChange={() => toggle(char.id)}
                  className="accent-gold-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm text-ink-900">{char.name}</div>
                  <div className="text-xs text-ink-500">
                    Level {char.level} · {char.experience_points.toLocaleString()} XP
                  </div>
                </div>
                {selected.has(char.id) && amount > 0 && levelsUp > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-heal font-display uppercase">
                    <Sparkles size={11} /> +{levelsUp} level{levelsUp > 1 ? 's' : ''}
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleAward} disabled={isAwarding}>
            {isAwarding ? 'Awarding…' : `Award ${amount > 0 ? amount.toLocaleString() + ' ' : ''}XP`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
