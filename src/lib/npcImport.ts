import type { Npc, NpcInsert, NpcAbilityAction, NpcUpdate } from '@/lib/types/database'

/**
 * Everything the NPC form can be pre-filled with. Same as an NpcInsert minus
 * ownership, which the form adds when it saves.
 */
export type NpcDraft = Omit<NpcInsert, 'user_id' | 'campaign_id'>

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const SAVE_NAMES: Record<string, string> = {
  str: 'STR', strength: 'STR', dex: 'DEX', dexterity: 'DEX', con: 'CON', constitution: 'CON',
  int: 'INT', intelligence: 'INT', wis: 'WIS', wisdom: 'WIS', cha: 'CHA', charisma: 'CHA',
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.includes('/')) {
      const [a, b] = t.split('/')
      const n = Number(a) / Number(b)
      if (Number.isFinite(n)) return n
    }
    const n = parseFloat(t)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function strList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => str(x)).map((x) => x.trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(/[,;]/).map((x) => x.trim()).filter(Boolean)
  return []
}

function bonusList(v: unknown, normalizeName: (n: string) => string): { name: string; value: number }[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (x && typeof x === 'object') {
          const o = x as Record<string, unknown>
          return { name: normalizeName(str(o.name)), value: num(o.value) }
        }
        return null
      })
      .filter((x): x is { name: string; value: number } => !!x && !!x.name)
  }
  // Also accept { "DEX": 5, "Stealth": 7 } maps.
  if (v && typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>).map(([name, value]) => ({ name: normalizeName(name), value: num(value) })).filter((x) => x.name)
  }
  return []
}

function actionList(v: unknown): NpcAbilityAction[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => {
      if (!x || typeof x !== 'object') return null
      const o = x as Record<string, unknown>
      const name = str(o.name).trim()
      const desc = str(o.desc ?? o.description).trim()
      if (!name) return null
      return { name, desc }
    })
    .filter((x): x is NpcAbilityAction => !!x)
}

export function speedMap(v: unknown): Record<string, string> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, string> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const s = str(val).trim()
      if (s) out[k] = /ft/.test(s) ? s : `${s} ft.`
    }
    return Object.keys(out).length ? out : { walk: '30 ft.' }
  }
  if (typeof v === 'string' && v.trim()) {
    // "30 ft., fly 60 ft." style
    const out: Record<string, string> = {}
    for (const part of v.split(',')) {
      const m = part.trim().match(/^(\w+)?\s*(\d+\s*ft\.?.*)$/i)
      if (m) out[(m[1] ?? 'walk').toLowerCase()] = m[2].trim()
    }
    return Object.keys(out).length ? out : { walk: v.trim() }
  }
  return { walk: '30 ft.' }
}

function pbFromCr(cr: number): number {
  if (cr >= 29) return 9
  if (cr >= 25) return 8
  if (cr >= 21) return 7
  if (cr >= 17) return 6
  if (cr >= 13) return 5
  if (cr >= 9) return 4
  if (cr >= 5) return 3
  return 2
}

/**
 * Coerce anything that looks like a stat block (AI output, our own export,
 * a hand-written JSON) into a clean NpcDraft. Never throws on bad fields;
 * only a missing name is fatal because the form requires one.
 */
