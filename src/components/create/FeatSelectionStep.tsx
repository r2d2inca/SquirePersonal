import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { ABILITY_SCORES, ABILITY_LABELS, type AbilityScore } from '@/lib/constants'
import { getFeatsAvailableAtLevel, meetsPrerequisites, type FeatData, type PrerequisiteContext } from '@/lib/featData'
import { FeatExtrasUI } from './FeatExtrasUI'

// What the user chose for a given ASI level
export interface FeatLevelChoice {
  type: 'asi' | 'feat'
  // ASI fields (when type === 'asi')
  asiMode?: 'single' | 'dual'
  asiFirst?: AbilityScore
  asiSecond?: AbilityScore
  // Feat fields (when type === 'feat')
  featName?: string
  // +1 ability from feat's abilityScoreIncrease (if applicable)
  featAbility?: AbilityScore
  // Extra choices for feats that need them
  featExtras?: {
    skill?: string        // Keen Mind, Observant
    skills?: string[]     // Skilled (3 skills/tools)
    expertise?: string    // Skill Expert, Boon of Skill
    savingThrow?: string  // Resilient
    damageType?: string   // Elemental Adept
    damageTypes?: string[] // Boon of Energy Resistance (2 types)
    spellPick?: string    // Fey Touched, Shadow Touched (spell index)
    spellPicks?: string[] // Ritual Caster (spell indices)
    tools?: string[]      // Crafter
    instruments?: string[] // Musician
    // Magic Initiate
    miCantrips?: string[]  // 2 cantrip indices
    miSpell?: string       // 1 level 1 spell index
    miAbility?: string     // spellcasting ability (intelligence/wisdom/charisma)
  }
}

interface FeatSelectionStepProps {
  asiLevels: number[]
  selections: Record<number, FeatLevelChoice>
  onSelectionsChange: (selections: Record<number, FeatLevelChoice>) => void
  selectedClass: string
  hasFightingStyle?: boolean
  prerequisiteContext?: PrerequisiteContext
}

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'General',
  'origin': 'Origin',
  'fighting-style': 'Fighting Style',
  'epic-boon': 'Epic Boon',
}

