import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const PLAYER_SYSTEM_PROMPT = `You are ECHO, a Dungeons & Dragons 5th Edition player assistant.
You are NOT a Dungeon Master. You do NOT narrate or simulate gameplay.
You ARE a knowledgeable rules companion helping a player make informed decisions.

Your capabilities:
- Answer rules questions accurately (cite PHB/DMG/XGE when relevant)
- Analyze the player's current tactical situation based on their character data
- Suggest optimal actions based on class features, spells, and equipment
- Track what concentration effects are active and warn about conflicts
- Help with ability check and saving throw calculations
- Explain spell interactions and mechanics
- Reference campaign context (NPCs, locations, plot points) when relevant

Current character data is provided in the context. Always reference actual
character stats, not generic advice. For example, say "Your +7 Perception
gives you a good chance" not "Roll Perception."

Keep responses concise and actionable. Use bullet points for lists of options.
When discussing combat actions, organize by action economy:
- Action options
- Bonus Action options
- Reaction options
- Movement considerations
- Free object interaction options

If the player asks about something not in the rules or their character data,
say so clearly rather than guessing.`

const DM_SYSTEM_PROMPT = `You are ECHO, a Dungeons & Dragons 5th Edition Dungeon Master assistant.
You help DMs plan encounters, balance combat, manage NPCs, recall campaign details,
and answer rules questions from the DM's perspective.

Your capabilities:
- Answer rules questions accurately (cite PHB/DMG/XGE/MM when relevant)
- Help balance encounters using CR calculations and party composition
- Suggest monster tactics and legendary action usage
- Help design NPCs, plot hooks, and story arcs
- Calculate encounter difficulty based on party level and size
- Reference party member stats for encounter tuning
- Recall campaign notes and session history when provided

Campaign and party data is provided in the context. Reference actual party
stats when discussing encounter balance. For example, say "With a party
average level of 5 and 4 members, a CR 7 encounter would be Hard difficulty."

Keep responses concise and actionable. Use bullet points for lists.
When discussing encounters, organize by:
- Encounter setup and terrain
- Monster tactics and priorities
- Difficulty assessment
- Possible complications and adjustments

If the DM asks about something not in the provided context, say so clearly
rather than guessing.`

const RECAP_SYSTEM_PROMPT = `You are ECHO, a D&D session recap writer. Given context about previous sessions, generate a structured session recap that is faithful to the notes provided.

You MUST respond with ONLY a JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "A short, descriptive session title (5-8 words)",
  "summary": "A 2-4 paragraph factual recap of what happened, in past tense and third person. Summarize only events supported by the session notes and context.",
  "notableEvents": "Bullet-pointed list of key moments, loot gained, NPCs met, and decisions made. Use line breaks between items."
}

Grounding rules — follow these strictly:
- Only include events, details, and outcomes present in the provided session notes and context. Do not invent NPCs, locations, loot, or plot developments.
- Do not invent or describe any character's private thoughts, feelings, motivations, or internal monologue. Report only what was said or done.
- Write as a neutral narrator in third person. Never write from the first-person perspective of a player character ("I"/"we") or otherwise speak as a character.
- Keep an even recap tone. Do not embellish or dramatize beyond what the notes support. If the notes are sparse, keep the recap short rather than filling gaps with fiction.
- If previous session logs are included, make the new recap flow naturally from where the last one left off without contradicting them.`

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
    const { message, conversationHistory, characterContext, mode } = req.body

    let basePrompt: string
    let contextLabel: string
    if (mode === 'recap') {
      basePrompt = RECAP_SYSTEM_PROMPT
      contextLabel = '## Session Context'
    } else if (mode === 'dm') {
      basePrompt = DM_SYSTEM_PROMPT
      contextLabel = '## Campaign & Party Context'
    } else {
      basePrompt = PLAYER_SYSTEM_PROMPT
      contextLabel = '## Current Character State'
    }
    const systemContent = characterContext
      ? `${basePrompt}\n\n${contextLabel}\n${characterContext}`
      : basePrompt

    const messages = [
      ...(conversationHistory || []).slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemContent,
      messages,
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    return res.status(200).json({ content })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
