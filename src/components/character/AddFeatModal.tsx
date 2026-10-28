import { useState } from 'react'
import { Search, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { FeatExtrasUI } from '@/components/create/FeatExtrasUI'
import { ABILITY_SCORES, ABILITY_ABBREVIATIONS } from '@/lib/constants'
import { proficiencyBonus } from '@/lib/calculations'
import { ALL_FEATS, getFeatsAvailableAtLevel, meetsPrerequisites, type FeatData, type FeatCategory } from '@/lib/featData'
import { applyFeat, resolveSpellRows, type SpellRow } from '@/lib/applyFeat'
import type { Character, CharacterUpdate } from '@/lib/types/database'

const CATEGORY_FILTERS: { key: FeatCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'origin', label: 'Origin' },
  { key: 'general', label: 'General' },
  { key: 'fighting-style', label: 'Fighting Style' },
  { key: 'epic-boon', label: 'Epic Boon' },
]

interface AddFeatModalProps {
  open: boolean
  onClose: () => void
  character: Character
  /** Receives the merged character update plus any spells the feat grants. */
  onAdd: (updates: CharacterUpdate, spells: SpellRow[]) => Promise<void> | void
}

/**
 * Post-creation feat picker. Mirrors the level-up wizard's feat step but is
 * reachable any time, because campaigns hand out feats outside of ASI levels.
 * Prerequisites and level gates are shown, not enforced: "Show everything"
 * lists the whole catalog for when the DM has said yes.
 */
export function AddFeatModal({ open, onClose, character, onAdd }: AddFeatModalProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FeatCategory | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<FeatData | null>(null)
  const [featAbility, setFeatAbility] = useState<string | null>(null)
  const [extras, setExtras] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  const prereqContext = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
    armorProficiencies: character.proficiencies?.armor ?? [],
    hasSpellcasting: !!character.spellcasting_ability,
    hasFightingStyle: character.features.some((f) => f.name.toLowerCase().includes('fighting style')),
  }
  const hasFightingStyle = prereqContext.hasFightingStyle
  const levelPool = new Set(getFeatsAvailableAtLevel(character.level, hasFightingStyle).map((f) => f.name))

  const pool = (showAll ? ALL_FEATS : ALL_FEATS.filter((f) => levelPool.has(f.name))).filter((f) => {
    if (f.name === 'Ability Score Improvement') return false
    if (!f.repeatable && character.features.some((cf) => cf.name === f.name)) return false
    if (!showAll && !meetsPrerequisites(f, prereqContext)) return false
    if (category !== 'all' && f.category !== category) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectedMeetsPrereq = selected ? meetsPrerequisites(selected, prereqContext) : true
  const selectedInLevelPool = selected ? levelPool.has(selected.name) : true
  const needsAbility = !!selected?.abilityScoreIncrease && selected.name !== 'Resilient'
  const canConfirm = !!selected && (!needsAbility || !!featAbility) && !saving

  function reset() {
    setSearch('')
    setCategory('all')
    setShowAll(false)
    setSelected(null)
    setFeatAbility(null)
    setExtras({})
    setSaving(false)
  }

  function pick(feat: FeatData) {
    setSelected((prev) => (prev?.name === feat.name ? null : feat))
    setFeatAbility(null)
    setExtras({})
  }

  async function handleConfirm() {
    if (!selected) return
    setSaving(true)
    try {
      const applied = applyFeat(character, selected, { featAbility, extras }, character.level)
      const updates: CharacterUpdate = {
        ...applied.updates,
        features: [...character.features, applied.feature],
      }
      const spells = await resolveSpellRows(applied.spellSlugs)
      await onAdd(updates, spells)
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add Feat" size="md">
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feats..."
            className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm text-ink-900 focus:outline-none focus:border-gold-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setCategory(f.key)}
              className={`px-2.5 py-1 rounded text-xs font-display uppercase cursor-pointer transition-colors ${
                category === f.key ? 'bg-gold-400 text-ink-900' : 'bg-parchment-200 text-ink-500'
              }`}
            >
              {f.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-gold-500" />
            Show everything
          </label>
        </div>
        <p className="text-[11px] text-ink-400">
          {showAll
            ? 'Every feat, including ones above your level or whose prerequisites you don’t meet. Use when your DM has granted it.'
            : 'Feats you qualify for at your level. Tick "Show everything" if the campaign handed you one outside the usual rules.'}
        </p>

        {selected && (
          <Card hover={false}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-arcane-500" />
              <h4 className="font-display text-base text-ink-900">{selected.name}</h4>
              <Badge variant="arcane">{selected.category}</Badge>
            </div>
            {selected.prerequisite && (
              <p className="text-xs text-ink-400 mb-2">Prerequisite: {selected.prerequisite}</p>
            )}
            {(!selectedMeetsPrereq || !selectedInLevelPool) && (
              <p className="flex items-start gap-1.5 text-xs text-warning mb-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {!selectedInLevelPool ? 'Normally not available at your level.' : 'You don’t meet the prerequisite.'} Adding it anyway is fine if your DM allowed it.
              </p>
            )}
            <p className="text-sm text-ink-700 whitespace-pre-wrap">{selected.description}</p>
            {needsAbility && (
              <div className="mt-3">
                <label className="block text-xs font-display uppercase text-ink-500 mb-1">+1 Ability Score</label>
                <select
                  value={featAbility ?? ''}
                  onChange={(e) => setFeatAbility(e.target.value || null)}
                  className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm text-ink-900 focus:outline-none focus:border-gold-400"
                >
                  <option value="">Choose ability...</option>
                  {ABILITY_SCORES.map((ab) => {
                    const cur = character[ab as keyof Character] as number
                    return (
                      <option key={ab} value={ab}>
                        {ABILITY_ABBREVIATIONS[ab]}: {cur} → {Math.min(selected.maxAbilityScore ?? 20, cur + 1)}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            <FeatExtrasUI
              featName={selected.name}
              extras={extras}
              onExtrasChange={setExtras}
              existingSkills={character.proficiencies.skills}
              proficiencyBonus={proficiencyBonus(character.level)}
            />
          </Card>
        )}

        <div className="max-h-[280px] overflow-y-auto border border-parchment-300 rounded-lg">
          {pool.length === 0 && (
            <p className="text-center text-sm text-ink-400 py-6">No feats match.</p>
          )}
          {pool.map((feat) => {
            const isSelected = selected?.name === feat.name
            const blocked = showAll && (!meetsPrerequisites(feat, prereqContext) || !levelPool.has(feat.name))
            return (
              <button
                key={feat.name}
                type="button"
                onClick={() => pick(feat)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer ${
                  isSelected ? 'bg-arcane-400/10' : 'hover:bg-gold-100/50'
                }`}
              >
                <div className="min-w-0">
                  <span className={`font-body text-sm ${blocked ? 'text-ink-500' : 'text-ink-900'}`}>{feat.name}</span>
                  {feat.prerequisite && <span className="text-xs text-ink-400 ml-2">({feat.prerequisite})</span>}
                </div>
                <Badge variant={feat.category === 'origin' ? 'gold' : feat.category === 'epic-boon' ? 'arcane' : 'default'}>
                  {feat.category === 'fighting-style' ? 'Fighting' : feat.category === 'epic-boon' ? 'Epic' : feat.category}
                </Badge>
              </button>
            )
          })}
        </div>

        <Button onClick={handleConfirm} disabled={!canConfirm} className="w-full">
          {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Adding...</> : selected ? `Add ${selected.name}` : 'Select a feat'}
        </Button>
      </div>
    </Modal>
  )
}