export function FeatSelectionStep({
  asiLevels,
  selections,
  onSelectionsChange,
  selectedClass,
  hasFightingStyle = false,
  prerequisiteContext,
}: FeatSelectionStepProps) {
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({})
  const [expandedFeat, setExpandedFeat] = useState<Record<number, string | null>>({})

  function update(level: number, choice: FeatLevelChoice) {
    onSelectionsChange({ ...selections, [level]: choice })
  }

  function getChoice(level: number): FeatLevelChoice {
    return selections[level] ?? {
      type: 'asi',
      asiMode: 'single',
      asiFirst: 'strength' as AbilityScore,
      asiSecond: 'dexterity' as AbilityScore,
    }
  }

  return (
    <div className="space-y-4">
      {asiLevels.map(level => {
        const choice = getChoice(level)
        const feats = getFeatsAvailableAtLevel(level, hasFightingStyle)
          .filter(f => f.name !== 'Ability Score Improvement')
          .filter(f => !prerequisiteContext || meetsPrerequisites(f, prerequisiteContext))
        const search = (searchTerms[level] ?? '').toLowerCase()
        const filteredFeats = search
          ? feats.filter(f => f.name.toLowerCase().includes(search) || f.category.includes(search))
          : feats

        return (
          <Card key={level}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="gold">Lvl {level}</Badge>
              <span className="font-display text-sm text-ink-900">Feat Selection</span>
            </div>

            {/* Toggle: ASI or Feat */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => update(level, {
                  type: 'asi',
                  asiMode: choice.asiMode ?? 'single',
                  asiFirst: choice.asiFirst ?? 'strength' as AbilityScore,
                  asiSecond: choice.asiSecond ?? 'dexterity' as AbilityScore,
                })}
                className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                  choice.type === 'asi' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                }`}
              >
                <div className="font-display text-xs uppercase">Ability Score Improvement</div>
              </button>
              <button
                onClick={() => update(level, {
                  type: 'feat',
                  featName: choice.featName,
                  featAbility: choice.featAbility,
                })}
                className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                  choice.type === 'feat' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                }`}
              >
                <div className="font-display text-xs uppercase">Choose a Feat</div>
              </button>
            </div>

            {/* ASI Mode */}
            {choice.type === 'asi' && (
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => update(level, { ...choice, asiMode: 'single' })}
                    className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                      choice.asiMode === 'single' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                    }`}
                  >
                    <div className="font-display text-xs uppercase">+2 to one ability</div>
                  </button>
                  <button
                    onClick={() => update(level, { ...choice, asiMode: 'dual' })}
                    className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                      choice.asiMode === 'dual' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                    }`}
                  >
                    <div className="font-display text-xs uppercase">+1 to two abilities</div>
                  </button>
                </div>

                {choice.asiMode === 'single' ? (
                  <div>
                    <label className="block text-xs font-display uppercase text-ink-500 mb-1">+2 Bonus</label>
                    <select
                      value={choice.asiFirst ?? 'strength'}
                      onChange={e => update(level, { ...choice, asiFirst: e.target.value as AbilityScore })}
                      className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                    >
                      {ABILITY_SCORES.map(ab => (
                        <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-display uppercase text-ink-500 mb-1">First +1</label>
                      <select
                        value={choice.asiFirst ?? 'strength'}
                        onChange={e => {
                          const val = e.target.value as AbilityScore
                          if (val === choice.asiSecond) {
                            update(level, { ...choice, asiFirst: val, asiSecond: choice.asiFirst })
                          } else {
                            update(level, { ...choice, asiFirst: val })
                          }
                        }}
                        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                      >
                        {ABILITY_SCORES.map(ab => (
                          <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-display uppercase text-ink-500 mb-1">Second +1</label>
                      <select
                        value={choice.asiSecond ?? 'dexterity'}
                        onChange={e => {
                          const val = e.target.value as AbilityScore
                          if (val === choice.asiFirst) {
                            update(level, { ...choice, asiSecond: val, asiFirst: choice.asiSecond })
                          } else {
                            update(level, { ...choice, asiSecond: val })
                          }
                        }}
                        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                      >
                        {ABILITY_SCORES.map(ab => (
                          <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feat Selection Mode */}
            {choice.type === 'feat' && (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search feats..."
                    value={searchTerms[level] ?? ''}
                    onChange={e => setSearchTerms({ ...searchTerms, [level]: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Feat list */}
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredFeats.map(feat => {
                    const isSelected = choice.featName === feat.name
                    const isExpanded = expandedFeat[level] === feat.name

                    return (
                      <div key={feat.name}>
                        <button
                          onClick={() => {
                            update(level, { ...choice, featName: feat.name, featAbility: undefined })
                            setExpandedFeat({ ...expandedFeat, [level]: isExpanded ? null : feat.name })
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-gold-100 border-2 border-gold-400'
                              : 'bg-parchment-50 border border-parchment-300 hover:border-gold-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm text-ink-900">{feat.name}</span>
                              <Badge variant="default">{CATEGORY_LABELS[feat.category] ?? feat.category}</Badge>
                            </div>
                            {isSelected && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                          {feat.prerequisite && (
                            <div className="text-xs text-ink-400 mt-0.5">Prerequisite: {feat.prerequisite}</div>
                          )}
                        </button>

                        {/* Expanded details */}
                        {isSelected && isExpanded && (
                          <div className="ml-3 mt-2 mb-2 pl-3 border-l-2 border-gold-300">
                            <p className="text-sm text-ink-700 whitespace-pre-line">{feat.description}</p>
                            {renderFeatAbilityChoice(feat, choice, level, update)}
                            {renderFeatExtraChoices(feat, choice, level, update)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Show selected feat's ability choice even when collapsed */}
                {choice.featName && !expandedFeat[level] && (() => {
                  const feat = feats.find(f => f.name === choice.featName)
                  if (!feat?.abilityScoreIncrease) return null
                  return renderFeatAbilityChoice(feat, choice, level, update)
                })()}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/** Parse which abilities a feat allows for its +1 increase */
function parseFeatAbilityOptions(feat: FeatData): AbilityScore[] {
  const text = feat.abilityScoreIncrease?.toLowerCase() ?? ''
  if (text.includes('one ability score')) return [...ABILITY_SCORES]
  const options: AbilityScore[] = []
  if (text.includes('strength')) options.push('strength')
  if (text.includes('dexterity')) options.push('dexterity')
  if (text.includes('constitution')) options.push('constitution')
  if (text.includes('intelligence')) options.push('intelligence')
  if (text.includes('wisdom')) options.push('wisdom')
  if (text.includes('charisma')) options.push('charisma')
  return options.length > 0 ? options : [...ABILITY_SCORES]
}

// ─── Extra feat choices ───

// Delegates to the shared FeatExtrasUI component
function renderFeatExtraChoices(
  feat: FeatData,
  choice: FeatLevelChoice,
  level: number,
  update: (level: number, choice: FeatLevelChoice) => void,
) {
  const extras = choice.featExtras ?? {}
  return (
    <FeatExtrasUI
      featName={feat.name}
      extras={extras}
      onExtrasChange={newExtras => update(level, { ...choice, featExtras: newExtras })}
    />
  )
}

function renderFeatAbilityChoice(
  feat: FeatData,
  choice: FeatLevelChoice,
  level: number,
  update: (level: number, choice: FeatLevelChoice) => void,
) {
  if (!feat.abilityScoreIncrease) return null
  const options = parseFeatAbilityOptions(feat)

  return (
    <div className="mt-2">
      <label className="block text-xs font-display uppercase text-ink-500 mb-1">
        +1 Ability Score ({feat.abilityScoreIncrease})
      </label>
      <select
        value={choice.featAbility ?? options[0] ?? 'strength'}
        onChange={e => update(level, { ...choice, featAbility: e.target.value as AbilityScore })}
        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
      >
        {options.map(ab => (
          <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
        ))}
      </select>
    </div>
  )
}
