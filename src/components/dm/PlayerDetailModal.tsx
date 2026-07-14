import {
  Heart, Shield, Zap, Gauge, Swords, Sparkles, Backpack,
  BookOpen, FlaskConical, Eye, Loader2,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useSpells } from '@/hooks/useSpells'
import { useSpellSlots } from '@/hooks/useSpellSlots'
import { useInventory } from '@/hooks/useInventory'
import { useActiveEffects } from '@/hooks/useActiveEffects'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/calculations'
import { ABILITY_ABBREVIATIONS } from '@/lib/constants'
import type { Character } from '@/lib/types/database'

interface PlayerDetailModalProps {
  open: boolean
  onClose: () => void
  character: Character
}

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const

export function PlayerDetailModal({ open, onClose, character }: PlayerDetailModalProps) {
  const { spells, isLoading: spellsLoading } = useSpells(character.id)
  const { spellSlots, isLoading: slotsLoading } = useSpellSlots(character.id)
  const { items, isLoading: itemsLoading } = useInventory(character.id)
  const { effects, isLoading: effectsLoading } = useActiveEffects(character.id)

  const isLoading = spellsLoading || slotsLoading || itemsLoading || effectsLoading
  const pb = proficiencyBonus(character.level)
  const hpPercent = Math.round((character.current_hp / character.max_hp) * 100)
  const hpColor = hpPercent <= 25 ? 'bg-danger' : hpPercent <= 50 ? 'bg-gold-400' : 'bg-health'

  const equippedItems = items.filter((i) => i.is_equipped)
  const preparedSpells = spells.filter((s) => s.is_prepared || s.level === 0)
  const knownSpells = spells.filter((s) => !s.is_prepared && s.level > 0)

  return (
    <Modal open={open} onClose={onClose} title={character.name} size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gold-400" />
          <span className="ml-2 text-ink-500">Loading character data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500">
                Level {character.level} {character.race} {character.class}
                {character.subclass && ` (${character.subclass})`}
              </p>
              {character.background && (
                <p className="text-xs text-ink-400">{character.background} background</p>
              )}
            </div>
            <Badge variant="gold">PB +{pb}</Badge>
          </div>

          {/* Combat Stats */}
          <div>
            <SectionHeader>Combat</SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="!p-3 text-center">
                <Heart size={16} className="text-health mx-auto mb-1" />
                <div className="text-xs font-display uppercase text-ink-500">HP</div>
                <div className="font-mono text-lg">
                  <span className={hpPercent <= 25 ? 'text-danger' : 'text-ink-900'}>
                    {character.current_hp}
                  </span>
                  <span className="text-ink-300 text-xs"> / {character.max_hp}</span>
                </div>
                {character.temp_hp > 0 && (
                  <div className="font-mono text-xs text-temphp font-semibold">+{character.temp_hp} temp</div>
                )}
                <div className="h-1.5 bg-parchment-300 rounded-full overflow-hidden mt-1">
                  <div className={`h-full ${hpColor} rounded-full`} style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }} />
                </div>
              </Card>
              <Card className="!p-3 text-center">
                <Shield size={16} className="text-ink-500 mx-auto mb-1" />
                <div className="text-xs font-display uppercase text-ink-500">AC</div>
                <div className="font-mono text-lg text-ink-900">{character.armor_class}</div>
              </Card>
              <Card className="!p-3 text-center">
                <Zap size={16} className="text-gold-500 mx-auto mb-1" />
                <div className="text-xs font-display uppercase text-ink-500">Initiative</div>
                <div className="font-mono text-lg text-ink-900">
                  {formatModifier(character.initiative_bonus ?? abilityModifier(character.dexterity))}
                </div>
              </Card>
              <Card className="!p-3 text-center">
                <Gauge size={16} className="text-ink-500 mx-auto mb-1" />
                <div className="text-xs font-display uppercase text-ink-500">Speed</div>
                <div className="font-mono text-lg text-ink-900">{character.speed}<span className="text-xs text-ink-300"> ft</span></div>
              </Card>
            </div>
            <div className="mt-2 text-xs text-ink-500">
              Hit Dice: <span className="font-mono text-ink-700">{character.hit_dice_remaining}/{character.hit_dice_total}</span>
              {character.spell_save_dc && (
                <span className="ml-4">Spell Save DC: <span className="font-mono text-ink-700">{character.spell_save_dc}</span></span>
              )}
              {character.spell_attack_bonus != null && (
                <span className="ml-4">Spell Attack: <span className="font-mono text-ink-700">{formatModifier(character.spell_attack_bonus)}</span></span>
              )}
            </div>
          </div>

          {/* Ability Scores */}
          <div>
            <SectionHeader>Ability Scores</SectionHeader>
            <div className="grid grid-cols-6 gap-2">
              {ABILITIES.map((ability) => {
                const score = character[ability]
                const mod = abilityModifier(score)
                return (
                  <Card key={ability} className="!p-2 text-center">
                    <div className="text-[10px] font-display uppercase text-ink-400">{ABILITY_ABBREVIATIONS[ability]}</div>
                    <div className="font-mono text-lg text-ink-900">{formatModifier(mod)}</div>
                    <div className="text-xs text-ink-400">{score}</div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Active Effects */}
          {effects.length > 0 && (
            <div>
              <SectionHeader>Active Effects</SectionHeader>
              <div className="flex flex-wrap gap-2">
                {effects.map((effect) => (
                  <div key={effect.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-arcane-100 border border-arcane-300 rounded-full">
                    <Eye size={12} className="text-arcane-500" />
                    <span className="text-xs font-display text-arcane-700">{effect.name}</span>
                    {effect.is_concentration && <span className="text-[10px] text-arcane-400">(C)</span>}
                    {effect.duration && <span className="text-[10px] text-ink-400">· {effect.duration}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipped Items */}
          <div>
            <SectionHeader>
              <span className="flex items-center gap-2">
                <Backpack size={14} /> Equipped Items
                {equippedItems.length > 0 && <span className="text-ink-400 font-mono text-xs">({equippedItems.length})</span>}
              </span>
            </SectionHeader>
            {equippedItems.length === 0 ? (
              <p className="text-sm text-ink-400 italic">No items equipped.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {equippedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-parchment-50 border border-parchment-300 rounded">
                    <Swords size={14} className="text-ink-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-ink-400">
                        {item.category}
                        {item.damage && ` · ${item.damage}`}
                        {item.armor_bonus != null && ` · AC ${item.armor_bonus}`}
                        {item.is_attuned && ' · Attuned'}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-ink-400">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spell Slots */}
          {spellSlots.length > 0 && (
            <div>
              <SectionHeader>
                <span className="flex items-center gap-2">
                  <FlaskConical size={14} /> Spell Slots
                </span>
              </SectionHeader>
              <div className="flex flex-wrap gap-3">
                {spellSlots.map((slot) => {
                  const remaining = slot.total - slot.expended
                  return (
                    <div key={slot.id} className="text-center">
                      <div className="text-[10px] font-display uppercase text-ink-400">Lvl {slot.slot_level}</div>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: slot.total }, (_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full border ${
                              i < remaining
                                ? 'bg-arcane-400 border-arcane-500'
                                : 'bg-parchment-200 border-parchment-400'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-ink-400 mt-0.5">{remaining}/{slot.total}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prepared Spells */}
          {preparedSpells.length > 0 && (
            <div>
              <SectionHeader>
                <span className="flex items-center gap-2">
                  <BookOpen size={14} /> Prepared Spells
                  <span className="text-ink-400 font-mono text-xs">({preparedSpells.length})</span>
                </span>
              </SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {preparedSpells.map((spell) => (
                  <div key={spell.id} className="flex items-center justify-between px-3 py-1.5 bg-parchment-50 border border-parchment-300 rounded text-sm">
                    <span className="text-ink-900">{spell.name}</span>
                    <div className="flex items-center gap-2">
                      {spell.is_concentration && <span className="text-[10px] text-arcane-400">C</span>}
                      {spell.is_ritual && <span className="text-[10px] text-gold-500">R</span>}
                      <Badge variant={spell.level === 0 ? 'default' : 'arcane'}>
                        {spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Known (Unprepared) Spells */}
          {knownSpells.length > 0 && (
            <div>
              <SectionHeader>
                <span className="flex items-center gap-2">
                  <Sparkles size={14} /> Known Spells (Not Prepared)
                  <span className="text-ink-400 font-mono text-xs">({knownSpells.length})</span>
                </span>
              </SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {knownSpells.map((spell) => (
                  <span key={spell.id} className="px-2 py-1 bg-parchment-200 text-ink-500 rounded text-xs">
                    {spell.name} <span className="text-ink-300">Lvl {spell.level}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {character.features.length > 0 && (
            <div>
              <SectionHeader>Features & Traits</SectionHeader>
              <div className="space-y-1.5">
                {character.features.map((feat, i) => (
                  <div key={i} className="px-3 py-2 bg-parchment-50 border border-parchment-300 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display text-ink-900">{feat.name}</span>
                      {feat.source && <span className="text-[10px] text-ink-400">{feat.source}</span>}
                      {feat.usesMax != null && (
                        <span className="text-[10px] font-mono text-ink-400">
                          {feat.usesRemaining ?? feat.usesMax}/{feat.usesMax}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proficiencies */}
          <div>
            <SectionHeader>Proficiencies</SectionHeader>
            <div className="space-y-2 text-sm">
              {character.proficiencies.savingThrows.length > 0 && (
                <div>
                  <span className="text-xs font-display uppercase text-ink-400">Saving Throws: </span>
                  <span className="text-ink-700">{character.proficiencies.savingThrows.join(', ')}</span>
                </div>
              )}
              {character.proficiencies.skills.length > 0 && (
                <div>
                  <span className="text-xs font-display uppercase text-ink-400">Skills: </span>
                  <span className="text-ink-700">{character.proficiencies.skills.join(', ')}</span>
                </div>
              )}
              {character.proficiencies.languages.length > 0 && (
                <div>
                  <span className="text-xs font-display uppercase text-ink-400">Languages: </span>
                  <span className="text-ink-700">{character.proficiencies.languages.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
