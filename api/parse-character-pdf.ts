import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const PARSE_PROMPT = `You are a D&D 5e character sheet parser. Extract all character data from this PDF into a JSON object.

Return ONLY valid JSON (no markdown, no code fences) with this structure:

{
  "character": {
    "name": "string",
    "race": "string (e.g. 'Human', 'High Elf')",
    "class": "string (e.g. 'Fighter', 'Wizard')",
    "subclass": "string or null",
    "level": number,
    "background": "string or null",
    "alignment": "string or null",
    "experience_points": number,
    "strength": number,
    "dexterity": number,
    "constitution": number,
    "intelligence": number,
    "wisdom": number,
    "charisma": number,
    "max_hp": number,
    "current_hp": number,
    "temp_hp": number,
    "armor_class": number,
    "initiative_bonus": number,
    "speed": number,
    "hit_dice_total": "e.g. '5d10'",
    "hit_dice_remaining": number,
    "proficiencies": {
      "skills": ["list of proficient skill names"],
      "savingThrows": ["list of proficient saving throw abilities"],
      "languages": ["list of known languages"],
      "tools": ["list of tool proficiencies"],
      "weapons": ["list of weapon proficiencies"],
      "armor": ["list of armor proficiencies"],
      "expertise": ["skills with expertise, if any"]
    },
    "features": [{"name": "string", "description": "string", "source": "Class or Race or Feat or Background"}],
    "copper": number,
    "silver": number,
    "electrum": number,
    "gold": number,
    "platinum": number,
    "personality_traits": "string",
    "ideals": "string",
    "bonds": "string",
    "flaws": "string",
    "appearance": "string (JSON with height, weight, etc. or empty string)",
    "backstory": "string",
    "spellcasting_ability": "string or null (e.g. 'intelligence', 'wisdom', 'charisma')",
    "spell_save_dc": number or null,
    "spell_attack_bonus": number or null
  },
  "spells": [
    {
      "name": "string",
      "level": number (0 for cantrips),
      "school": "string",
      "casting_time": "string",
      "range": "string",
      "components": "string",
      "duration": "string",
      "is_concentration": boolean,
      "is_ritual": boolean,
      "is_prepared": boolean,
      "description": "string (if visible on sheet, otherwise empty)",
      "higher_levels": "string",
      "source": "string (class name or 'Race' etc.)"
    }
  ],
  "spellSlots": [
    {"slot_level": number, "total": number, "expended": number}
  ],
  "inventoryItems": [
    {
      "name": "string",
      "category": "weapon|armor|gear|consumable|treasure",
      "quantity": number,
      "weight": number,
      "description": "string",
      "is_equipped": boolean,
      "is_attuned": boolean,
      "damage": "string or null (e.g. '1d8 slashing')",
      "weapon_properties": "string or null",
      "armor_bonus": number or null,
      "sort_order": number
    }
  ]
}

Rules for extraction:
- Use the ABILITY SCORES (not modifiers) for strength, dexterity, etc. The scores are the larger numbers (typically 8-20). Modifiers are the smaller +/- numbers.
- For proficiencies, look for filled circles/bubbles next to skills and saving throws.
- Skill names should match: "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"
- Saving throw names should be lowercase: "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"
- For spells, extract all visible spell names. Set level 0 for cantrips.
- If a field is not visible or unclear, use reasonable defaults (0 for numbers, "" for strings, null for nullable fields).
- Do NOT wrap the response in markdown code fences. Return raw JSON only.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  try {
    const { pdf } = req.body
    if (!pdf) {
      return res.status(400).json({ error: 'No PDF data provided' })
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: PARSE_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdf,
              },
            },
            {
              type: 'text',
              text: 'Parse this D&D character sheet into the JSON format specified. Return only valid JSON.',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Try to parse the response as JSON
    let parsed
    try {
      // Strip any markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(422).json({
        error: 'Failed to parse AI response as JSON',
        raw: text,
      })
    }

    return res.status(200).json(parsed)
  } catch (error) {
    console.error('PDF Parse Error:', error)
    return res.status(500).json({
      error: 'Failed to parse PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
