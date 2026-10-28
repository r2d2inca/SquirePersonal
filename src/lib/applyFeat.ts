import { SKILLS } from '@/lib/constants'
import { proficiencyBonus } from '@/lib/calculations'
import { FEAT_FIXED_SPELLS, FEAT_PROFICIENCY_GRANTS, FEAT_RESOURCES, FEAT_FLAT_HP, type FeatData } from '@/lib/featData'
import { getSpellDetail, formatSpellComponents, formatSpellDescription } from '@/lib/dnd5e'
import type { Character, CharacterUpdate, Feature } from '@/lib/types/database'

/** Choices the player made while picking the feat (ability bump + feat-specific extras). */
export interface FeatChoice {
  featAbility: string | null
  extras: Record<string, unknown>
}

export interface FeatSpellSlug {
  slug: string
  source: string
}

export interface AppliedFeat {
  /** The feature row to add to character.features. */
  feature: Feature
  /** Character column changes (ability score, proficiencies, HP), merged onto `base`. */
  updates: CharacterUpdate
  /** Spells the feat grants, to be resolved into rows with resolveSpellRows(). */
  spellSlugs: FeatSpellSlug[]
}

/**
 * Everything taking a feat does to a character, in one place. Used by the
 * level-up wizard and the post-creation Add Feat flow so the two cannot drift.
 *
 * `base` lets a caller that is already building an update (level-up) stack the
 * feat on top of it; HP and proficiency changes read from `base` first.
 */
