import type { Character, Spell, SpellSlot, InventoryItem, ActiveEffect } from '@/lib/types/database'

export interface CharacterExportEnvelope {
  _meta: {
    version: 1
    app: 'squire'
    exportedAt: string
  }
  character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  spells: Omit<Spell, 'id' | 'character_id' | 'created_at'>[]
  spellSlots: Omit<SpellSlot, 'id' | 'character_id'>[]
  inventoryItems: Omit<InventoryItem, 'id' | 'character_id' | 'created_at'>[]
  activeEffects: Omit<ActiveEffect, 'id' | 'character_id' | 'created_at'>[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripFields(obj: any, fields: string[]) {
  const result = { ...obj }
  for (const f of fields) delete result[f]
  return result
}

export function buildExportEnvelope(
  character: Character,
  spells: Spell[],
  spellSlots: SpellSlot[],
  items: InventoryItem[],
  effects: ActiveEffect[],
): CharacterExportEnvelope {
  return {
    _meta: { version: 1, app: 'squire', exportedAt: new Date().toISOString() },
    character: stripFields(character, ['id', 'user_id', 'created_at', 'updated_at', 'portrait_url']) as CharacterExportEnvelope['character'],
    spells: spells.map(s => stripFields(s, ['id', 'character_id', 'created_at']) as CharacterExportEnvelope['spells'][number]),
    spellSlots: spellSlots.map(s => stripFields(s, ['id', 'character_id']) as CharacterExportEnvelope['spellSlots'][number]),
    inventoryItems: items.map(i => stripFields(i, ['id', 'character_id', 'created_at']) as CharacterExportEnvelope['inventoryItems'][number]),
    activeEffects: effects.map(e => stripFields(e, ['id', 'character_id', 'created_at']) as CharacterExportEnvelope['activeEffects'][number]),
  }
}

export function downloadCharacterJSON(
  character: Character,
  spells: Spell[],
  spellSlots: SpellSlot[],
  items: InventoryItem[],
  effects: ActiveEffect[],
) {
  const envelope = buildExportEnvelope(character, spells, spellSlots, items, effects)
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${character.name.replace(/[^a-zA-Z0-9]/g, '-')}-squire-export.json`
  a.click()
  URL.revokeObjectURL(url)
}
