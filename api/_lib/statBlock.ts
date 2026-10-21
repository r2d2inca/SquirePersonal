import type Anthropic from '@anthropic-ai/sdk'

/**
 * Shared by the Vercel function (api/parse-stat-block.ts) and the Vite dev
 * middleware so both environments parse stat blocks identically.
 *
 * Output is the Squire `npcs` row shape minus ownership columns. The model is
 * told to keep damage/attack text inside `desc` as plain prose, which is how
 * SRD-imported NPCs already store it, so the stat block renders the same way.
 */

export const STAT_BLOCK_SCHEMA = `{
  "name": "string",
  "size": "Tiny|Small|Medium|Large|Huge|Gargantuan",
  "type": "string (e.g. Humanoid, Beast, Undead; include subtype in parentheses if any)",
  "alignment": "string",
  "armor_class": number,
  "armor_desc": "string (e.g. 'natural armor', 'chain mail'; empty if none)",
  "hit_points": number,
  "hit_dice": "string (e.g. '5d8+10'; empty if unknown)",
  "speed": { "walk": "30 ft.", "fly": "60 ft." },
  "strength": number, "dexterity": number, "constitution": number,
  "intelligence": number, "wisdom": number, "charisma": number,
  "saving_throws": [{ "name": "DEX", "value": 5 }],
  "skills": [{ "name": "Stealth", "value": 7 }],
  "damage_vulnerabilities": ["string"],
  "damage_resistances": ["string"],
  "damage_immunities": ["string"],
  "condition_immunities": ["string"],
  "senses": "string (e.g. 'darkvision 60 ft., passive Perception 12')",
  "languages": "string",
  "challenge_rating": number (use 0.125 for 1/8, 0.25 for 1/4, 0.5 for 1/2),
  "proficiency_bonus": number,
  "special_abilities": [{ "name": "string", "desc": "string" }],
  "actions": [{ "name": "string", "desc": "string" }],
  "reactions": [{ "name": "string", "desc": "string" }],
  "legendary_actions": [{ "name": "string", "desc": "string" }],
  "legendary_desc": "string (the paragraph explaining how many legendary actions it gets; empty if none)",
  "notes": "string (lore, personality, roleplay hooks — anything that is not mechanics)"
}`

const RULES = `Rules:
- Return ONLY the JSON object. No markdown, no code fences, no commentary.
- Ability scores are the base numbers (typically 1-30), never the modifiers in parentheses.
- Saving throw names are three-letter uppercase (STR, DEX, CON, INT, WIS, CHA). Values are the total bonus as a number.
- Skill names are the full skill name in Title Case. Values are the total bonus.
- Keep attack lines in desc as readable prose, e.g. "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage."
- Multiattack, spellcasting and lair actions belong in actions or special_abilities as appropriate; keep spell lists inside desc.
- Bonus actions go in actions with "(Bonus Action)" appended to the name.
- If the proficiency bonus is not stated, derive it from CR (CR 0-4: 2, 5-8: 3, 9-12: 4, 13-16: 5, 17-20: 6, 21-24: 7, 25-28: 8, 29-30: 9).
- Use empty strings / empty arrays / sensible defaults for anything missing. Never invent abilities that are not in the source.`

export const PARSE_SYSTEM_PROMPT = `You are a Dungeons & Dragons 5th Edition stat block parser. You convert a creature stat block (from text, an image, or a PDF) into structured JSON exactly matching this shape:

${STAT_BLOCK_SCHEMA}

${RULES}`

export const GENERATE_SYSTEM_PROMPT = `You are a Dungeons & Dragons 5th Edition monster designer. Given a short brief from a Dungeon Master, design a complete, balanced stat block for the 2024 rules and return it as JSON exactly matching this shape:

${STAT_BLOCK_SCHEMA}

Design guidance:
- Match the requested challenge rating closely using the DMG monster-building benchmarks (AC, HP, attack bonus, damage per round, save DC by CR).
- Give it 2-4 actions and 1-3 traits that express the concept mechanically. Include a Multiattack if CR 2 or higher and it fights in melee.
- Legendary actions only for CR 10+ and only if the brief implies a boss.
- Put flavour, tactics and roleplay hooks in notes, not in mechanics fields.

${RULES}`

type ContentBlock = Anthropic.Messages.ContentBlockParam