export function applyFeat(
  character: Character,
  feat: FeatData,
  choice: FeatChoice,
  level: number,
  base: CharacterUpdate = {},
): AppliedFeat {
  const updates: CharacterUpdate = { ...base }
  const extras = choice.extras

  // Description with the chosen extras appended so the sheet shows what was picked.
  let featDesc = feat.description
  const notes: string[] = []
  if (extras.skill) notes.push(`Chosen skill: ${extras.skill}`)
  if (extras.expertise) notes.push(`Expertise: ${extras.expertise}`)
  if ((extras.skills as string[] | undefined)?.length) notes.push(`Chosen: ${(extras.skills as string[]).join(', ')}`)
  if (extras.savingThrow) notes.push(`Saving throw: ${extras.savingThrow}`)
  if (extras.damageType) notes.push(`Chosen damage type: ${extras.damageType}`)
  if ((extras.damageTypes as string[] | undefined)?.length) notes.push(`Resistances: ${(extras.damageTypes as string[]).join(', ')}`)
  if (extras.spellPick) notes.push(`Chosen spell: ${extras.spellPick}`)
  if ((extras.spellPicks as string[] | undefined)?.length) notes.push(`Ritual spells: ${(extras.spellPicks as string[]).join(', ')}`)
  if ((extras.tools as string[] | undefined)?.length) notes.push(`Tools: ${(extras.tools as string[]).join(', ')}`)
  if ((extras.instruments as string[] | undefined)?.length) notes.push(`Instruments: ${(extras.instruments as string[]).join(', ')}`)
  if (extras.miAbility) notes.push(`Spellcasting ability: ${extras.miAbility}`)
  if (notes.length > 0) featDesc += '\n\n' + notes.join('. ') + '.'

  // Resource tracking (e.g. Lucky, Chef)
  const resource = FEAT_RESOURCES[feat.name]
  const feature: Feature = { name: feat.name, description: featDesc, source: 'Feat' }
  if (resource) {
    const maxUses = resource.usesMax === 'proficiency' ? proficiencyBonus(level) : resource.usesMax
    feature.usesMax = maxUses
    feature.usesRemaining = maxUses
    feature.rechargeOn = resource.rechargeOn
  }

  // +1 ability score. Resilient's bump is tied to the chosen saving throw.
  const effectiveAbility = feat.name === 'Resilient' && extras.savingThrow
    ? (extras.savingThrow as string)
    : choice.featAbility
  if (feat.abilityScoreIncrease && effectiveAbility) {
    const currentScore = ((updates as Record<string, unknown>)[effectiveAbility] as number | undefined)
      ?? (character[effectiveAbility as keyof Character] as number)
    const maxScore = feat.maxAbilityScore ?? 20
    ;(updates as Record<string, unknown>)[effectiveAbility] = Math.min(maxScore, currentScore + 1)
  }

  // Proficiencies
  const currentProfs = updates.proficiencies ? { ...updates.proficiencies } : { ...character.proficiencies }
  let profsChanged = false
  const addTo = (key: 'skills' | 'tools' | 'armor' | 'weapons' | 'savingThrows' | 'expertise', value: string) => {
    const list = (currentProfs[key] ?? []) as string[]
    if (!list.includes(value)) {
      ;(currentProfs as Record<string, unknown>)[key] = [...list, value]
      profsChanged = true
    }
  }

  // Keen Mind / Observant: expertise if already proficient, else proficiency
  if (extras.skill) {
    const skillLower = (extras.skill as string).toLowerCase()
    const upgrades = feat.name === 'Keen Mind' || feat.name === 'Observant'
    if (upgrades && currentProfs.skills.includes(skillLower)) addTo('expertise', skillLower)
    else addTo('skills', skillLower)
  }
  if (extras.expertise) addTo('expertise', (extras.expertise as string).toLowerCase())
  // Skilled: 3 skills or tools
  for (const pick of (extras.skills as string[] | undefined) ?? []) {
    if (SKILLS.some((s) => s.name === pick)) addTo('skills', pick.toLowerCase())
    else addTo('tools', pick)
  }
  if (extras.savingThrow) addTo('savingThrows', (extras.savingThrow as string).toLowerCase())
  for (const t of (extras.tools as string[] | undefined) ?? []) addTo('tools', t)
  for (const t of (extras.instruments as string[] | undefined) ?? []) addTo('tools', t)
  const grants = FEAT_PROFICIENCY_GRANTS[feat.name]
  if (grants) {
    grants.tools?.forEach((t) => addTo('tools', t))
    grants.armor?.forEach((a) => addTo('armor', a))
    grants.weapons?.forEach((w) => addTo('weapons', w))
    if (grants.allSkills) SKILLS.forEach((s) => addTo('skills', s.name.toLowerCase()))
  }
  if (profsChanged) updates.proficiencies = currentProfs

  // Flat HP (Boon of Fortitude, Tough is per-level and handled by the features engine)
  const flatHp = FEAT_FLAT_HP[feat.name]
  if (flatHp) {
    updates.max_hp = (updates.max_hp ?? character.max_hp) + flatHp
    updates.current_hp = (updates.current_hp ?? character.current_hp) + flatHp
  }

  // Spells
  const source = `Feat (${feat.name})`
  const spellSlugs: FeatSpellSlug[] = []
  for (const slug of FEAT_FIXED_SPELLS[feat.name] ?? []) spellSlugs.push({ slug, source })
  if (extras.spellPick) spellSlugs.push({ slug: extras.spellPick as string, source })
  for (const slug of (extras.spellPicks as string[] | undefined) ?? []) spellSlugs.push({ slug, source })
  for (const slug of (extras.miCantrips as string[] | undefined) ?? []) spellSlugs.push({ slug, source })
  if (extras.miSpell) spellSlugs.push({ slug: extras.miSpell as string, source })

  return { feature, updates, spellSlugs }
}

export interface SpellRow {
  name: string
  level: number
  school: string
  casting_time: string
  range: string
  components: string
  duration: string
  is_concentration: boolean
  is_ritual: boolean
  description: string
  higher_levels: string
  source: string
}

/** Fetch SRD details for granted spells. Unresolvable slugs are skipped, never fatal. */
export async function resolveSpellRows(slugs: FeatSpellSlug[]): Promise<SpellRow[]> {
  const details = await Promise.all(
    slugs.map(({ slug, source }) => getSpellDetail(slug).then((spell) => ({ spell, source })).catch(() => null)),
  )
  const rows: SpellRow[] = []
  for (const d of details) {
    if (!d) continue
    rows.push({
      name: d.spell.name,
      level: d.spell.level,
      school: d.spell.school?.name ?? '',
      casting_time: d.spell.casting_time ?? '',
      range: d.spell.range ?? '',
      components: formatSpellComponents(d.spell.components, d.spell.material),
      duration: d.spell.duration ?? '',
      is_concentration: d.spell.concentration ?? false,
      is_ritual: d.spell.ritual ?? false,
      description: formatSpellDescription(d.spell.desc),
      higher_levels: d.spell.higher_level?.join('\n\n') ?? '',
      source: d.source,
    })
  }
  return rows
}
