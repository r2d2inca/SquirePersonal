import { abilityModifier, formatModifier } from '@/lib/calculations'
import type { SRDMonsterDetail } from '@/lib/dnd5e'
import type { Npc, NpcAbilityAction } from '@/lib/types/database'

type MonsterData = SRDMonsterDetail | Npc

interface MonsterStatBlockProps {
  monster: MonsterData
}

function isSRDMonster(m: MonsterData): m is SRDMonsterDetail {
  return 'armor_class' in m && Array.isArray((m as SRDMonsterDetail).armor_class)
}

function getAC(m: MonsterData): { value: number; desc: string } {
  if (isSRDMonster(m)) {
    const ac = m.armor_class[0]
    return { value: ac?.value ?? 10, desc: ac?.desc ?? ac?.type ?? '' }
  }
  return { value: m.armor_class as number, desc: (m as Npc).armor_desc }
}

function getHP(m: MonsterData): { hp: number; dice: string } {
  if (isSRDMonster(m)) {
    return { hp: m.hit_points, dice: m.hit_points_roll }
  }
  return { hp: (m as Npc).hit_points, dice: (m as Npc).hit_dice }
}

function getSpeed(m: MonsterData): string {
  const speed = isSRDMonster(m) ? m.speed : (m as Npc).speed
  return Object.entries(speed).map(([k, v]) => `${k} ${v}`).join(', ')
}

function getSenses(m: MonsterData): string {
  if (isSRDMonster(m)) {
    return Object.entries(m.senses).map(([k, v]) => `${k} ${v}`).join(', ')
  }
  return (m as Npc).senses
}

function getSaves(m: MonsterData): { name: string; value: number }[] {
  if (isSRDMonster(m)) {
    return m.proficiencies
      .filter((p) => p.proficiency.index.startsWith('saving-throw-'))
      .map((p) => ({ name: p.proficiency.name.replace('Saving Throw: ', ''), value: p.value }))
  }
  return (m as Npc).saving_throws ?? []
}

function getSkills(m: MonsterData): { name: string; value: number }[] {
  if (isSRDMonster(m)) {
    return m.proficiencies
      .filter((p) => p.proficiency.index.startsWith('skill-'))
      .map((p) => ({ name: p.proficiency.name.replace('Skill: ', ''), value: p.value }))
  }
  return (m as Npc).skills ?? []
}

function getConditionImmunities(m: MonsterData): string[] {
  if (isSRDMonster(m)) {
    return m.condition_immunities.map((c) => c.name)
  }
  return (m as Npc).condition_immunities
}

function getActions(m: MonsterData, key: 'special_abilities' | 'actions' | 'reactions' | 'legendary_actions'): NpcAbilityAction[] {
  if (isSRDMonster(m)) {
    return (m[key] ?? []) as NpcAbilityAction[]
  }
  return ((m as Npc)[key] ?? []) as NpcAbilityAction[]
}

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
const ABILITY_SHORT = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' }

