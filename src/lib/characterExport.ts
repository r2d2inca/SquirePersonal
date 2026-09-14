import { supabase } from '@/lib/supabase'
import type {
  Character, Spell, SpellSlot, InventoryItem, ActiveEffect, Note, LoreEntry, SessionLog,
} from '@/lib/types/database'

/**
 * Current export format. v2 added notes, lore entries, session logs, the portrait, and row
 * timestamps (so ordering survives a round trip). v1 files still import — the new sections
 * are optional on the way in.
 */
export const EXPORT_VERSION = 2

/** Row fields that belong to one database/user and are re-assigned on import. */
type Owned<T, Extra extends keyof T = never> = Omit<T, 'id' | 'user_id' | 'character_id' | Extra>
/** Timestamps are exported but optional on import (v1 files don't carry them). */
type Timestamps<T> = { [K in Extract<keyof T, 'created_at' | 'updated_at'>]?: T[K] }

export type ExportedCharacter = Omit<Owned<Character, 'portrait_url'>, 'created_at' | 'updated_at'> & Timestamps<Character>
export type ExportedSpell = Omit<Owned<Spell>, 'created_at'> & Timestamps<Spell>
export type ExportedSpellSlot = Owned<SpellSlot>
export type ExportedInventoryItem = Omit<Owned<InventoryItem>, 'created_at'> & Timestamps<InventoryItem>
export type ExportedActiveEffect = Omit<Owned<ActiveEffect>, 'created_at'> & Timestamps<ActiveEffect>
export type ExportedNote = Omit<Owned<Note>, 'created_at' | 'updated_at'> & Timestamps<Note>
/** Lore keeps its id so `related_entries` links can be remapped to the new ids on import. */
export type ExportedLoreEntry = Omit<LoreEntry, 'user_id' | 'character_id' | 'created_at' | 'updated_at'> & Timestamps<LoreEntry>
export type ExportedSessionLog = Omit<Owned<SessionLog>, 'created_at' | 'updated_at'> & Timestamps<SessionLog>

export interface CharacterExportEnvelope {
  _meta: {
    version: number
    app: 'squire'
    exportedAt: string
  }
  character: ExportedCharacter
  /** Portrait image as a data: URL, or null when the character has none. */
  portrait: string | null
  spells: ExportedSpell[]
  spellSlots: ExportedSpellSlot[]
  inventoryItems: ExportedInventoryItem[]
  activeEffects: ExportedActiveEffect[]
  notes: ExportedNote[]
  loreEntries: ExportedLoreEntry[]
  sessionLogs: ExportedSessionLog[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripFields(obj: any, fields: string[]) {
  const result = { ...obj }
  for (const f of fields) delete result[f]
  return result
}

const OWNERSHIP = ['id', 'user_id', 'character_id']

export interface CharacterExportSource {
  character: Character
  portrait: string | null
  spells: Spell[]
  spellSlots: SpellSlot[]
  items: InventoryItem[]
  effects: ActiveEffect[]
  notes: Note[]
  loreEntries: LoreEntry[]
  sessionLogs: SessionLog[]
}

export function buildExportEnvelope(src: CharacterExportSource): CharacterExportEnvelope {
  return {
    _meta: { version: EXPORT_VERSION, app: 'squire', exportedAt: new Date().toISOString() },
    character: stripFields(src.character, [...OWNERSHIP, 'portrait_url']),
    portrait: src.portrait,
    spells: src.spells.map(s => stripFields(s, OWNERSHIP)),
    spellSlots: src.spellSlots.map(s => stripFields(s, OWNERSHIP)),
    inventoryItems: src.items.map(i => stripFields(i, OWNERSHIP)),
    activeEffects: src.effects.map(e => stripFields(e, OWNERSHIP)),
    notes: src.notes.map(n => stripFields(n, OWNERSHIP)),
    loreEntries: src.loreEntries.map(l => stripFields(l, ['user_id', 'character_id'])),
    sessionLogs: src.sessionLogs.map(s => stripFields(s, OWNERSHIP)),
  }
}

async function fetchPortraitDataUrl(url: string): Promise<string> {
  // The portrait path is reused on re-upload (upsert), so skip any cached copy.
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Could not download portrait (HTTP ${response.status})`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read portrait image'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Reads the character and everything attached to it straight from the database, rather than
 * from sheet state, so the export reflects what is actually saved.
 */
export async function fetchCharacterExportSource(
  characterId: string,
): Promise<CharacterExportSource & { warnings: string[] }> {
  const { data: character, error: charError } = await supabase
    .from('characters').select('*').eq('id', characterId).single()
  if (charError) throw new Error(`Failed to load character: ${charError.message}`)

  const [spells, spellSlots, items, effects, notes, loreEntries, sessionLogs] = await Promise.all([
    supabase.from('spells').select('*').eq('character_id', characterId).order('created_at'),
    supabase.from('spell_slots').select('*').eq('character_id', characterId).order('slot_level'),
    supabase.from('inventory_items').select('*').eq('character_id', characterId).order('sort_order').order('created_at'),
    supabase.from('active_effects').select('*').eq('character_id', characterId).order('created_at'),
    supabase.from('notes').select('*').eq('character_id', characterId).order('created_at'),
    supabase.from('lore_entries').select('*').eq('character_id', characterId).order('created_at'),
    supabase.from('session_logs').select('*').eq('character_id', characterId).order('created_at'),
  ])
  const failed = [spells, spellSlots, items, effects, notes, loreEntries, sessionLogs].find(r => r.error)
  if (failed?.error) throw new Error(`Failed to load character data: ${failed.error.message}`)

  // A dead portrait link shouldn't block exporting everything else — report it instead.
  let portrait: string | null = null
  const warnings: string[] = []
  if (character.portrait_url) {
    try {
      portrait = await fetchPortraitDataUrl(character.portrait_url)
    } catch (err) {
      warnings.push(`Portrait was not included: ${err instanceof Error ? err.message : 'download failed'}`)
    }
  }

  return {
    warnings,
    character,
    portrait,
    spells: spells.data ?? [],
    spellSlots: spellSlots.data ?? [],
    items: items.data ?? [],
    effects: effects.data ?? [],
    notes: notes.data ?? [],
    loreEntries: loreEntries.data ?? [],
    sessionLogs: sessionLogs.data ?? [],
  }
}

/** Downloads the export file. Resolves with any non-fatal warnings (e.g. a missing portrait). */
export async function downloadCharacterJSON(characterId: string): Promise<string[]> {
  const { warnings, ...source } = await fetchCharacterExportSource(characterId)
  const envelope = buildExportEnvelope(source)
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${envelope.character.name.replace(/[^a-zA-Z0-9]/g, '-')}-squire-export.json`
  a.click()
  URL.revokeObjectURL(url)
  return warnings
}
