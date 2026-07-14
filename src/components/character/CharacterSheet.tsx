import { useState } from 'react'
import { Moon, Coffee, ArrowUp, Trash2, Swords, Sparkles, User, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { playSound } from '@/lib/sound'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ExportPDFButton } from './ExportPDFButton'
import { downloadCharacterJSON } from '@/lib/characterExport'
import { CharacterHeader } from './CharacterHeader'
import { AbilityScores } from './AbilityScores'
import { SavingThrows } from './SavingThrows'
import { SkillsList } from './SkillsList'
import { CombatStats } from './CombatStats'
import { KiTracker } from './KiTracker'
import { DragonRiderTracker } from './DragonRiderTracker'
import { DragonCompanionPanel } from './DragonCompanionPanel'
import { DragonRiderCustomFeatures } from './DragonRiderCustomFeatures'
import { BarriomancerTracker } from './BarriomancerTracker'
import { BarriomancerBarriersPanel } from './BarriomancerBarriersPanel'
import { HpTracker } from './HpTracker'
import { ConditionsBanner } from './ConditionsBanner'
import { ConcentrationPrompt } from './ConcentrationPrompt'
import { DeathSaves } from './DeathSaves'
import { ClassChoices } from './ClassChoices'
import { FeaturesTraits } from './FeaturesTraits'
import { ProficiencyDisplay } from './ProficiencyDisplay'
import { PersonalitySection } from './PersonalitySection'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card } from '@/components/ui/Card'
import { getSubclassLevel } from '@/lib/classChoices'
import { levelFromXP } from '@/lib/levelProgression'
import type { Character, CharacterUpdate, Feature, Spell, SpellSlot, InventoryItem, ActiveEffect, ActiveEffectInsert } from '@/lib/types/database'

type SheetTab = 'stats' | 'features' | 'personality'

interface CharacterSheetProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
  onLevelUp?: () => void
  onSubclassChange?: (classIndex: string, subclassIndex: string) => void
  onSubclassRemove?: () => void
  onShortRest?: () => void
  onLongRest?: () => void
  onDeleteCharacter?: () => void
  onExpendSlot?: (slotId: string) => void
  spells?: Spell[]
  spellSlots?: SpellSlot[]
  items?: InventoryItem[]
  effects?: ActiveEffect[]
  onAddEffect?: (effect: ActiveEffectInsert) => void
  onRemoveEffect?: (id: string) => void
}

const TABS: { id: SheetTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'stats', label: 'Stats & Skills', shortLabel: 'Stats', icon: <Swords size={14} /> },
  { id: 'features', label: 'Features & Feats', shortLabel: 'Features', icon: <Sparkles size={14} /> },
  { id: 'personality', label: 'Personality', shortLabel: 'Personal', icon: <User size={14} /> },
]

