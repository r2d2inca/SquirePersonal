// ─── API Base URLs ───
const OPEN5E_URL = 'https://api.open5e.com/v1' // magic items (broad SRD catalog; items are edition-identical)
const OPEN5E_V2_URL = 'https://api.open5e.com/v2' // spells + creatures, sourced from SRD 5.2 (2024 rules)
const SRD_2024_DOC = 'srd-2024' // Open5e V2 document key for the 2024 System Reference Document (5.2)
const SRD_URL = 'https://www.dnd5eapi.co/api/2014' // only used for legacy equipment type definitions

// ─── Cache ───
const cache = new Map<string, unknown>()

async function fetchSRD<T>(path: string): Promise<T> {
  const key = `srd:${path}`
  if (cache.has(key)) return cache.get(key) as T
  const res = await fetch(`${SRD_URL}${path}`)
  if (!res.ok) throw new Error(`SRD API error: ${res.status}`)
  const data = await res.json()
  cache.set(key, data)
  return data as T
}

async function fetchOpen5e<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open5e API error: ${res.status}`)
  const data = await res.json()
  cache.set(url, data)
  return data as T
}

// ─── Open5e Internal Types ───

// Open5e V2 spell schema (SRD 5.2 / 2024). Keys are prefixed, e.g. "srd-2024_fire-bolt".
interface Open5eSpellV2 {
  key: string
  name: string
  level: number
  school: { name: string; key: string } | null
  desc: string
  higher_level: string
  range: number | null
  range_text: string
  duration: string
  concentration: boolean
  ritual: boolean
  casting_time: string
  verbal: boolean
  somatic: boolean
  material: boolean
  material_specified: string | null
  damage_roll: string | null
  damage_types: string[]
  saving_throw_ability: string | null
  attack_roll: boolean | null
  casting_options: { type: string; damage_roll: string | null; desc: string | null }[]
  classes: { name: string; key: string }[]
  document: { key: string } | string | null
}

/** Strip the V2 document prefix from a key, e.g. "srd-2024_fire-bolt" -> "fire-bolt". */
function bareSpellSlug(key: string): string {
  return key.replace(/^srd-2024_/, '')
}

// Open5e V2 creature schema (SRD 5.2 / 2024). Keys are prefixed, e.g. "srd-2024_aboleth".
interface Open5eCreatureV2 {
  key: string
  name: string
  size: { name: string; key: string } | null
  type: { name: string; key: string } | null
  subcategory: string | null
  alignment: string
  armor_class: number
  armor_detail: string
  hit_points: number
  hit_dice: string
  challenge_rating: number
  experience_points: number | null
  proficiency_bonus: number | null
  speed: Record<string, number | string>
  ability_scores: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number } | null
  saving_throws: Record<string, number>
  skill_bonuses: Record<string, number>
  resistances_and_immunities: {
    damage_resistances_display?: string
    damage_immunities_display?: string
    damage_vulnerabilities_display?: string
    condition_immunities_display?: string
    condition_immunities?: { name: string; key?: string }[]
  } | null
  languages: { as_string?: string } | null
  darkvision_range: number | null
  blindsight_range: number | null
  truesight_range: number | null
  tremorsense_range: number | null
  passive_perception: number | null
  traits: { name: string; desc: string }[]
  actions: { name: string; desc: string; action_type?: string }[]
  document: { key: string } | string | null
}

interface Open5eMagicItem {
  slug: string
  name: string
  type: string
  desc: string
  rarity: string
  requires_attunement: string
  document__slug: string
}

interface Open5ePaginatedResponse<T> {
  count: number
  next: string | null
  results: T[]
}

// ─── Deduplication helper ───
// Open5e includes spells/monsters from multiple documents (SRD, A5E, etc.)
// Keep only one per name, preferring the official wotc-srd version
// Only include official 5e SRD content
function dedup<T extends { name: string; document__slug: string; slug: string }>(items: T[]): T[] {
  const filtered = items.filter((item) => item.document__slug === 'wotc-srd')
  // Still deduplicate by name just in case
  const seen = new Map<string, T>()
  for (const item of filtered) {
    const key = item.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, item)
    }
  }
  return Array.from(seen.values())
}

// ─── Spell detail cache (populated from list fetches), keyed by bare slug ───
const spellDetailCache = new Map<string, Open5eSpellV2>()
const monsterDetailCache = new Map<string, Open5eCreatureV2>()

// ─── Spell Types (exported — unchanged) ───

export interface SRDSpellSummary {
  index: string
  name: string
  level: number
  url: string
}

export interface SRDSpellDetail {
  index: string
  name: string
  desc: string[]
  higher_level?: string[]
  range: string
  components: string[]
  material?: string
  ritual: boolean
  duration: string
  concentration: boolean
  casting_time: string
  level: number
  school: { index: string; name: string }
  classes: { index: string; name: string }[]
  subclasses?: { index: string; name: string }[]
  damage?: {
    damage_type?: { name: string }
    damage_at_slot_level?: Record<string, string>
    damage_at_character_level?: Record<string, string>
  }
  dc?: {
    dc_type: { name: string }
    dc_success: string
  }
  area_of_effect?: {
    type: string
    size: number
  }
  heal_at_slot_level?: Record<string, string>
}

// ─── Class Level Types (exported — unchanged) ───

export interface SRDFeatureSummary {
  index: string
  name: string
  url: string
}

export interface SRDFeatureDetail {
  index: string
  name: string
  desc: string[]
  level: number
  class: { index: string; name: string }
}

export interface SRDClassLevel {
  level: number
  ability_score_bonuses: number
  prof_bonus: number
  features: SRDFeatureSummary[]
  spellcasting?: {
    cantrips_known?: number
    spells_known?: number
    spell_slots_level_1: number
    spell_slots_level_2: number
    spell_slots_level_3: number
    spell_slots_level_4: number
    spell_slots_level_5: number
    spell_slots_level_6: number
    spell_slots_level_7: number
    spell_slots_level_8: number
    spell_slots_level_9: number
  }
  class_specific?: Record<string, unknown>
}

export interface SRDClassInfo {
  index: string
  name: string
  hit_die: number
  saving_throws: { index: string; name: string }[]
}

// ─── Subclass Types (exported — unchanged) ───

export interface SRDSubclassSummary {
  index: string
  name: string
  url: string
}

export interface SRDSubclassDetail {
  index: string
  name: string
  class: { index: string; name: string }
  subclass_flavor: string
  desc: string[]
}

// ─── Extended Feature Types (exported — unchanged) ───

export interface SRDFeatureDetailExtended {
  index: string
  name: string
  desc: string[]
  level: number
  class: { index: string; name: string }
  parent?: { index: string; name: string; url: string }
  feature_specific?: {
    subfeature_options?: {
      choose: number
      type: string
      from: {
        option_set_type: string
        options: Array<{
          option_type: string
          item: { index: string; name: string; url: string }
        }>
      }
    }
  }
}

// ─── Open5e → SRD Mapping Helpers ───

function mapSpellSummary(s: Open5eSpellV2): SRDSpellSummary {
  return {
    index: bareSpellSlug(s.key),
    name: s.name,
    level: s.level,
    url: '',
  }
}

function mapSpellDetail(s: Open5eSpellV2): SRDSpellDetail {
  // Components from V2 booleans; material text from material_specified.
  const components: string[] = []
  if (s.verbal) components.push('V')
  if (s.somatic) components.push('S')
  if (s.material) components.push('M')

  const classes = (s.classes ?? []).map((c) => ({ index: c.key, name: c.name }))

  // Cantrip damage scaling lives in casting_options (player_level_5/11/17).
  let damage: SRDSpellDetail['damage']
  const levelDamage: Record<string, string> = {}
  if (s.damage_roll) levelDamage['1'] = s.damage_roll
  for (const opt of s.casting_options ?? []) {
    const m = opt.type?.match(/player_level_(\d+)/)
    if (m && opt.damage_roll) levelDamage[m[1]] = opt.damage_roll
  }
  if (Object.keys(levelDamage).length > 0) {
    damage = {
      damage_type: s.damage_types?.[0] ? { name: s.damage_types[0] } : undefined,
      damage_at_character_level: levelDamage,
    }
  }

  return {
    index: bareSpellSlug(s.key),
    name: s.name,
    desc: s.desc ? s.desc.split('\n').filter(Boolean) : [],
    higher_level: s.higher_level ? s.higher_level.split('\n').filter(Boolean) : undefined,
    range: s.range_text || (s.range != null ? `${s.range} feet` : ''),
    components,
    material: s.material_specified || undefined,
    ritual: !!s.ritual,
    duration: s.duration,
    concentration: !!s.concentration,
    casting_time: s.casting_time,
    level: s.level,
    school: { index: s.school?.key ?? 'unknown', name: s.school?.name ?? 'Unknown' },
    classes,
    damage,
    dc: s.saving_throw_ability
      ? { dc_type: { name: s.saving_throw_ability.charAt(0).toUpperCase() + s.saving_throw_ability.slice(1) }, dc_success: '' }
      : undefined,
  }
}

/** True if a V2 result belongs to the 2024 SRD document. */
function isSrd2024(s: Open5eSpellV2): boolean {
  const doc = s.document
  const key = typeof doc === 'string' ? doc : doc?.key
  return key === SRD_2024_DOC || s.key.startsWith('srd-2024_')
}

export function parseCR(cr: string | number): number {
  if (typeof cr === 'number') return cr
  if (cr.includes('/')) {
    const [num, den] = cr.split('/')
    return Number(num) / Number(den)
  }
  return Number(cr) || 0
}

export function crToXP(cr: number): number {
  const table: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100,
    5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400,
    13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000,
    20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000,
    27: 105000, 28: 120000, 29: 135000, 30: 155000,
  }
  return table[cr] ?? 0
}

function crToProfBonus(cr: number): number {
  if (cr < 1) return 2
  return 2 + Math.floor((cr - 1) / 4)
}

function splitList(s: string): string[] {
  if (!s || !s.trim()) return []
  return s.split(',').map((v) => v.trim()).filter(Boolean)
}

function mapMonsterSummary(c: Open5eCreatureV2): SRDMonsterSummary {
  return {
    index: bareSpellSlug(c.key),
    name: c.name,
    url: '',
  }
}

/** True if a V2 creature belongs to the 2024 SRD document. */
function isSrd2024Creature(c: Open5eCreatureV2): boolean {
  const doc = c.document
  const key = typeof doc === 'string' ? doc : doc?.key
  return key === SRD_2024_DOC || c.key.startsWith('srd-2024_')
}

function mapMonsterDetail(c: Open5eCreatureV2): SRDMonsterDetail {
  const cr = parseCR(c.challenge_rating)

  // Speed: V2 is { walk: 10, swim: 40, unit: 'feet' } → { walk: '10 ft.', ... }
  const speed: Record<string, string> = {}
  for (const [k, v] of Object.entries(c.speed ?? {})) {
    if (k === 'unit' || typeof v !== 'number') continue
    speed[k] = `${v} ft.`
  }

  // Proficiencies: saving_throws + skill_bonuses are keyed objects in V2.
  const SAVE_ABBR: Record<string, string> = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' }
  const proficiencies: SRDMonsterDetail['proficiencies'] = []
  for (const [ab, val] of Object.entries(c.saving_throws ?? {})) {
    if (typeof val !== 'number') continue
    proficiencies.push({ value: val, proficiency: { index: `saving-throw-${ab.slice(0, 3)}`, name: `Saving Throw: ${SAVE_ABBR[ab] ?? ab}` } })
  }
  for (const [skill, val] of Object.entries(c.skill_bonuses ?? {})) {
    if (typeof val !== 'number') continue
    proficiencies.push({ value: val, proficiency: { index: `skill-${skill.toLowerCase()}`, name: `Skill: ${skill.charAt(0).toUpperCase() + skill.slice(1)}` } })
  }

  // Senses from range fields.
  const senses: Record<string, string | number> = {}
  if (c.darkvision_range) senses.darkvision = `${c.darkvision_range} ft.`
  if (c.blindsight_range) senses.blindsight = `${c.blindsight_range} ft.`
  if (c.truesight_range) senses.truesight = `${c.truesight_range} ft.`
  if (c.tremorsense_range) senses.tremorsense = `${c.tremorsense_range} ft.`
  if (c.passive_perception != null) senses.passive_perception = c.passive_perception

  // Actions are a single list tagged by action_type in V2; split them out.
  const actions: { name: string; desc: string }[] = []
  const legendary_actions: { name: string; desc: string }[] = []
  const reactions: { name: string; desc: string }[] = []
  for (const a of c.actions ?? []) {
    const entry = { name: a.name, desc: a.desc }
    if (a.action_type === 'LEGENDARY_ACTION') legendary_actions.push(entry)
    else if (a.action_type === 'REACTION') reactions.push(entry)
    else actions.push(entry)
  }

  const ri = c.resistances_and_immunities
  const ab = c.ability_scores

  return {
    index: bareSpellSlug(c.key),
    name: c.name,
    size: c.size?.name ?? 'Medium',
    type: c.subcategory ? `${c.type?.name ?? ''} (${c.subcategory})` : (c.type?.name ?? ''),
    alignment: c.alignment,
    armor_class: [{ type: c.armor_detail || 'natural', value: c.armor_class, desc: c.armor_detail || undefined }],
    hit_points: c.hit_points,
    hit_points_roll: c.hit_dice,
    speed,
    strength: ab?.strength ?? 10,
    dexterity: ab?.dexterity ?? 10,
    constitution: ab?.constitution ?? 10,
    intelligence: ab?.intelligence ?? 10,
    wisdom: ab?.wisdom ?? 10,
    charisma: ab?.charisma ?? 10,
    proficiencies,
    damage_vulnerabilities: splitList(ri?.damage_vulnerabilities_display ?? ''),
    damage_resistances: splitList(ri?.damage_resistances_display ?? ''),
    damage_immunities: splitList(ri?.damage_immunities_display ?? ''),
    condition_immunities: (ri?.condition_immunities?.length
      ? ri.condition_immunities.map((ci) => ({ index: (ci.key ?? ci.name.toLowerCase()).replace(/\s+/g, '-'), name: ci.name }))
      : splitList(ri?.condition_immunities_display ?? '').map((name) => ({ index: name.toLowerCase().replace(/\s+/g, '-'), name }))),
    senses,
    languages: c.languages?.as_string ?? '',
    challenge_rating: cr,
    proficiency_bonus: c.proficiency_bonus ?? crToProfBonus(cr),
    xp: c.experience_points ?? crToXP(cr),
    special_abilities: c.traits ?? [],
    actions,
    legendary_actions,
    reactions,
    legendary_desc: '',
    image: undefined,
  }
}

// ─── Spell API Functions (Open5e V2 — SRD 5.2 / 2024) ───

/** Fetch the full 2024 SRD spell list once (cached) and warm the detail cache. */
async function fetchAllSrd2024Spells(): Promise<Open5eSpellV2[]> {
  const url = `${OPEN5E_V2_URL}/spells/?format=json&limit=1000&document__key=${SRD_2024_DOC}`
  const data = await fetchOpen5e<Open5ePaginatedResponse<Open5eSpellV2>>(url)
  for (const spell of data.results) {
    spellDetailCache.set(bareSpellSlug(spell.key), spell)
  }
  return data.results
}

export async function getAllSpells(): Promise<SRDSpellSummary[]> {
  const spells = await fetchAllSrd2024Spells()
  return spells.map(mapSpellSummary)
}

/** Get spells (up to maxLevel) filtered by school(s), with school info */
export async function getSpellsBySchool(schools: string[], maxLevel: number = 1): Promise<(SRDSpellSummary & { school: string })[]> {
  const spells = await fetchAllSrd2024Spells()
  const schoolsLower = schools.map(s => s.toLowerCase())
  return spells
    .filter(s => s.level >= 1 && s.level <= maxLevel && schoolsLower.includes((s.school?.name ?? '').toLowerCase()))
    .map(s => ({ index: bareSpellSlug(s.key), name: s.name, level: s.level, url: '', school: s.school?.name ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Get all spells (up to maxLevel) with the Ritual tag */
export async function getRitualSpells(maxLevel: number = 1): Promise<SRDSpellSummary[]> {
  const spells = await fetchAllSrd2024Spells()
  return spells
    .filter(s => s.ritual && s.level >= 1 && s.level <= maxLevel)
    .map(mapSpellSummary)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSpellsByClass(classIndex: string): Promise<SRDSpellSummary[]> {
  // Use 2024 spell list if available (this is the authoritative pickable list per class)
  const { get2024SpellList } = await import('./spellLists2024')
  const list2024 = get2024SpellList(classIndex)
  if (list2024) {
    return list2024.map(s => ({ index: s.index, name: s.name, level: s.level, url: '' }))
  }

  // Fallback: filter the full 2024 SRD spell set by class
  const classKey = classIndex.toLowerCase()
  const spells = await fetchAllSrd2024Spells()
  return spells
    .filter(s => (s.classes ?? []).some(c => c.key === classKey || c.name.toLowerCase() === classKey))
    .map(mapSpellSummary)
}

export async function getSpellDetail(spellIndex: string): Promise<SRDSpellDetail> {
  // Check cache first (populated by list fetches)
  if (spellDetailCache.has(spellIndex)) {
    return mapSpellDetail(spellDetailCache.get(spellIndex)!)
  }

  // Build a list of bare-slug variants, then turn each into a 2024 SRD key.
  const slugsToTry = [
    spellIndex,
    spellIndex.replace(/^[a-z]+s-/, ''),  // strip possessive prefix ("tashas-hideous-laughter" → "hideous-laughter")
    spellIndex.replace(/^[a-z]+-/, ''),    // strip first word
  ].filter((s, i, arr) => s && arr.indexOf(s) === i)

  // Try direct key lookups against the 2024 SRD document.
  for (const slug of slugsToTry) {
    try {
      const url = `${OPEN5E_V2_URL}/spells/${SRD_2024_DOC}_${slug}/?format=json`
      const spell = await fetchOpen5e<Open5eSpellV2>(url)
      spellDetailCache.set(spellIndex, spell)
      return mapSpellDetail(spell)
    } catch { /* continue */ }
  }

  // Try searching by name. Prefer a 2024 SRD result; fall back to any edition so a spell
  // whose slug we guessed wrong still resolves rather than showing a blank placeholder.
  const searchName = spellIndex.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const searchTerms = [
    searchName,
    searchName.replace(/^[A-Z][a-z]+'s /, ''),  // strip possessive ("Tasha's Hideous Laughter" → "Hideous Laughter")
  ].filter((s, i, arr) => s && arr.indexOf(s) === i)

  for (const term of searchTerms) {
    try {
      const cleanTerm = term.replace(/[^a-zA-Z ]/g, '').trim()
      if (!cleanTerm) continue
      const searchUrl = `${OPEN5E_V2_URL}/spells/?format=json&name__icontains=${encodeURIComponent(cleanTerm)}&limit=10`
      const result = await fetchOpen5e<Open5ePaginatedResponse<Open5eSpellV2>>(searchUrl)
      const byName = result.results.filter(r => r.name.toLowerCase() === searchName.toLowerCase())
      const pool = byName.length > 0 ? byName : result.results
      // Prefer the 2024 SRD version when present.
      const match = pool.find(isSrd2024) ?? pool[0]
      if (match) {
        spellDetailCache.set(spellIndex, match)
        return mapSpellDetail(match)
      }
    } catch { /* continue */ }
  }

  // Check local spell descriptions (for non-SRD spells from XGE, TCE, etc.)
  const { getLocalSpellData } = await import('./spellDescriptions')
  const local = getLocalSpellData(spellIndex)
  if (local) {
    return {
      index: spellIndex,
      name: local.name,
      level: local.level,
      school: { index: local.school.toLowerCase(), name: local.school },
      casting_time: local.castingTime,
      range: local.range,
      components: local.components.split(',').map(c => c.trim()),
      material: '',
      duration: local.duration,
      concentration: local.concentration,
      ritual: local.ritual,
      desc: [local.description],
      higher_level: local.higherLevels ? [local.higherLevels] : [],
      classes: [],
    }
  }

  {
    // Spell not found in any source — return minimal placeholder
    const name = spellIndex.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return {
      index: spellIndex,
      name,
      level: 0,
      school: { index: 'unknown', name: 'Unknown' },
      casting_time: '',
      range: '',
      components: [],
      material: '',
      duration: '',
      concentration: false,
      ritual: false,
      desc: ['This spell is from a source not included in the Open5e database. Refer to your 2024 Player\'s Handbook for the full description.'],
      higher_level: [],
      classes: [],
    }
  }
}

// ─── Class Level API Functions (2024 local data) ───

export async function getClassLevels(classIndex: string): Promise<SRDClassLevel[]> {
  const { getClassLevels2024 } = await import('./classFeatures2024')
  const levels2024 = getClassLevels2024(classIndex)
  if (levels2024) return levels2024
  throw new Error(`No 2024 class data found for: ${classIndex}`)
}

export async function getClassLevel(classIndex: string, level: number): Promise<SRDClassLevel> {
  const { getClassLevel2024 } = await import('./classFeatures2024')
  const level2024 = getClassLevel2024(classIndex, level)
  if (level2024) return level2024
  throw new Error(`No 2024 class data found for: ${classIndex} level ${level}`)
}

export async function getClassInfo(classIndex: string): Promise<SRDClassInfo> {
  const { getClassData2024 } = await import('./classFeatures2024')
  const data = getClassData2024(classIndex)
  if (data) {
    return {
      index: data.index,
      name: data.name,
      hit_die: data.hitDie,
      saving_throws: data.savingThrows.map(s => ({
        index: s.toLowerCase().slice(0, 3),
        name: s,
      })),
    }
  }
  throw new Error(`No 2024 class data found for: ${classIndex}`)
}

export async function getFeatureDetail(featureIndex: string): Promise<SRDFeatureDetail> {
  const { getFeatureDetail2024 } = await import('./classFeatures2024')
  const feature2024 = getFeatureDetail2024(featureIndex)
  if (feature2024) return feature2024
  // Return a placeholder for unknown features
  return {
    index: featureIndex,
    name: featureIndex.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    desc: ['Feature details not yet available. Refer to your 2024 Player\'s Handbook.'],
    level: 0,
    class: { index: '', name: '' },
  }
}

export async function getFeatureDetailExtended(featureIndex: string): Promise<SRDFeatureDetailExtended> {
  const { getFeatureDetail2024 } = await import('./classFeatures2024')
  const feature2024 = getFeatureDetail2024(featureIndex)
  if (feature2024) return feature2024 as SRDFeatureDetailExtended
  // Return a placeholder for unknown features
  return {
    index: featureIndex,
    name: featureIndex.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    desc: ['Feature details not yet available. Refer to your 2024 Player\'s Handbook.'],
    level: 0,
    class: { index: '', name: '' },
  }
}

export async function getSubclassesByClass(_classIndex: string): Promise<SRDSubclassSummary[]> {
  // Subclass data is now in phbData.ts — this function kept for API compatibility
  return []
}

export async function getSubclassDetail(_subclassIndex: string): Promise<SRDSubclassDetail> {
  // Subclass data is now in phbData.ts — this function kept for API compatibility
  return {
    index: _subclassIndex,
    name: _subclassIndex.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    class: { index: '', name: '' },
    subclass_flavor: '',
    desc: ['Subclass details not yet available. Refer to your 2024 Player\'s Handbook.'],
  }
}

export async function getClassFeatures(classIndex: string): Promise<SRDFeatureSummary[]> {
  const { getClassFeatures2024 } = await import('./classFeatures2024')
  const features2024 = getClassFeatures2024(classIndex)
  if (features2024) return features2024
  throw new Error(`No 2024 class data found for: ${classIndex}`)
}

/** Extract choice options from a feature with subfeature_options */
export function getChoiceOptions(feature: SRDFeatureDetailExtended): { index: string; name: string }[] {
  if (!feature.feature_specific?.subfeature_options) return []
  return feature.feature_specific.subfeature_options.from.options.map((opt) => opt.item)
}

// ─── Equipment Types (exported — unchanged) ───

export interface SRDEquipmentSummary {
  index: string
  name: string
  url: string
}

export interface SRDEquipmentDetail {
  index: string
  name: string
  equipment_category: { index: string; name: string }
  weight?: number
  cost?: { quantity: number; unit: string }
  desc: string[]
  special?: string[]
  // Weapon fields
  weapon_category?: string
  weapon_range?: string
  category_range?: string
  damage?: { damage_dice: string; damage_type: { name: string } }
  two_handed_damage?: { damage_dice: string; damage_type: { name: string } }
  range?: { normal: number; long?: number | null }
  properties?: { index: string; name: string }[]
  // Armor fields
  armor_category?: string
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number | null }
  str_minimum?: number
  stealth_disadvantage?: boolean
  // Gear fields
  contents?: { item: { index: string; name: string }; quantity: number }[]
}

export interface SRDMagicItemSummary {
  index: string
  name: string
  url: string
}

export interface SRDMagicItemDetail {
  index: string
  name: string
  equipment_category: { index: string; name: string }
  rarity: { name: string }
  desc: string[]
  variant: boolean
  variants?: { index: string; name: string }[]
}

// ─── Equipment API Functions (SRD — unchanged) ───

export async function getAllEquipment(): Promise<SRDEquipmentSummary[]> {
  const data = await fetchSRD<{ results: SRDEquipmentSummary[] }>('/equipment')
  return data.results
}

export async function getEquipmentDetail(equipmentIndex: string): Promise<SRDEquipmentDetail> {
  return fetchSRD<SRDEquipmentDetail>(`/equipment/${equipmentIndex}`)
}

export async function getEquipmentByCategory(categoryIndex: string): Promise<SRDEquipmentSummary[]> {
  const data = await fetchSRD<{ equipment: SRDEquipmentSummary[] }>(
    `/equipment-categories/${categoryIndex}`
  )
  return data.equipment
}

// ─── Magic Item API Functions (Open5e — more items: 1600+ vs 6) ───

const magicItemDetailCache = new Map<string, Open5eMagicItem>()

export async function getAllMagicItems(): Promise<SRDMagicItemSummary[]> {
  const url = `${OPEN5E_URL}/magicitems/?format=json&limit=10000&document__slug=wotc-srd`
  const data = await fetchOpen5e<Open5ePaginatedResponse<Open5eMagicItem>>(url)
  const unique = dedup(data.results)
  for (const item of unique) {
    magicItemDetailCache.set(item.slug, item)
  }
  return unique.map((item) => ({
    index: item.slug,
    name: item.name,
    url: '',
  }))
}

export async function getMagicItemDetail(itemIndex: string): Promise<SRDMagicItemDetail> {
  // Check cache first
  const cached = magicItemDetailCache.get(itemIndex)
  if (cached) {
    return mapMagicItemDetail(cached)
  }
  const url = `${OPEN5E_URL}/magicitems/${itemIndex}/?format=json`
  const item = await fetchOpen5e<Open5eMagicItem>(url)
  magicItemDetailCache.set(item.slug, item)
  return mapMagicItemDetail(item)
}

function mapMagicItemDetail(item: Open5eMagicItem): SRDMagicItemDetail {
  // Determine category from type
  const typeLower = item.type.toLowerCase()
  let catIndex = 'wondrous-items'
  if (typeLower.includes('potion')) catIndex = 'potion'
  else if (typeLower.includes('scroll')) catIndex = 'scroll'
  else if (typeLower.includes('weapon')) catIndex = 'weapon'
  else if (typeLower.includes('armor')) catIndex = 'armor'
  else if (typeLower.includes('ring')) catIndex = 'ring'
  else if (typeLower.includes('rod')) catIndex = 'rod'
  else if (typeLower.includes('staff')) catIndex = 'staff'
  else if (typeLower.includes('wand')) catIndex = 'wand'

  return {
    index: item.slug,
    name: item.name,
    equipment_category: { index: catIndex, name: item.type },
    rarity: { name: item.rarity },
    desc: item.desc ? item.desc.split('\n').filter(Boolean) : [],
    variant: false,
  }
}

// ─── Equipment Helpers (unchanged) ───

/** Map SRD equipment category to app inventory category */
export function mapEquipmentCategory(detail: SRDEquipmentDetail): string {
  const catIndex = detail.equipment_category.index
  if (catIndex === 'weapon' || detail.weapon_category) return 'weapon'
  if (catIndex === 'armor' || detail.armor_category) return 'armor'
  return 'gear'
}

/** Map SRD magic item category to app inventory category */
export function mapMagicItemCategory(detail: SRDMagicItemDetail): string {
  const catIndex = detail.equipment_category.index
  if (catIndex === 'potion' || catIndex === 'scroll') return 'consumable'
  return 'magic_item'
}

/** Build a description string from SRD equipment detail */
export function formatEquipmentDescription(detail: SRDEquipmentDetail): string {
  const parts: string[] = []

  if (detail.desc.length > 0) {
    parts.push(detail.desc.join('\n\n'))
  }

  if (detail.cost) {
    parts.push(`Cost: ${detail.cost.quantity} ${detail.cost.unit}`)
  }

  if (detail.armor_class) {
    let ac = `AC: ${detail.armor_class.base}`
    if (detail.armor_class.dex_bonus) {
      ac += detail.armor_class.max_bonus ? ` + DEX (max ${detail.armor_class.max_bonus})` : ' + DEX'
    }
    parts.push(ac)
  }

  if (detail.str_minimum && detail.str_minimum > 0) {
    parts.push(`Requires STR ${detail.str_minimum}`)
  }

  if (detail.stealth_disadvantage) {
    parts.push('Disadvantage on Stealth checks')
  }

  if (detail.two_handed_damage) {
    parts.push(`Two-handed: ${detail.two_handed_damage.damage_dice} ${detail.two_handed_damage.damage_type.name}`)
  }

  if (detail.range && detail.weapon_range === 'Ranged') {
    parts.push(`Range: ${detail.range.normal}${detail.range.long ? `/${detail.range.long}` : ''} ft`)
  }

  if (detail.special && detail.special.length > 0) {
    parts.push(detail.special.join('\n'))
  }

  return parts.join('\n')
}

// ─── Monster Types (exported — unchanged) ───

export interface SRDMonsterSummary {
  index: string
  name: string
  url: string
}

export interface SRDMonsterDetail {
  index: string
  name: string
  size: string
  type: string
  alignment: string
  armor_class: { type: string; value: number; desc?: string }[]
  hit_points: number
  hit_points_roll: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencies: { value: number; proficiency: { index: string; name: string } }[]
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: { index: string; name: string }[]
  senses: Record<string, string | number>
  languages: string
  challenge_rating: number
  proficiency_bonus: number
  xp: number
  special_abilities?: { name: string; desc: string; dc?: object; usage?: object }[]
  actions?: { name: string; desc: string; attack_bonus?: number; damage?: object[]; dc?: object; usage?: object }[]
  legendary_actions?: { name: string; desc: string; attack_bonus?: number; damage?: object[] }[]
  reactions?: { name: string; desc: string }[]
  legendary_desc?: string
  image?: string
}

// ─── Monster API Functions (Open5e V2 — SRD 5.2 / 2024 creatures) ───

/** Fetch the full 2024 SRD creature list once (cached) and warm the detail cache. */
async function fetchAllSrd2024Creatures(): Promise<Open5eCreatureV2[]> {
  const url = `${OPEN5E_V2_URL}/creatures/?format=json&limit=1000&document__key=${SRD_2024_DOC}`
  const data = await fetchOpen5e<Open5ePaginatedResponse<Open5eCreatureV2>>(url)
  for (const c of data.results) {
    monsterDetailCache.set(bareSpellSlug(c.key), c)
  }
  return data.results
}

export async function getAllMonsters(): Promise<SRDMonsterSummary[]> {
  const creatures = await fetchAllSrd2024Creatures()
  return creatures.map(mapMonsterSummary)
}

export async function getMonsterDetail(monsterIndex: string): Promise<SRDMonsterDetail> {
  // Check cache first (populated by list fetch)
  if (monsterDetailCache.has(monsterIndex)) {
    return mapMonsterDetail(monsterDetailCache.get(monsterIndex)!)
  }
  // Fallback to individual fetch against the 2024 SRD document
  const url = `${OPEN5E_V2_URL}/creatures/${SRD_2024_DOC}_${monsterIndex}/?format=json`
  const creature = await fetchOpen5e<Open5eCreatureV2>(url)
  monsterDetailCache.set(bareSpellSlug(creature.key), creature)
  return mapMonsterDetail(creature)
}

export async function getMonstersByCR(cr: number): Promise<SRDMonsterSummary[]> {
  const creatures = await fetchAllSrd2024Creatures()
  return creatures
    .filter((c) => parseCR(c.challenge_rating) === cr)
    .map(mapMonsterSummary)
}

/** Convert an SRD monster to an NPC insert shape for saving to the database */
export function srdMonsterToNpcInsert(
  monster: SRDMonsterDetail,
  userId: string,
  campaignId: string | null
) {
  return {
    user_id: userId,
    campaign_id: campaignId,
    name: monster.name,
    size: monster.size,
    type: monster.type,
    alignment: monster.alignment,
    armor_class: monster.armor_class[0]?.value ?? 10,
    armor_desc: monster.armor_class[0]?.desc ?? monster.armor_class[0]?.type ?? '',
    hit_points: monster.hit_points,
    hit_dice: monster.hit_points_roll,
    speed: monster.speed,
    strength: monster.strength,
    dexterity: monster.dexterity,
    constitution: monster.constitution,
    intelligence: monster.intelligence,
    wisdom: monster.wisdom,
    charisma: monster.charisma,
    saving_throws: monster.proficiencies
      .filter((p) => p.proficiency.index.startsWith('saving-throw-'))
      .map((p) => ({ name: p.proficiency.name.replace('Saving Throw: ', ''), value: p.value })),
    skills: monster.proficiencies
      .filter((p) => p.proficiency.index.startsWith('skill-'))
      .map((p) => ({ name: p.proficiency.name.replace('Skill: ', ''), value: p.value })),
    damage_vulnerabilities: monster.damage_vulnerabilities,
    damage_resistances: monster.damage_resistances,
    damage_immunities: monster.damage_immunities,
    condition_immunities: monster.condition_immunities.map((ci) => ci.name),
    senses: Object.entries(monster.senses).map(([k, v]) => `${k}: ${v}`).join(', '),
    languages: monster.languages,
    challenge_rating: monster.challenge_rating,
    proficiency_bonus: monster.proficiency_bonus,
    special_abilities: (monster.special_abilities ?? []) as import('@/lib/types/database').NpcAbilityAction[],
    actions: (monster.actions ?? []) as import('@/lib/types/database').NpcAbilityAction[],
    reactions: (monster.reactions ?? []) as import('@/lib/types/database').NpcAbilityAction[],
    legendary_actions: (monster.legendary_actions ?? []) as import('@/lib/types/database').NpcAbilityAction[],
    legendary_desc: monster.legendary_desc ?? '',
    source: 'srd-modified' as const,
    srd_index: monster.index,
    notes: '',
  }
}

// ─── Helpers (unchanged) ───

export function formatSpellComponents(components: string[], material?: string): string {
  const abbrev = components.join(', ')
  if (material) return `${abbrev} (${material})`
  return abbrev
}

export function formatSpellDescription(desc: string[]): string {
  return desc.join('\n\n')
}

export function getSpellSlotsByLevel(spellcasting: SRDClassLevel['spellcasting']): { level: number; slots: number }[] {
  if (!spellcasting) return []
  const slots: { level: number; slots: number }[] = []
  for (let i = 1; i <= 9; i++) {
    const key = `spell_slots_level_${i}` as keyof typeof spellcasting
    const count = spellcasting[key] as number
    if (count > 0) {
      slots.push({ level: i, slots: count })
    }
  }
  return slots
}

/** Compare two class levels and return new spell slots gained */
export function getNewSpellSlots(
  prevSpellcasting: SRDClassLevel['spellcasting'],
  newSpellcasting: SRDClassLevel['spellcasting']
): { level: number; total: number; gained: number }[] {
  if (!newSpellcasting) return []
  const changes: { level: number; total: number; gained: number }[] = []
  for (let i = 1; i <= 9; i++) {
    const key = `spell_slots_level_${i}` as keyof typeof newSpellcasting
    const newCount = newSpellcasting[key] as number
    const prevCount = prevSpellcasting ? (prevSpellcasting[key] as number) : 0
    if (newCount > 0) {
      changes.push({ level: i, total: newCount, gained: newCount - prevCount })
    }
  }
  return changes
}

/** Get the hit die for a class */
export const CLASS_HIT_DICE: Record<string, number> = {
  artificer: 8,
  barbarian: 12,
  bard: 8,
  cleric: 8,
  barriomancer: 10,
  'dragon-rider': 10,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
}

/* ── Encounter Difficulty ── */

const XP_THRESHOLDS: Record<number, [number, number, number, number]> = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
}

function encounterMultiplier(monsterCount: number): number {
  if (monsterCount <= 1) return 1
  if (monsterCount === 2) return 1.5
  if (monsterCount <= 6) return 2
  if (monsterCount <= 10) return 2.5
  if (monsterCount <= 14) return 3
  return 4
}

export type DifficultyRating = 'Easy' | 'Medium' | 'Hard' | 'Deadly'

export function calculateEncounterDifficulty(
  partyLevels: number[],
  monsterCRs: number[]
): { difficulty: DifficultyRating; adjustedXP: number; thresholds: Record<DifficultyRating, number> } {
  const totalXP = monsterCRs.reduce((sum, cr) => sum + crToXP(cr), 0)
  const adjustedXP = Math.round(totalXP * encounterMultiplier(monsterCRs.length))

  const thresholds: Record<DifficultyRating, number> = { Easy: 0, Medium: 0, Hard: 0, Deadly: 0 }
  for (const level of partyLevels) {
    const t = XP_THRESHOLDS[Math.min(20, Math.max(1, level))] ?? XP_THRESHOLDS[1]
    thresholds.Easy += t[0]
    thresholds.Medium += t[1]
    thresholds.Hard += t[2]
    thresholds.Deadly += t[3]
  }

  let difficulty: DifficultyRating = 'Easy'
  if (adjustedXP >= thresholds.Deadly) difficulty = 'Deadly'
  else if (adjustedXP >= thresholds.Hard) difficulty = 'Hard'
  else if (adjustedXP >= thresholds.Medium) difficulty = 'Medium'

  return { difficulty, adjustedXP, thresholds }
}
