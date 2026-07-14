import { useState } from 'react'
import { Moon, Coffee } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { abilityModifier } from '@/lib/calculations'
import type { Character, Feature } from '@/lib/types/database'

interface RestModalProps {
  open: boolean
  onClose: () => void
  character: Character
  restType: 'short' | 'long'
  onShortRest: (hitDiceToSpend: number) => void
  onLongRest: () => void
}

function parseHitDie(hitDiceTotal: string): number {
  const match = hitDiceTotal.match(/d(\d+)/)
  return match ? parseInt(match[1]) : 8
}

export function RestModal({ open, onClose, character, restType, onShortRest, onLongRest }: RestModalProps) {
  const [hitDiceCount, setHitDiceCount] = useState(1)
  const hitDie = parseHitDie(character.hit_dice_total)
  const conMod = abilityModifier(character.constitution)

  const shortRestFeatures = character.features.filter((f) => f.rechargeOn === 'short_rest' && f.usesMax != null && (f.usesRemaining ?? f.usesMax) < f.usesMax)
  const longRestFeatures = character.features.filter((f) => f.rechargeOn && f.usesMax != null && (f.usesRemaining ?? f.usesMax) < f.usesMax)

  if (restType === 'long') {
    const hpToRestore = character.max_hp - character.current_hp
    const hitDiceToRestore = Math.max(1, Math.floor(character.level / 2))
    const currentRemaining = character.hit_dice_remaining
    const maxHitDice = parseInt(character.hit_dice_total) || character.level
    const diceCanRestore = Math.min(hitDiceToRestore, maxHitDice - currentRemaining)

    return (
      <Modal open={open} onClose={onClose} title="Long Rest" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Moon size={24} className="text-arcane-500" />
            <p className="text-sm text-ink-700">
              A long rest restores all hit points, spell slots, and half your hit dice (minimum 1).
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {hpToRestore > 0 && (
              <div className="flex justify-between py-1 border-b border-parchment-300">
                <span className="text-ink-500">HP Restored</span>
                <span className="font-mono text-ink-900">+{hpToRestore} (to {character.max_hp})</span>
              </div>
            )}
            {diceCanRestore > 0 && (
              <div className="flex justify-between py-1 border-b border-parchment-300">
                <span className="text-ink-500">Hit Dice Restored</span>
                <span className="font-mono text-ink-900">+{diceCanRestore}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-parchment-300">
              <span className="text-ink-500">Spell Slots</span>
              <span className="font-mono text-ink-900">All restored</span>
            </div>
            {(character.death_save_successes > 0 || character.death_save_failures > 0) && (
              <div className="flex justify-between py-1 border-b border-parchment-300">
                <span className="text-ink-500">Death Saves</span>
                <span className="font-mono text-ink-900">Reset</span>
              </div>
            )}
            {longRestFeatures.length > 0 && (
              <div className="py-1">
                <span className="text-ink-500">Features Recharged:</span>
                <div className="mt-1 space-y-1">
                  {longRestFeatures.map((f, i) => (
                    <div key={i} className="text-xs text-ink-700 pl-2">
                      {f.name} ({f.usesRemaining ?? 0}/{f.usesMax})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onLongRest()
                onClose()
              }}
              className="flex-1"
            >
              Take Long Rest
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Short Rest
  const avgHeal = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod) * hitDiceCount
  const maxDice = Math.max(0, character.hit_dice_remaining)

  return (
    <Modal open={open} onClose={onClose} title="Short Rest" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Coffee size={24} className="text-gold-500" />
          <p className="text-sm text-ink-700">
            Spend hit dice to recover HP. Each die rolls 1d{hitDie} + {conMod >= 0 ? conMod : conMod} (CON).
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-display uppercase text-ink-500">Hit Dice to Spend</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min={0}
                max={maxDice}
                value={hitDiceCount}
                onChange={(e) => setHitDiceCount(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-sm text-ink-900 w-12 text-center">
                {hitDiceCount}d{hitDie}
              </span>
            </div>
            <div className="flex justify-between text-xs text-ink-400 mt-1">
              <span>Available: {character.hit_dice_remaining}</span>
              <span>Avg heal: ~{avgHeal} HP</span>
            </div>
          </div>

          {shortRestFeatures.length > 0 && (
            <div className="text-sm">
              <span className="text-ink-500">Features Recharged:</span>
              <div className="mt-1 space-y-1">
                {shortRestFeatures.map((f, i) => (
                  <div key={i} className="text-xs text-ink-700 pl-2">
                    {f.name} ({f.usesRemaining ?? 0}/{f.usesMax})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onShortRest(hitDiceCount)
              onClose()
            }}
            className="flex-1"
            disabled={hitDiceCount === 0 && shortRestFeatures.length === 0}
          >
            Take Short Rest
          </Button>
        </div>
      </div>
    </Modal>
  )
}
