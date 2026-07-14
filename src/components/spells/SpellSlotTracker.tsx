import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import type { SpellSlot } from '@/lib/types/database'

interface SpellSlotTrackerProps {
  spellSlots: SpellSlot[]
  onExpend: (slotId: string) => void
  onRestore: (slotId: string) => void
  onLongRest: () => void
}

export function SpellSlotTracker({ spellSlots, onExpend, onRestore, onLongRest }: SpellSlotTrackerProps) {
  if (spellSlots.length === 0) return null

  return (
    <div>
      <SectionHeader
        action={
          <Button variant="ghost" size="sm" onClick={onLongRest}>
            Long Rest
          </Button>
        }
      >
        Spell Slots
      </SectionHeader>
      <div className="space-y-2">
        {spellSlots.map((slot) => {
          const remaining = slot.total - slot.expended
          return (
            <div key={slot.id} className="flex items-center gap-3">
              <span className="font-display text-xs uppercase text-ink-500 w-16">
                {slot.slot_level === 1 ? '1st' : slot.slot_level === 2 ? '2nd' : slot.slot_level === 3 ? '3rd' : `${slot.slot_level}th`}
              </span>
              <div className="flex gap-1 flex-1">
                {Array.from({ length: slot.total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => (i < remaining ? onExpend(slot.id) : onRestore(slot.id))}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      i < remaining
                        ? 'bg-arcane-400 border-arcane-500 hover:bg-arcane-500 shadow-[0_0_6px_rgba(123,104,238,0.4)]'
                        : 'bg-transparent border-parchment-400 hover:border-arcane-400/50'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs text-ink-500">{remaining}/{slot.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