export function normalizeNpcDraft(raw: unknown): NpcDraft {
  if (!raw || typeof raw !== 'object') throw new Error('Stat block JSON must be an object')
  const o = raw as Record<string, unknown>
  const name = str(o.name).trim()
  if (!name) throw new Error('Stat block has no name')

  const sizeRaw = str(o.size, 'Medium')
  const size = SIZES.find((s) => s.toLowerCase() === sizeRaw.toLowerCase()) ?? 'Medium'
  const cr = Math.max(0, num(o.challenge_rating ?? o.cr))

  // armor_class may arrive as the SRD array shape; take the first entry.
  let ac = o.armor_class
  let acDesc = str(o.armor_desc)
  if (Array.isArray(ac)) {
    const first = ac[0] as Record<string, unknown> | undefined
    acDesc = acDesc || str(first?.desc ?? first?.type)
    ac = first?.value
  }

  const legendary = actionList(o.legendary_actions)
  return {
    name,
    size,
    type: str(o.type, 'Humanoid').trim() || 'Humanoid',
    alignment: str(o.alignment).trim(),
    armor_class: Math.round(num(ac, 10)),
    armor_desc: acDesc.trim(),
    hit_points: Math.max(1, Math.round(num(o.hit_points, 10))),
    hit_dice: str(o.hit_dice ?? o.hit_points_roll).trim(),
    speed: speedMap(o.speed),
    strength: Math.round(num(o.strength, 10)),
    dexterity: Math.round(num(o.dexterity, 10)),
    constitution: Math.round(num(o.constitution, 10)),
    intelligence: Math.round(num(o.intelligence, 10)),
    wisdom: Math.round(num(o.wisdom, 10)),
    charisma: Math.round(num(o.charisma, 10)),
    saving_throws: bonusList(o.saving_throws, (n) => SAVE_NAMES[n.toLowerCase().replace(/^saving throw:\s*/i, '')] ?? n.toUpperCase().slice(0, 3)),
    skills: bonusList(o.skills, (n) => n.replace(/^skill:\s*/i, '').trim()),
    damage_vulnerabilities: strList(o.damage_vulnerabilities),
    damage_resistances: strList(o.damage_resistances),
    damage_immunities: strList(o.damage_immunities),
    condition_immunities: strList(o.condition_immunities),
    senses: typeof o.senses === 'object' && o.senses
      ? Object.entries(o.senses as Record<string, unknown>).map(([k, v]) => `${k.replace(/_/g, ' ')} ${str(v)}`).join(', ')
      : str(o.senses).trim(),
    languages: str(o.languages).trim(),
    challenge_rating: cr,
    proficiency_bonus: Math.round(num(o.proficiency_bonus, pbFromCr(cr))) || pbFromCr(cr),
    special_abilities: actionList(o.special_abilities ?? o.traits),
    actions: actionList(o.actions),
    reactions: actionList(o.reactions),
    legendary_actions: legendary,
    legendary_desc: legendary.length ? str(o.legendary_desc).trim() : '',
    source: 'custom',
    srd_index: null,
    notes: str(o.notes).trim(),
  }
}

/* ── Export / import of Squire NPC JSON ── */

export const NPC_EXPORT_VERSION = 1

export interface NpcExportFile {
  _meta: { app: 'squire'; kind: 'npc'; version: number; exported_at: string }
  npc: NpcDraft
}

export function exportNpc(npc: Npc): NpcExportFile {
  const { id: _id, user_id: _u, campaign_id: _c, created_at: _ca, updated_at: _ua, ...rest } = npc
  void _id; void _u; void _c; void _ca; void _ua
  return {
    _meta: { app: 'squire', kind: 'npc', version: NPC_EXPORT_VERSION, exported_at: new Date().toISOString() },
    npc: rest,
  }
}

export function downloadNpcJson(npc: Npc) {
  const blob = new Blob([JSON.stringify(exportNpc(npc), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${npc.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'npc'}.squire-npc.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Accepts our export envelope, a bare NPC row, or any stat-block-ish object. */
export function parseNpcJson(text: string): NpcDraft {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON')
  }
  if (data && typeof data === 'object' && 'npc' in (data as object)) {
    return normalizeNpcDraft((data as { npc: unknown }).npc)
  }
  return normalizeNpcDraft(data)
}

/* ── Client call to the parse/generate endpoint ── */

export async function requestStatBlock(input: {
  mode: 'parse' | 'generate'
  text?: string
  file?: File
  context?: string
}): Promise<NpcDraft> {
  const body: Record<string, unknown> = { mode: input.mode, text: input.text, context: input.context }

  if (input.file) {
    const base64 = await fileToBase64(input.file)
    if (input.file.type === 'application/pdf') {
      body.pdf = base64
    } else if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(input.file.type)) {
      body.image = { data: base64, mediaType: input.file.type }
    } else {
      throw new Error('Upload a PDF or an image (PNG, JPEG, WebP, GIF)')
    }
  }

  const response = await fetch('/api/parse-stat-block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.details || data.error || 'Stat block request failed')
  }
  return normalizeNpcDraft(data)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Form → row. Shared by create and edit so the two can never drift. */
export function draftToUpdate(draft: NpcDraft): NpcUpdate {
  return { ...draft }
}
