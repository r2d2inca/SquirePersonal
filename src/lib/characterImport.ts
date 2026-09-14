import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { EXPORT_VERSION } from './characterExport'
import type {
  CharacterExportEnvelope, ExportedCharacter, ExportedSpell, ExportedSpellSlot, ExportedInventoryItem,
  ExportedActiveEffect, ExportedNote, ExportedLoreEntry, ExportedSessionLog,
} from './characterExport'

// Nullability mirrors the database columns (not the stricter TS types), so anything a real
// saved character can contain validates and round-trips instead of being rejected.
const text = z.string().nullable()
const num = z.number().nullable()
const timestamp = z.string().optional()

// JSONB columns are free-form: loose objects keep any keys beyond the ones checked here.
const ProficienciesSchema = z.looseObject({
  skills: z.array(z.string()),
  savingThrows: z.array(z.string()),
  languages: z.array(z.string()),
  tools: z.array(z.string()),
  weapons: z.array(z.string()),
  armor: z.array(z.string()),
  expertise: z.array(z.string()).optional(),
  weaponMasteries: z.array(z.string()).optional(),
})

const FeatureSchema = z.looseObject({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  usesMax: z.number().optional(),
  usesRemaining: z.number().optional(),
  rechargeOn: z.string().optional(),
})

const CharacterSchema = z.object({
  is_active: z.boolean(),
  name: z.string().min(1),
  race: z.string(),
  class: z.string(),
  subclass: text,
  level: z.number().min(1).max(20),
  background: text,
  alignment: text,
  experience_points: num,
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
  max_hp: z.number(),
  current_hp: z.number(),
  temp_hp: z.number(),
  armor_class: z.number(),
  initiative_bonus: num,
  speed: num,
  hit_dice_total: text,
  hit_dice_remaining: num,
  death_save_successes: num,
  death_save_failures: num,
  proficiencies: ProficienciesSchema,
  features: z.array(FeatureSchema),
  copper: num,
  silver: num,
  electrum: num,
  gold: num,
  platinum: num,
  personality_traits: text,
  ideals: text,
  bonds: text,
  flaws: text,
  appearance: text,
  backstory: text,
  heroic_inspiration: z.boolean().nullable().optional(),
  spellcasting_ability: text,
  spell_save_dc: num,
  spell_attack_bonus: num,
  created_at: timestamp,
  updated_at: timestamp,
})

const SpellSchema = z.object({
  name: z.string(),
  level: z.number(),
  school: text,
  casting_time: text,
  range: text,
  components: text,
  duration: text,
  is_concentration: z.boolean(),
  is_ritual: z.boolean(),
  is_prepared: z.boolean(),
  description: z.string(),
  higher_levels: text,
  source: text,
  created_at: timestamp,
})

const SpellSlotSchema = z.object({
  slot_level: z.number(),
  total: z.number(),
  expended: z.number(),
})

const InventoryItemSchema = z.object({
  name: z.string(),
  category: text,
  quantity: z.number(),
  weight: num,
  description: text,
  is_equipped: z.boolean(),
  is_attuned: z.boolean(),
  damage: text,
  weapon_properties: text,
  armor_bonus: num,
  // Columns added after the first export format — optional so older files still import.
  ac_ability_score: text.optional(),
  max_ability_modifier: num.optional(),
  ac_bonus: num.optional(),
  charges_max: num.optional(),
  charges_remaining: num.optional(),
  recharge_type: text.optional(),
  sort_order: num,
  created_at: timestamp,
})

const ActiveEffectSchema = z.object({
  name: z.string(),
  effect_type: text,
  description: text,
  is_concentration: z.boolean(),
  duration: text,
  source: text,
  ac_modifier: z.number().optional(),
  modifiers: z.looseObject({}).optional(),
  created_at: timestamp,
})

const NoteSchema = z.object({
  title: z.string(),
  content: z.string(),
  is_pinned: z.boolean(),
  sort_order: num,
  created_at: timestamp,
  updated_at: timestamp,
})

const LoreEntrySchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).nullable(),
  is_pinned: z.boolean(),
  related_entries: z.array(z.string()).nullable(),
  created_at: timestamp,
  updated_at: timestamp,
})

const SessionLogSchema = z.object({
  session_number: num,
  title: z.string(),
  summary: z.string(),
  date_played: text,
  notable_events: text,
  created_at: timestamp,
  updated_at: timestamp,
})

/**
 * Compile-time guard: every exported field must have an import schema entry and vice versa.
 * Adding a column to a type in database.ts without updating these schemas fails the build,
 * which is what keeps new fields from being silently dropped on import again.
 */
