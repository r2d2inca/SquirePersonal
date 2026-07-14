import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { CharacterExportEnvelope } from './characterExport'

const ProficienciesSchema = z.object({
  skills: z.array(z.string()),
  savingThrows: z.array(z.string()),
  languages: z.array(z.string()),
  tools: z.array(z.string()),
  weapons: z.array(z.string()),
  armor: z.array(z.string()),
  expertise: z.array(z.string()).optional(),
  weaponMasteries: z.array(z.string()).optional(),
})

const FeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  usesMax: z.number().optional(),
  usesRemaining: z.number().optional(),
  rechargeOn: z.enum(['short_rest', 'long_rest']).optional(),
})

const CharacterSchema = z.object({
  is_active: z.boolean(),
  name: z.string().min(1),
  race: z.string(),
  class: z.string(),
  subclass: z.string().nullable(),
  level: z.number().min(1).max(20),
  background: z.string().nullable(),
  alignment: z.string().nullable(),
  experience_points: z.number(),
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
  max_hp: z.number().min(1),
  current_hp: z.number().min(0),
  temp_hp: z.number().min(0),
  armor_class: z.number(),
  initiative_bonus: z.number(),
  speed: z.number(),
  hit_dice_total: z.string(),
  hit_dice_remaining: z.number(),
  death_save_successes: z.number(),
  death_save_failures: z.number(),
  proficiencies: ProficienciesSchema,
  features: z.array(FeatureSchema),
  copper: z.number(),
  silver: z.number(),
  electrum: z.number(),
  gold: z.number(),
  platinum: z.number(),
  personality_traits: z.string(),
  ideals: z.string(),
  bonds: z.string(),
  flaws: z.string(),
  appearance: z.string(),
  backstory: z.string(),
  heroic_inspiration: z.boolean().optional(),
  spellcasting_ability: z.string().nullable(),
  spell_save_dc: z.number().nullable(),
  spell_attack_bonus: z.number().nullable(),
})

const SpellSchema = z.object({
  name: z.string(),
  level: z.number(),
  school: z.string(),
  casting_time: z.string(),
  range: z.string(),
  components: z.string(),
  duration: z.string(),
  is_concentration: z.boolean(),
  is_ritual: z.boolean(),
  is_prepared: z.boolean(),
  description: z.string(),
  higher_levels: z.string(),
  source: z.string(),
})

const SpellSlotSchema = z.object({
  slot_level: z.number(),
  total: z.number(),
  expended: z.number(),
})

const InventoryItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  weight: z.number(),
  description: z.string(),
  is_equipped: z.boolean(),
  is_attuned: z.boolean(),
  damage: z.string().nullable(),
  weapon_properties: z.string().nullable(),
  armor_bonus: z.number().nullable(),
  ac_ability_score: z.string().nullable().optional(),
  max_ability_modifier: z.number().nullable().optional(),
  ac_bonus: z.number().nullable().optional(),
  sort_order: z.number(),
})

const ActiveEffectSchema = z.object({
  name: z.string(),
  effect_type: z.string(),
  description: z.string(),
  is_concentration: z.boolean(),
  duration: z.string(),
  source: z.string(),
})

const ImportEnvelopeSchema = z.object({
  _meta: z.object({
    version: z.number(),
    app: z.literal('squire'),
    exportedAt: z.string(),
  }),
  character: CharacterSchema,
  spells: z.array(SpellSchema),
  spellSlots: z.array(SpellSlotSchema),
  inventoryItems: z.array(InventoryItemSchema),
  activeEffects: z.array(ActiveEffectSchema),
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
      _meta: { version: 1, app: 'squire', exportedAt: new Date().toISOString() },
      character: char,
      spells,
      spellSlots: parsed.spellSlots,
      inventoryItems: items,
      activeEffects: effects,
    } as unknown as CharacterExportEnvelope,
  }
}

export async function importCharacter(
  userId: string,
  data: CharacterExportEnvelope,
  existingCharacterId?: string,
): Promise<string> {
  // Archive existing character
  if (existingCharacterId) {
    await supabase.from('characters').update({ is_active: false }).eq('id', existingCharacterId)
  }

  // Insert new character
  const { data: newChar, error: charError } = await supabase
    .from('characters')
    .insert({
      ...data.character,
      user_id: userId,
      is_active: true,
      portrait_url: null,
    })
    .select()
    .single()
  if (charError) throw new Error(`Failed to create character: ${charError.message}`)

  const characterId = newChar.id

  // Insert related data
  if (data.spells.length > 0) {
    const { error } = await supabase.from('spells').insert(
      data.spells.map(s => ({ ...s, character_id: characterId }))
    )
    if (error) throw new Error(`Failed to insert spells: ${error.message}`)
  }

  if (data.spellSlots.length > 0) {
    const { error } = await supabase.from('spell_slots').insert(
      data.spellSlots.map(s => ({ ...s, character_id: characterId }))
    )
    if (error) throw new Error(`Failed to insert spell slots: ${error.message}`)
  }

  if (data.inventoryItems.length > 0) {
    const { error } = await supabase.from('inventory_items').insert(
      data.inventoryItems.map(i => ({ ...i, character_id: characterId }))
    )
    if (error) throw new Error(`Failed to insert inventory: ${error.message}`)
  }

  if (data.activeEffects.length > 0) {
    const { error } = await supabase.from('active_effects').insert(
      data.activeEffects.map(e => ({ ...e, character_id: characterId }))
    )
    if (error) throw new Error(`Failed to insert effects: ${error.message}`)
  }
  return characterId
}