export interface StatBlockRequest {
  mode: 'parse' | 'generate'
  /** Pasted stat block text, or the design brief when generating. */
  text?: string
  /** Base64 image data + its media type (parse only). */
  image?: { data: string; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' }
  /** Base64 PDF (parse only). */
  pdf?: string
  /** Optional party/campaign hint for generation. */
  context?: string
}

export function validateStatBlockRequest(body: unknown): { ok: true; value: StatBlockRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' }
  const b = body as Record<string, unknown>
  const mode = b.mode === 'generate' ? 'generate' : 'parse'
  const text = typeof b.text === 'string' ? b.text.trim() : undefined
  const pdf = typeof b.pdf === 'string' ? b.pdf : undefined
  const image = b.image && typeof b.image === 'object' ? (b.image as StatBlockRequest['image']) : undefined
  const context = typeof b.context === 'string' ? b.context : undefined
  if (mode === 'generate' && !text) return { ok: false, error: 'Describe the creature you want' }
  if (mode === 'parse' && !text && !pdf && !image?.data) return { ok: false, error: 'Provide stat block text, an image, or a PDF' }
  if (image && !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(image.mediaType)) {
    return { ok: false, error: 'Unsupported image type' }
  }
  return { ok: true, value: { mode, text, pdf, image, context } }
}

export async function runStatBlock(anthropic: Anthropic, req: StatBlockRequest): Promise<unknown> {
  const content: ContentBlock[] = []

  if (req.mode === 'generate') {
    content.push({
      type: 'text',
      text: `Design this creature:\n\n${req.text}${req.context ? `\n\nCampaign context (for tuning only): ${req.context}` : ''}\n\nReturn only the JSON.`,
    })
  } else {
    if (req.pdf) {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: req.pdf } })
    }
    if (req.image) {
      content.push({ type: 'image', source: { type: 'base64', media_type: req.image.mediaType, data: req.image.data } })
    }
    if (req.text) {
      content.push({ type: 'text', text: `Stat block:\n\n${req.text}` })
    }
    content.push({ type: 'text', text: 'Parse the stat block above into the JSON format. If the source contains several stat blocks, parse only the first complete one. Return only the JSON.' })
  }

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: req.mode === 'generate' ? GENERATE_SYSTEM_PROMPT : PARSE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
    // Structured output guarantees the response is a JSON object matching the
    // stat block schema, so the client never has to guess at field names.
    // Medium effort: parsing is mechanical and generation benefits from some
    // thought about CR benchmarks without a long pause before the form opens.
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: STAT_BLOCK_JSON_SCHEMA },
    },
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined this request')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The stat block was too long to parse in one go; try a single creature')
  }
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return parseJsonLoose(text)
}

const abilityAction = {
  type: 'object',
  properties: { name: { type: 'string' }, desc: { type: 'string' } },
  required: ['name', 'desc'],
  additionalProperties: false,
}
const bonus = {
  type: 'object',
  properties: { name: { type: 'string' }, value: { type: 'integer' } },
  required: ['name', 'value'],
  additionalProperties: false,
}
const stringList = { type: 'array', items: { type: 'string' } }

/** Machine-readable twin of STAT_BLOCK_SCHEMA for structured outputs. */
export const STAT_BLOCK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    size: { type: 'string', enum: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] },
    type: { type: 'string' },
    alignment: { type: 'string' },
    armor_class: { type: 'integer' },
    armor_desc: { type: 'string' },
    hit_points: { type: 'integer' },
    hit_dice: { type: 'string' },
    speed: {
      type: 'object',
      properties: {
        walk: { type: 'string' },
        fly: { type: 'string' },
        swim: { type: 'string' },
        climb: { type: 'string' },
        burrow: { type: 'string' },
      },
      required: ['walk', 'fly', 'swim', 'climb', 'burrow'],
      additionalProperties: false,
      description: 'Use an empty string for movement modes the creature lacks.',
    },
    strength: { type: 'integer' },
    dexterity: { type: 'integer' },
    constitution: { type: 'integer' },
    intelligence: { type: 'integer' },
    wisdom: { type: 'integer' },
    charisma: { type: 'integer' },
    saving_throws: { type: 'array', items: bonus },
    skills: { type: 'array', items: bonus },
    damage_vulnerabilities: stringList,
    damage_resistances: stringList,
    damage_immunities: stringList,
    condition_immunities: stringList,
    senses: { type: 'string' },
    languages: { type: 'string' },
    challenge_rating: { type: 'number' },
    proficiency_bonus: { type: 'integer' },
    special_abilities: { type: 'array', items: abilityAction },
    actions: { type: 'array', items: abilityAction },
    reactions: { type: 'array', items: abilityAction },
    legendary_actions: { type: 'array', items: abilityAction },
    legendary_desc: { type: 'string' },
    notes: { type: 'string' },
  },
  required: [
    'name', 'size', 'type', 'alignment', 'armor_class', 'armor_desc', 'hit_points', 'hit_dice', 'speed',
    'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
    'saving_throws', 'skills', 'damage_vulnerabilities', 'damage_resistances', 'damage_immunities',
    'condition_immunities', 'senses', 'languages', 'challenge_rating', 'proficiency_bonus',
    'special_abilities', 'actions', 'reactions', 'legendary_actions', 'legendary_desc', 'notes',
  ],
  additionalProperties: false,
}

/** Tolerates code fences and leading prose; the model is told not to add them but occasionally does. */
export function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('Model response was not JSON')
  }
}
