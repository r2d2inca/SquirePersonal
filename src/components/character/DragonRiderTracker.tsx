import { Zap, Swords, Eye, Wind } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { proficiencyBonus } from '@/lib/calculations'
import { hasClassLevels, getClassLevel as getMulticlassLevel } from '@/lib/multiclass'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface DragonRiderTrackerProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}

// Wing Step uses by Dragon-Rider level (index 0 = level 1)
const WING_STEP_BY_LEVEL = [0, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5]
// Sync uses by Dragon-Rider level (0 = not available, -1 = unlimited)
const SYNC_BY_LEVEL = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, -1]

interface ResourceConfig {
  name: string
  featureKey: string
  icon: typeof Zap
  iconColor: string
  filledColor: string
  getMax: (level: number) => number
  minLevel: number
}

const RESOURCES: ResourceConfig[] = [
  {
    name: 'Wing Step',
    featureKey: 'Wing Step Uses',
    icon: Wind,
    iconColor: 'text-arcane-400',
    filledColor: 'bg-arcane-400 border-arcane-500 hover:bg-arcane-300',
    getMax: (level) => WING_STEP_BY_LEVEL[level - 1] ?? 0,
    minLevel: 2,
  },
  {
    name: "Hunter's Insight",
    featureKey: "Hunter's Insight Uses",
    icon: Eye,
    iconColor: 'text-gold-500',
    filledColor: 'bg-gold-400 border-gold-500 hover:bg-gold-300',
    getMax: (level) => proficiencyBonus(level),
    minLevel: 2,
  },
  {
    name: 'Dragonstrike',
    featureKey: 'Dragonstrike Uses',
    icon: Swords,
    iconColor: 'text-danger',
    filledColor: 'bg-danger border-danger hover:bg-danger/80',
    getMax: (level) => proficiencyBonus(level),
    minLevel: 5,
  },
  {
    name: 'Draconic Sync',
    featureKey: 'Draconic Sync Uses',
    icon: Zap,
    iconColor: 'text-heal',
    filledColor: 'bg-heal border-heal hover:bg-heal/80',
    getMax: (level) => {
      const val = SYNC_BY_LEVEL[level - 1] ?? 0
      return val === -1 ? 99 : val // 99 represents unlimited
    },
    minLevel: 7,
  },
]

function ResourceTracker({
  config,
  character,
  onUpdate,
}: {
  config: ResourceConfig
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}) {
  const max = config.getMax(character.level)
  if (max <= 0 || character.level < config.minLevel) return null

  const isUnlimited = max === 99
  const displayMax = isUnlimited ? '\u221E' : max

  // Find or create tracking in features
  const feature = character.features.find(f => f.name === config.featureKey)
  const remaining = feature?.usesRemaining ?? max

  function update(newRemaining: number) {
    const exists = character.features.some(f => f.name === config.featureKey)
    const updatedFeatures = exists
      ? character.features.map(f =>
          f.name === config.featureKey ? { ...f, usesMax: isUnlimited ? 99 : max, usesRemaining: newRemaining } : f
        )
      : [
          ...character.features,
          { name: config.featureKey, description: '', source: 'Dragon-Rider', usesMax: isUnlimited ? 99 : max, usesRemaining: newRemaining, rechargeOn: 'long_rest' as const },
        ]
    onUpdate({ features: updatedFeatures })
  }

  function spend() {
    if (isUnlimited) return // unlimited uses, no need to track
    if (remaining > 0) update(remaining - 1)
  }

  function restoreOne() {
    if (isUnlimited) return
    if (remaining < max) update(remaining + 1)
  }

  function restoreAll() {
    if (isUnlimited) return
    update(max)
  }

  const Icon = config.icon

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={14} className={config.iconColor} />
          <span className="font-display text-xs uppercase text-ink-500">{config.name}</span>
        </div>
        <span className="font-mono text-xs text-ink-700">
          {isUnlimited ? '\u221E' : remaining}/{displayMax}
        </span>
      </div>

      {!isUnlimited && (
        <>
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {Array.from({ length: max }, (_, i) => {
              const isFilled = i < remaining
              return (
                <button
                  key={i}
                  onClick={() => isFilled ? spend() : restoreOne()}
                  className={`w-5 h-5 rounded-full border-2 transition-colors cursor-pointer ${
                    isFilled
                      ? config.filledColor
                      : 'bg-transparent border-parchment-400 hover:border-gold-400'
                  }`}
                  title={isFilled ? `Spend ${config.name}` : `Restore ${config.name}`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={spend}
              disabled={remaining <= 0}
              className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-parchment-200 text-ink-700 hover:bg-parchment-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              Spend
            </button>
            <button
              onClick={restoreAll}
              disabled={remaining >= max}
              className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-gold-200 text-gold-700 hover:bg-gold-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              Restore All
            </button>
          </div>
        </>
      )}

      {isUnlimited && (
        <div className="text-xs text-ink-400 italic">Unlimited uses</div>
      )}
    </div>
  )
}

export function DragonRiderTracker({ character, onUpdate }: DragonRiderTrackerProps) {
  if (!hasClassLevels(character, 'Dragon-Rider')) return null

  const activeResources = RESOURCES.filter(r => character.level >= r.minLevel && r.getMax(character.level) > 0)
  if (activeResources.length === 0) return null

  return (
    <Card>
      <div className="font-display text-xs uppercase tracking-wider text-ink-500 mb-3">Dragon-Rider Resources</div>
      <div className="space-y-4">
        {activeResources.map(config => (
          <ResourceTracker key={config.featureKey} config={config} character={character} onUpdate={onUpdate} />
        ))}
      </div>
    </Card>
  )
}