type SameKeys<A, B> = [keyof A] extends [keyof B] ? ([keyof B] extends [keyof A] ? true : false) : false
type Assert<T extends true> = T
export type ImportSchemaCoverage = [
  Assert<SameKeys<z.infer<typeof CharacterSchema>, ExportedCharacter>>,
  Assert<SameKeys<z.infer<typeof SpellSchema>, ExportedSpell>>,
  Assert<SameKeys<z.infer<typeof SpellSlotSchema>, ExportedSpellSlot>>,
  Assert<SameKeys<z.infer<typeof InventoryItemSchema>, ExportedInventoryItem>>,
  Assert<SameKeys<z.infer<typeof ActiveEffectSchema>, ExportedActiveEffect>>,
  Assert<SameKeys<z.infer<typeof NoteSchema>, ExportedNote>>,
  Assert<SameKeys<z.infer<typeof LoreEntrySchema>, ExportedLoreEntry>>,
  Assert<SameKeys<z.infer<typeof SessionLogSchema>, ExportedSessionLog>>,
]

const ImportEnvelopeSchema = z.object({
  _meta: z.object({
    version: z.number().max(EXPORT_VERSION, 'This file was exported from a newer version of Squire'),
    app: z.literal('squire'),
    exportedAt: z.string(),
  }),
  character: CharacterSchema,
  portrait: z.string().startsWith('data:image/').nullable().default(null),
  spells: z.array(SpellSchema),
  spellSlots: z.array(SpellSlotSchema),
  inventoryItems: z.array(InventoryItemSchema),
  activeEffects: z.array(ActiveEffectSchema),
  // Not present in v1 exports.
  notes: z.array(NoteSchema).default([]),
  loreEntries: z.array(LoreEntrySchema).default([]),
  sessionLogs: z.array(SessionLogSchema).default([]),
})

// Looser schema for PDF-parsed data (Claude may not get everything perfect)
const PdfImportCharacterSchema = CharacterSchema.partial().required({
  name: true,
  race: true,
  class: true,
  level: true,
  strength: true,
  dexterity: true,
  constitution: true,
  intelligence: true,
  wisdom: true,
  charisma: true,
  max_hp: true,
})

const PdfImportEnvelopeSchema = z.object({
  character: PdfImportCharacterSchema,
  spells: z.array(SpellSchema.partial().required({ name: true, level: true })).optional().default([]),
  spellSlots: z.array(SpellSlotSchema).optional().default([]),
  inventoryItems: z.array(InventoryItemSchema.partial().required({ name: true })).optional().default([]),
  activeEffects: z.array(ActiveEffectSchema.partial().required({ name: true })).optional().default([]),
})

export type ImportValidationResult =
  | { success: true; data: CharacterExportEnvelope }
  | { success: false; errors: string[] }

export function validateImportData(raw: unknown): ImportValidationResult {
  const result = ImportEnvelopeSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data as unknown as CharacterExportEnvelope }
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  return { success: false, errors }
}

export function validatePdfImportData(raw: unknown): ImportValidationResult {
  const result = PdfImportEnvelopeSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { success: false, errors }
  }

  // Fill defaults for partial character data
  const parsed = result.data
  const char = {
    is_active: true,
    subclass: null,
    background: null,
    alignment: null,
    experience_points: 0,
    current_hp: parsed.character.max_hp,
    temp_hp: 0,
    armor_class: 10,
    initiative_bonus: 0,
    speed: 30,
    hit_dice_total: `${parsed.character.level}d8`,
    hit_dice_remaining: parsed.character.level,
    death_save_successes: 0,
    death_save_failures: 0,
    proficiencies: { skills: [], savingThrows: [], languages: [], tools: [], weapons: [], armor: [] },
    features: [],
    copper: 0,
    silver: 0,
    electrum: 0,
    gold: 0,
    platinum: 0,
    personality_traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    appearance: '',
    backstory: '',
    spellcasting_ability: null,
    spell_save_dc: null,
    spell_attack_bonus: null,
    ...parsed.character,
  }

  const spells = parsed.spells.map(s => ({
    school: '',
    casting_time: '',
    range: '',
    components: '',
    duration: '',
    is_concentration: false,
    is_ritual: false,
    is_prepared: true,
    description: '',
    higher_levels: '',
    source: '',
    ...s,
  }))

  const items = parsed.inventoryItems.map((it, i) => ({
    category: 'gear',
    quantity: 1,
    weight: 0,
    description: '',
    is_equipped: false,
    is_attuned: false,
    damage: null,
    weapon_properties: null,
    armor_bonus: null,
    sort_order: i,
    ...it,
  }))

  const effects = parsed.activeEffects.map(e => ({
    effect_type: 'buff',
    description: '',
    is_concentration: false,
    duration: '',
    source: '',
    ...e,
  }))

  return {
    success: true,
    data: {
      _meta: { version: EXPORT_VERSION, app: 'squire', exportedAt: new Date().toISOString() },
      character: char,
      portrait: null,
      spells,
      spellSlots: parsed.spellSlots,
      inventoryItems: items,
      activeEffects: effects,
      notes: [],
      loreEntries: [],
      sessionLogs: [],
    } as unknown as CharacterExportEnvelope,
  }
}

const PORTRAIT_BUCKET = 'character-portraits'

