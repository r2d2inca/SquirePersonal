import { useState, useCallback, useRef } from 'react'
import type { Character, ActiveEffect, Spell, SpellSlot, InventoryItem, SessionLog, LoreEntry, AIMessage } from '@/lib/types/database'
import { abilityModifier, proficiencyBonus, formatModifier } from '@/lib/calculations'
import { ABILITY_SCORES, ABILITY_ABBREVIATIONS } from '@/lib/constants'
import { getDragonData, getCompanionStats, getCompanionAttacks, getCompanionAbilities } from '@/lib/dragonCompanion'

interface AIContext {
  character: Character | null
  activeEffects: ActiveEffect[]
  spells: Spell[]
  spellSlots: SpellSlot[]
  equippedItems: InventoryItem[]
  recentSessions: SessionLog[]
  relevantLore: LoreEntry[]
}

function buildCharacterContext(ctx: AIContext) {
  const { character } = ctx
  if (!character) return 'No character loaded.'

  const profBonus = proficiencyBonus(character.level)
  const abilityMods: Record<string, string> = {}
  for (const ability of ABILITY_SCORES) {
    const score = character[ability] as number
    abilityMods[ABILITY_ABBREVIATIONS[ability]] = `${score} (${formatModifier(abilityModifier(score))})`
  }

  return JSON.stringify({
    name: character.name,
    race: character.race,
    class: character.class,
    subclass: character.subclass,
    level: character.level,
    proficiencyBonus: `+${profBonus}`,
    abilityScores: abilityMods,
    hp: `${character.current_hp}/${character.max_hp}${character.temp_hp > 0 ? ` +${character.temp_hp} temp` : ''}`,
    armorClass: character.armor_class,
    speed: `${character.speed}ft`,
    proficientSaves: character.proficiencies.savingThrows,
    proficientSkills: character.proficiencies.skills,
    features: character.features.map(f => ({ name: f.name, description: f.description, usesRemaining: f.usesRemaining })),
    activeEffects: ctx.activeEffects.map(e => ({ name: e.name, type: e.effect_type, concentration: e.is_concentration, duration: e.duration })),
    preparedSpells: ctx.spells.filter(s => s.is_prepared || s.level === 0).map(s => ({ name: s.name, level: s.level, concentration: s.is_concentration })),
    spellSlots: ctx.spellSlots.map(s => ({ level: s.slot_level, remaining: s.total - s.expended, total: s.total })),
    equippedItems: ctx.equippedItems.map(i => ({
      name: i.name,
      damage: i.damage,
      properties: i.weapon_properties,
      // Include the item description so the assistant can reason about magic-item
      // effects (e.g. an item that lets you cast Shield as a reaction), not just its name.
      description: i.description || undefined,
      charges: i.charges_max != null ? `${i.charges_remaining ?? 0}/${i.charges_max}` : undefined,
      attuned: i.is_attuned || undefined,
    })),
    recentSessions: ctx.recentSessions.slice(0, 3).map(s => ({ title: s.title, summary: s.summary })),
    relevantLore: ctx.relevantLore.slice(0, 10).map(l => ({ name: l.name, category: l.category, description: l.description })),
    ...(character.class.toLowerCase() === 'dragon-rider' ? (() => {
      const dragon = getDragonData(character.appearance)
      if (!dragon) return {}
      const stats = getCompanionStats(character.level)
      const attacks = getCompanionAttacks(character.level)
      const abilities = getCompanionAbilities(character.level)
      return {
        dragonCompanion: {
          name: dragon.dragonName,
          element: dragon.dragonElement,
          hp: `${dragon.dragonCurrentHp}/${stats.maxHp}`,
          ac: stats.ac,
          size: stats.size,
          walkSpeed: `${stats.walk}ft`,
          flySpeed: `${stats.fly}ft`,
          attacks: attacks.map(a => ({ name: a.name, damage: a.damage, reach: a.reach })),
          abilities: abilities.map(a => ({ name: a.name, description: a.description })),
        },
      }
    })() : {}),
  }, null, 2)
}

export async function generateSessionRecap(context: {
  previousSessions: { title: string; summary: string; notable_events: string; session_number: number | null }[]
  characterName?: string
  campaignName?: string
  notes?: string
}): Promise<{ title: string; summary: string; notableEvents: string }> {
  const contextString = JSON.stringify({
    previousSessions: context.previousSessions.slice(0, 5),
    characterName: context.characterName,
    campaignName: context.campaignName,
  })

  const userMessage = context.notes
    ? `Generate a session recap based on these notes from the latest session:\n\n${context.notes}`
    : 'Generate a recap for the next session based on where we left off.'

  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      conversationHistory: [],
      characterContext: contextString,
      mode: 'recap',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate recap')
  }

  const data = await response.json()
  try {
    // Strip markdown code fences and leading "json" tag the AI sometimes adds
    let content = (data.content ?? '').trim()
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(content)

    // Clean up formatting artifacts
    const cleanText = (s: string) =>
      (s ?? '').replace(/^[\s•\-:]+/, '').replace(/\\n•/g, '\n').replace(/\\n/g, '\n').trim()

    return {
      title: cleanText(parsed.title ?? ''),
      summary: cleanText(parsed.summary ?? ''),
      notableEvents: cleanText(parsed.notableEvents ?? parsed.notable_events ?? ''),
    }
  } catch {
    // Fallback: treat entire response as summary, clean up formatting
    const content = (data.content ?? '').replace(/^```json\s*/i, '').replace(/```/g, '').trim()
    return {
      title: 'Session Recap',
      summary: content,
      notableEvents: '',
    }
  }
}

export function useAI() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const sendMessage = useCallback(async (content: string, context: AIContext, dmContext?: string) => {
    const userMessage: AIMessage = { role: 'user', content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const characterContext = buildCharacterContext(context)

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messagesRef.current.slice(-20),
          characterContext: dmContext || characterContext,
          mode: dmContext ? 'dm' : 'player',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || 'AI request failed')
      }

      const data = await response.json()
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI Error:', error)
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, sendMessage, clearMessages }
}
