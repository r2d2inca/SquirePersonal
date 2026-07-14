import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, RotateCcw } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import type { Feature, SpellSlot } from '@/lib/types/database'

// Barbarian rage damage by level
function getRageDamage(level: number): number {
  if (level >= 16) return 4
  if (level >= 9) return 3
  return 2
}

// Divine Smite damage by slot level
function smiteDamage(slotLevel: number): string {
  return `${slotLevel + 1}d8 Radiant`
}

interface FeaturesTraitsProps {
  features: Feature[]
  onUpdate: (features: Feature[]) => void
  characterClass?: string
  characterLevel?: number
  spellSlots?: SpellSlot[]
  onExpendSlot?: (slotId: string) => void
}

export function FeaturesTraits({ features, onUpdate, characterClass, characterLevel, spellSlots, onExpendSlot }: FeaturesTraitsProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newFeature, setNewFeature] = useState<Feature>({
    name: '',
    description: '',
    source: '',
  })

  function toggleExpand(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function addFeature() {
    if (!newFeature.name.trim()) return
    onUpdate([...features, newFeature])
    setNewFeature({ name: '', description: '', source: '' })
    setShowAdd(false)
  }

  function removeFeature(index: number) {
    onUpdate(features.filter((_, i) => i !== index))
  }

  function useFeature(index: number) {
    const updated = [...features]
    const f = updated[index]
    if (f.usesRemaining !== undefined && f.usesRemaining > 0) {
      updated[index] = { ...f, usesRemaining: f.usesRemaining - 1 }
      onUpdate(updated)
    }
  }

  function restoreFeature(index: number) {
    const updated = [...features]
    const f = updated[index]
    if (f.usesMax !== undefined) {
      updated[index] = { ...f, usesRemaining: f.usesMax }
      onUpdate(updated)
    }
  }

  return (
    <div>
      <SectionHeader
        action={
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
        }
      >
        Features & Traits
      </SectionHeader>

      <div className="space-y-2">
        {features.map((feature, i) => (
          <div key={i} className="border border-parchment-300 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(i)}
              className="w-full flex items-center gap-2 p-3 text-left hover:bg-parchment-200/50 transition-colors cursor-pointer"
            >
              {expanded.has(i) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="font-body font-semibold text-ink-900 flex-1">{feature.name}</span>
              {feature.source && (
                <Badge variant={feature.name.startsWith('Boon of') ? 'arcane' : 'gold'}>
                  {feature.name.startsWith('Boon of') ? 'Epic Boon' : feature.source}
                </Badge>
              )}
              {feature.usesMax !== undefined && (
                <span className="font-mono text-xs text-ink-500">
                  {feature.usesRemaining}/{feature.usesMax}
                </span>
              )}
            </button>

            {expanded.has(i) && (
              <div className="px-3 pb-3 border-t border-parchment-200">
                <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{feature.description}</p>
                {feature.name === 'Rage' && characterClass?.toLowerCase().includes('barbarian') && characterLevel && (
                  <div className="mt-2 p-2 bg-gold-100/50 border border-gold-300 rounded-lg">
                    <span className="text-xs font-display uppercase text-ink-500">Rage Damage Bonus: </span>
                    <span className="font-display font-bold text-gold-700">+{getRageDamage(characterLevel)}</span>
                  </div>
                )}
                {feature.name === 'Divine Smite' && spellSlots && onExpendSlot && (
                  <div className="mt-2 p-2 bg-gold-100/50 border border-gold-300 rounded-lg space-y-2">
                    <span className="text-xs font-display uppercase text-ink-500">Smite — Expend a Spell Slot</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {spellSlots
                        .filter(s => !s.expended)
                        .sort((a, b) => a.slot_level - b.slot_level)
                        .reduce<SpellSlot[]>((acc, s) => {
                          if (!acc.some(a => a.slot_level === s.slot_level)) acc.push(s)
                          return acc
                        }, [])
                        .map(s => (
                          <button
                            key={s.id}
                            onClick={() => onExpendSlot(s.id)}
                            className="px-3 py-1.5 rounded bg-gold-400 text-ink-900 text-xs font-display uppercase hover:bg-gold-300 cursor-pointer transition-colors"
                          >
                            Lvl {s.slot_level} — {smiteDamage(s.slot_level)}
                          </button>
                        ))
                      }
                      {spellSlots.filter(s => !s.expended).length === 0 && (
                        <span className="text-xs text-ink-400">No spell slots remaining</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {feature.usesMax !== undefined && feature.usesRemaining !== undefined && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => useFeature(i)}
                        disabled={feature.usesRemaining <= 0}
                      >
                        Use
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => restoreFeature(i)}>
                        <RotateCcw size={12} className="mr-1" /> Restore
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeFeature(i)} className="ml-auto text-danger">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {features.length === 0 && (
          <p className="text-sm text-ink-300 text-center py-4">No features or traits added yet.</p>
        )}
      </div>

      {/* Add Feature Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Feature" size="sm">
        <div className="space-y-4">
          <Input
            label="Name"
            value={newFeature.name}
            onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
            placeholder="e.g. Second Wind"
          />
          <Textarea
            label="Description"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            placeholder="Describe the feature..."
          />
          <Input
            label="Source"
            value={newFeature.source}
            onChange={(e) => setNewFeature({ ...newFeature, source: e.target.value })}
            placeholder="e.g. Fighter, Racial, Feat"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Uses (optional)"
              type="number"
              min={0}
              value={newFeature.usesMax ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : undefined
                setNewFeature({ ...newFeature, usesMax: val, usesRemaining: val })
              }}
            />
            <Select
              label="Recharge"
              value={newFeature.rechargeOn ?? ''}
              onChange={(e) =>
                setNewFeature({
                  ...newFeature,
                  rechargeOn: (e.target.value || undefined) as Feature['rechargeOn'],
                })
              }
              options={[
                { value: '', label: 'None' },
                { value: 'short_rest', label: 'Short Rest' },
                { value: 'long_rest', label: 'Long Rest' },
              ]}
            />
          </div>
          <Button onClick={addFeature} className="w-full">Add Feature</Button>
        </div>
      </Modal>
    </div>
  )
}
