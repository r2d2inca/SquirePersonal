import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { runStatBlock, validateStatBlockRequest } from './_lib/statBlock'

/**
 * POST /api/parse-stat-block
 * Body: { mode: 'parse' | 'generate', text?, image?: {data, mediaType}, pdf?, context? }
 * Returns the parsed/generated stat block as JSON in the Squire NPC shape.
 */
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

  const validated = validateStatBlockRequest(req.body)
  if (!validated.ok) return res.status(400).json({ error: validated.error })

  try {
    const anthropic = new Anthropic({ apiKey })
    const parsed = await runStatBlock(anthropic, validated.value)
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Stat block parse error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not JSON') ? 422 : 500
    return res.status(status).json({ error: 'Failed to parse stat block', details: message })
  }
}