export function MonsterStatBlock({ monster }: MonsterStatBlockProps) {
  const ac = getAC(monster)
  const hp = getHP(monster)
  const speed = getSpeed(monster)
  const senses = getSenses(monster)
  const saves = getSaves(monster)
  const skills = getSkills(monster)
  const conditionImmunities = getConditionImmunities(monster)
  const specialAbilities = getActions(monster, 'special_abilities')
  const actions = getActions(monster, 'actions')
  const reactions = getActions(monster, 'reactions')
  const legendaryActions = getActions(monster, 'legendary_actions')
  const legendaryDesc = isSRDMonster(monster) ? monster.legendary_desc : (monster as Npc).legendary_desc

  return (
    <div className="space-y-3">
      {/* Identity */}
      <div>
        <h2 className="font-display text-2xl text-ink-900">{monster.name}</h2>
        <p className="text-sm italic text-ink-500">
          {monster.size} {monster.type}, {monster.alignment}
        </p>
      </div>

      <div className="border-t-2 border-gold-400" />

      {/* Core Stats */}
      <div className="space-y-1 text-sm">
        <p><span className="font-display text-ink-900">Armor Class</span> {ac.value}{ac.desc ? ` (${ac.desc})` : ''}</p>
        <p><span className="font-display text-ink-900">Hit Points</span> {hp.hp}{hp.dice ? ` (${hp.dice})` : ''}</p>
        <p><span className="font-display text-ink-900">Speed</span> {speed}</p>
      </div>

      <div className="border-t-2 border-gold-400" />

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-2 text-center">
        {ABILITIES.map((ability) => {
          const score = monster[ability] as number
          const mod = abilityModifier(score)
          return (
            <div key={ability}>
              <div className="font-display text-xs text-ink-500">{ABILITY_SHORT[ability]}</div>
              <div className="font-mono text-sm text-ink-900">
                {score} ({formatModifier(mod)})
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t-2 border-gold-400" />

      {/* Proficiencies & Resistances */}
      <div className="space-y-1 text-sm">
        {saves.length > 0 && (
          <p><span className="font-display text-ink-900">Saving Throws</span> {saves.map((s) => `${s.name} ${formatModifier(s.value)}`).join(', ')}</p>
        )}
        {skills.length > 0 && (
          <p><span className="font-display text-ink-900">Skills</span> {skills.map((s) => `${s.name} ${formatModifier(s.value)}`).join(', ')}</p>
        )}
        {monster.damage_vulnerabilities.length > 0 && (
          <p><span className="font-display text-ink-900">Damage Vulnerabilities</span> {monster.damage_vulnerabilities.join(', ')}</p>
        )}
        {monster.damage_resistances.length > 0 && (
          <p><span className="font-display text-ink-900">Damage Resistances</span> {monster.damage_resistances.join(', ')}</p>
        )}
        {monster.damage_immunities.length > 0 && (
          <p><span className="font-display text-ink-900">Damage Immunities</span> {monster.damage_immunities.join(', ')}</p>
        )}
        {conditionImmunities.length > 0 && (
          <p><span className="font-display text-ink-900">Condition Immunities</span> {conditionImmunities.join(', ')}</p>
        )}
        {senses && (
          <p><span className="font-display text-ink-900">Senses</span> {senses}</p>
        )}
        <p><span className="font-display text-ink-900">Languages</span> {monster.languages || '—'}</p>
        <p><span className="font-display text-ink-900">Challenge</span> {monster.challenge_rating} ({isSRDMonster(monster) ? `${monster.xp} XP` : `PB +${monster.proficiency_bonus}`})</p>
      </div>

      {/* Special Abilities */}
      {specialAbilities.length > 0 && (
        <>
          <div className="border-t-2 border-gold-400" />
          <div className="space-y-2">
            {specialAbilities.map((ability, i) => (
              <div key={i} className="text-sm">
                <span className="font-display text-ink-900 italic">{ability.name}.</span>{' '}
                <span className="text-ink-700">{ability.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <>
          <div className="border-t-2 border-gold-400" />
          <h3 className="font-display text-lg text-ink-900">Actions</h3>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className="text-sm">
                <span className="font-display text-ink-900 italic">{action.name}.</span>{' '}
                <span className="text-ink-700">{action.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reactions */}
      {reactions.length > 0 && (
        <>
          <div className="border-t-2 border-gold-400" />
          <h3 className="font-display text-lg text-ink-900">Reactions</h3>
          <div className="space-y-2">
            {reactions.map((reaction, i) => (
              <div key={i} className="text-sm">
                <span className="font-display text-ink-900 italic">{reaction.name}.</span>{' '}
                <span className="text-ink-700">{reaction.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Legendary Actions */}
      {legendaryActions.length > 0 && (
        <>
          <div className="border-t-2 border-gold-400" />
          <h3 className="font-display text-lg text-ink-900">Legendary Actions</h3>
          {legendaryDesc && (
            <p className="text-sm text-ink-500 italic mb-2">{legendaryDesc}</p>
          )}
          <div className="space-y-2">
            {legendaryActions.map((action, i) => (
              <div key={i} className="text-sm">
                <span className="font-display text-ink-900 italic">{action.name}.</span>{' '}
                <span className="text-ink-700">{action.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