async function uploadPortrait(userId: string, characterId: string, dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg').replace(/\+.*/, '') || 'png'
  const path = `${userId}/${characterId}.${ext}`
  const { error } = await supabase.storage
    .from(PORTRAIT_BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type })
  if (error) throw new Error(`Failed to upload portrait: ${error.message}`)
  return { path, url: supabase.storage.from(PORTRAIT_BUCKET).getPublicUrl(path).data.publicUrl }
}

async function insertRows(table: string, label: string, rows: object[]) {
  if (rows.length === 0) return
  const { error } = await supabase.from(table).insert(rows)
  if (error) throw new Error(`Failed to insert ${label}: ${error.message}`)
}

/**
 * Creates a new character from an export, including notes, lore, session logs and portrait.
 * The new character stays inactive until every row is written, and only then replaces the
 * user's active character — so a failed import leaves the current character untouched.
 */
export async function importCharacter(userId: string, data: CharacterExportEnvelope): Promise<string> {
  const { data: previouslyActive, error: activeError } = await supabase
    .from('characters').select('id').eq('user_id', userId).eq('is_active', true)
  if (activeError) throw new Error(`Failed to check current character: ${activeError.message}`)
  const previousIds: string[] = (previouslyActive ?? []).map((c: { id: string }) => c.id)

  const characterId = crypto.randomUUID()
  let characterInserted = false
  let portraitPath: string | null = null
  let previousDeactivated = false

  try {
    let portraitUrl: string | null = null
    if (data.portrait) {
      const uploaded = await uploadPortrait(userId, characterId, data.portrait)
      portraitPath = uploaded.path
      portraitUrl = uploaded.url
    }

    const { error: charError } = await supabase.from('characters').insert({
      ...data.character,
      id: characterId,
      user_id: userId,
      is_active: false,
      portrait_url: portraitUrl,
    })
    if (charError) throw new Error(`Failed to create character: ${charError.message}`)
    characterInserted = true

    const owned = { character_id: characterId }
    const ownedByUser = { user_id: userId, character_id: characterId }

    // Lore entries get fresh ids; links between entries are remapped to match.
    const loreIds = new Map(data.loreEntries.map(l => [l.id, crypto.randomUUID()]))
    const loreRows = data.loreEntries.map(l => ({
      ...l,
      ...ownedByUser,
      id: loreIds.get(l.id),
      related_entries: l.related_entries?.flatMap(id => loreIds.get(id) ?? []) ?? null,
    }))

    await insertRows('spells', 'spells', data.spells.map(s => ({ ...s, ...owned })))
    await insertRows('spell_slots', 'spell slots', data.spellSlots.map(s => ({ ...s, ...owned })))
    await insertRows('inventory_items', 'inventory', data.inventoryItems.map(i => ({ ...i, ...owned })))
    await insertRows('active_effects', 'effects', data.activeEffects.map(e => ({ ...e, ...owned })))
    await insertRows('notes', 'notes', data.notes.map(n => ({ ...n, ...ownedByUser })))
    await insertRows('lore_entries', 'lore entries', loreRows)
    await insertRows('session_logs', 'session logs', data.sessionLogs.map(s => ({ ...s, ...ownedByUser })))

    if (previousIds.length > 0) {
      const { error } = await supabase.from('characters').update({ is_active: false }).in('id', previousIds)
      if (error) throw new Error(`Failed to archive current character: ${error.message}`)
      previousDeactivated = true
    }
    const { error: activateError } = await supabase
      .from('characters').update({ is_active: true }).eq('id', characterId)
    if (activateError) throw new Error(`Failed to activate imported character: ${activateError.message}`)
  } catch (err) {
    await rollbackImport({ characterId, characterInserted, portraitPath, previousIds, previousDeactivated })
    throw err
  }

  return characterId
}

/** Best-effort cleanup of a partially written import. Errors are logged, not thrown. */
async function rollbackImport(state: {
  characterId: string
  characterInserted: boolean
  portraitPath: string | null
  previousIds: string[]
  previousDeactivated: boolean
}) {
  const steps: PromiseLike<{ error: { message: string } | null }>[] = []
  if (state.characterInserted) {
    // Notes, lore and session logs are ON DELETE SET NULL, so remove them explicitly;
    // spells, slots, items and effects cascade with the character.
    for (const table of ['notes', 'lore_entries', 'session_logs']) {
      steps.push(supabase.from(table).delete().eq('character_id', state.characterId))
    }
  }
  for (const { error } of await Promise.all(steps)) {
    if (error) console.error('Import rollback:', error.message)
  }

  if (state.characterInserted) {
    const { error } = await supabase.from('characters').delete().eq('id', state.characterId)
    if (error) console.error('Import rollback:', error.message)
  }
  if (state.portraitPath) {
    const { error } = await supabase.storage.from(PORTRAIT_BUCKET).remove([state.portraitPath])
    if (error) console.error('Import rollback:', error.message)
  }
  if (state.previousDeactivated) {
    const { error } = await supabase.from('characters').update({ is_active: true }).in('id', state.previousIds)
    if (error) console.error('Import rollback:', error.message)
  }
}
