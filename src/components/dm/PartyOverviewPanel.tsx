import { useState } from 'react'
import { Users, Heart, Shield, Zap, Sparkles, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/calculations'
import { levelFromXP } from '@/lib/levelProgression'
import { ABILITY_ABBREVIATIONS } from '@/lib/constants'
import { useXpAward } from '@/hooks/useXpAward'
import { PlayerDetailModal } from './PlayerDetailModal'
import { XpAwardModal } from './XpAwardModal'
import type { Character } from '@/lib/types/database'

interface PartyOverviewPanelProps {
  characters: Character[]
  isLoading: boolean
  hasCampaign: boolean
  campaignId?: string | null
}

export function PartyOverviewPanel({ characters, isLoading, hasCampaign, campaignId }: PartyOverviewPanelProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [showXpModal, setShowXpModal] = useState(false)
  const { awardXp, isAwarding } = useXpAward(campaignId)

  if (!hasCampaign) {
    return (
      <EmptyState
        icon={<Users size={48} />}
        title="No Campaign Selected"
        description="Select a campaign from the Campaigns tab to view your party."
      />
    )
  }

  if (isLoading) {
    return <div className="text-center py-12 text-ink-500">Loading party...</div>
  }

  if (characters.length === 0) {
    return (
      <EmptyState
        icon={<Users size={48} />}
        title="No Party Members"
        description="Share your campaign's invite code with players so they can join."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink-900">Party Overview</h2>
          <p className="text-sm text-ink-500 mt-1">Click a character for full details</p>
        </div>
        <Button size="sm" onClick={() => setShowXpModal(true)}>
          <Sparkles size={14} className="mr-1" /> Award XP
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {characters.map((char) => {
          const hpPercent = Math.round((char.current_hp / char.max_hp) * 100)
          const hpColor = hpPercent <= 25 ? 'bg-danger' : hpPercent <= 50 ? 'bg-gold-400' : 'bg-health'
          const pb = proficiencyBonus(char.level)
          const canLevelUp = levelFromXP(char.experience_points) > char.level

          return (
            <Card
              key={char.id}
              className="cursor-pointer hover:border-gold-400 transition-colors"
              onClick={() => setSelectedCharacter(char)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg text-ink-900">{char.name}</h3>
                  <p className="text-xs text-ink-500">
                    Level {char.level} {char.race} {char.class}
                    {char.subclass && ` (${char.subclass})`}
                  </p>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{char.experience_points.toLocaleString()} XP</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono text-xs bg-gold-200 text-gold-700 px-2 py-0.5 rounded">
                    PB +{pb}
                  </span>
                  {canLevelUp && (
                    <span className="inline-flex items-center gap-1 text-xs text-heal font-display uppercase tracking-wider" title="Has enough XP to level up">
                      <ArrowUp size={11} /> Level Up
                    </span>
                  )}
                </div>
              </div>

              {/* HP Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="text-health" />
                    <span className="text-xs font-display text-ink-500">HP</span>
                  </div>
                  <span className="font-mono text-xs text-ink-700">
                    {char.current_hp} / {char.max_hp}
                    {char.temp_hp > 0 && <span className="text-temphp font-semibold"> +{char.temp_hp}</span>}
                  </span>
                </div>
                <div className="h-2 bg-parchment-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${hpColor} rounded-full transition-all`}
                    style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
                  />
                </div>
              </div>

              {/* Combat Stats */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-ink-400" />
                  <span className="font-mono text-sm text-ink-900">{char.armor_class}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-ink-400" />
                  <span className="font-mono text-sm text-ink-900">{char.speed} ft</span>
                </div>
              </div>

              {/* Ability Scores Grid */}
              <div className="grid grid-cols-6 gap-1">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(
                  (ability) => {
                    const score = char[ability]
                    const mod = abilityModifier(score)
                    return (
                      <div key={ability} className="text-center">
                        <div className="text-[10px] font-display uppercase text-ink-400">
                          {ABILITY_ABBREVIATIONS[ability]}
                        </div>
                        <div className="font-mono text-sm text-ink-900">{formatModifier(mod)}</div>
                        <div className="text-[10px] text-ink-400">{score}</div>
                      </div>
                    )
                  }
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Player Detail Modal */}
      {selectedCharacter && (
        <PlayerDetailModal
          key={selectedCharacter.id}
          open={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          character={selectedCharacter}
        />
      )}

      <XpAwardModal
        open={showXpModal}
        onClose={() => setShowXpModal(false)}
        characters={characters}
        onAward={(characterId, amount) => awardXp({ characterId, amount })}
        isAwarding={isAwarding}
      />
    </div>
  )
}