export function CharacterSheet({ character, onUpdate, onLevelUp, onSubclassChange, onSubclassRemove, onShortRest, onLongRest, onDeleteCharacter, onExpendSlot, spells = [], spellSlots = [], items = [], effects = [], onAddEffect, onRemoveEffect }: CharacterSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<SheetTab>('stats')
  const [concDamage, setConcDamage] = useState<number | null>(null)

  const concentrationEffect = effects.find((e) => e.is_concentration)

  return (
    <div>
      {/* Header — always visible */}
      <div className="flex items-center justify-between mb-2">
        <CharacterHeader character={character} onUpdate={onUpdate} />
        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          {onLevelUp && character.level < 20 && (
            <Button size="sm" onClick={onLevelUp}>
              <ArrowUp size={14} /> <span className="hidden md:inline ml-1">Level Up</span>
              {levelFromXP(character.experience_points) > character.level && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-heal animate-pulse" title="You have enough XP to level up" />
              )}
            </Button>
          )}
          {onShortRest && (
            <Button variant="secondary" size="sm" onClick={onShortRest}>
              <Coffee size={14} /> <span className="hidden md:inline ml-1">Short Rest</span>
            </Button>
          )}
          {onLongRest && (
            <Button variant="secondary" size="sm" onClick={onLongRest}>
              <Moon size={14} /> <span className="hidden md:inline ml-1">Long Rest</span>
            </Button>
          )}
          <ExportPDFButton character={character} spells={spells} spellSlots={spellSlots} items={items} />
          <Button variant="secondary" size="sm" onClick={() => downloadCharacterJSON(character, spells, spellSlots, items, effects)}>
            <Download size={14} /> <span className="hidden md:inline ml-1">Export JSON</span>
          </Button>
          {onDeleteCharacter && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} /> <span className="hidden md:inline ml-1">Delete</span>
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); onDeleteCharacter?.() }}
        title="Delete Character"
        message={`Are you sure you want to delete ${character.name}? This will remove your character and allow you to create a new one.`}
      />

      {/* Persistent combat section — always visible */}
      <div className="space-y-4 mb-4">
        <CombatStats character={character} onUpdate={onUpdate} />

        {onAddEffect && onRemoveEffect && (
          <ConditionsBanner
            characterId={character.id}
            effects={effects}
            onAddEffect={onAddEffect}
            onRemoveEffect={onRemoveEffect}
          />
        )}

        <Card hover={false}>
          <HpTracker
            currentHp={character.current_hp}
            maxHp={character.max_hp}
            tempHp={character.temp_hp}
            onUpdate={(updates) => onUpdate(updates)}
            onDamageTaken={(amount) => { if (concentrationEffect && amount > 0) setConcDamage(amount) }}
          />
        </Card>

        {concentrationEffect && concDamage != null && (
          <ConcentrationPrompt
            open
            damage={concDamage}
            spellName={concentrationEffect.name}
            onSaved={() => setConcDamage(null)}
            onBroken={() => { onRemoveEffect?.(concentrationEffect.id); setConcDamage(null) }}
            onClose={() => setConcDamage(null)}
          />
        )}

        {character.current_hp === 0 && (
          <DeathSaves
            successes={character.death_save_successes}
            failures={character.death_save_failures}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {/* Focus Points Tracker (Monks) */}
        <KiTracker character={character} onUpdate={onUpdate} />

        {/* Dragon-Rider Resource Tracker */}
        <DragonRiderTracker character={character} onUpdate={onUpdate} />

        {/* Barriomancer Barrier Dice + Barriers */}
        <BarriomancerTracker character={character} onUpdate={onUpdate} />
        <BarriomancerBarriersPanel character={character} />

        {/* Dragon Companion Panel */}
        <DragonCompanionPanel character={character} onUpdate={onUpdate} />

        {/* Currency */}
        <Card>
          <div className="font-display text-xs uppercase tracking-wider text-ink-500 mb-2">Currency</div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
            <span className="text-amber-700">{character.copper} CP</span>
            <span className="text-gray-400">{character.silver} SP</span>
            <span className="text-blue-300">{character.electrum} EP</span>
            <span className="text-gold-500">{character.gold} GP</span>
            <span className="text-gray-300">{character.platinum} PP</span>
          </div>
        </Card>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-4 border-b border-parchment-300">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playSound('click')
              setActiveTab(tab.id)
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display uppercase transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-gold-400 text-gold-600'
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab.icon}
            <span className="md:hidden">{tab.shortLabel}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <AbilityScores character={character} />
            </Card>
            <Card>
              <SavingThrows character={character} />
            </Card>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <SkillsList character={character} />
            </Card>
            <Card>
              <ProficiencyDisplay proficiencies={character.proficiencies} />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          {character.level >= getSubclassLevel(character.class.toLowerCase()) && (
            <Card>
              <ClassChoices character={character} onUpdate={(updates) => onUpdate(updates)} onSubclassChange={onSubclassChange} onSubclassRemove={onSubclassRemove} />
            </Card>
          )}

          <Card>
            <FeaturesTraits
              features={character.features.filter(f => f.source !== 'Feat')}
              onUpdate={(features: Feature[]) => {
                const feats = character.features.filter(f => f.source === 'Feat')
                onUpdate({ features: [...features, ...feats] })
              }}
              characterClass={character.class}
              characterLevel={character.level}
              spellSlots={spellSlots}
              onExpendSlot={onExpendSlot}
            />
          </Card>

          {/* Dragon-Rider: Signature Weapon + Patron's Gifts */}
          <DragonRiderCustomFeatures character={character} onUpdate={onUpdate} />

          {character.features.some(f => f.source === 'Feat') && (
            <Card>
              <SectionHeader>Feats</SectionHeader>
              <div className="space-y-2">
                {character.features.filter(f => f.source === 'Feat').map((feat, i) => (
                  <div key={i} className="border border-parchment-300 rounded-lg p-3">
                    <div className="font-body font-semibold text-ink-900">{feat.name}</div>
                    <p className="text-sm text-ink-700 whitespace-pre-wrap mt-1">{feat.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'personality' && (
        <div className="space-y-6">
          <Card>
            <PersonalitySection character={character} onUpdate={onUpdate} />
          </Card>
        </div>
      )}
    </div>
  )
}
