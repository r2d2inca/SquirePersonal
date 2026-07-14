import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/stores/themeStore'
import type { AIMessage } from '@/lib/types/database'

const PLAYER_WELCOME = `> SYSTEM BOOT — ECHO v1.0 INITIALIZED...
> MODULES LOADED: [CHARACTER_ANALYSIS] [RULES_ENGINE] [TACTICAL_ADVISOR] [LORE_DATABASE]
> STATUS: ONLINE

Greetings, adventurer. I am ECHO — the Enhanced Character & History Organizer. I have been calibrated to your character sheet, spell list, inventory, and campaign records. I am here to help you answer any and all questions you have about rules, tactics, ability checks, spell interactions, and strategic combat decisions.

Query me. I am ready.

Lets boogie.`

const DM_WELCOME = `> SYSTEM BOOT — ECHO v1.0 [DM MODE] INITIALIZED...
> MODULES LOADED: [ENCOUNTER_ENGINE] [RULES_ARBITER] [WORLD_BUILDER] [NPC_GENERATOR] [LORE_DATABASE]
> STATUS: ONLINE

Dungeon Master. I am ECHO — the Enhanced Campaign & History Organizer, configured for DM operations. I have access to your campaign data, party roster, NPC stat blocks, session logs, and lore entries.

I can help you adjudicate rules, build encounters, generate NPC dialogue, calculate CR and difficulty, draft session recaps, and answer any question about 5e mechanics.

Your world awaits. Query me.

Lets boogie.`

const PLAYER_PROMPTS = [
  'What actions can I take right now?',
  'What concentration effects are active?',
  'What are my best damage options this turn?',
  'Summarize my current status.',
  'What saving throw bonuses do I have?',
  'Explain my class features.',
]

const DM_PROMPTS = [
  'Is this encounter balanced for my party?',
  'How does grappling work?',
  'Generate a tavern NPC with a quest hook.',
  'What happens when a player falls to 0 HP?',
  'Help me draft a recap of last session.',
  'What are the rules for surprise rounds?',
]

interface AIChatPanelProps {
  messages: AIMessage[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  onClear: () => void
  mode?: 'player' | 'dm'
}

export function AIChatPanel({ messages, isLoading, onSendMessage, onClear, mode = 'player' }: AIChatPanelProps) {
  const theme = useThemeStore((s) => s.theme)
  const userBubbleText = theme === 'dark' ? 'text-ink-900' : 'text-parchment-100'
  const welcomeText = mode === 'dm' ? DM_WELCOME : PLAYER_WELCOME
  const suggestedPrompts = mode === 'dm' ? DM_PROMPTS : PLAYER_PROMPTS
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-ink-900">AI Assistant</h2>
          <p className="text-sm text-ink-500">
            {mode === 'dm' ? 'Rules, encounters, NPCs, and campaign tools' : 'Ask questions about your character, rules, or tactics'}
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 size={14} className="mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-parchment-100 border border-parchment-400 text-ink-900">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} className="text-arcane-400" />
                  <span className="text-xs font-display uppercase text-arcane-500">ECHO</span>
                </div>
                <div className="text-sm font-body whitespace-pre-wrap leading-relaxed">
                  {welcomeText}
                </div>
              </div>
            </div>
            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto pt-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  className="px-3 py-2 bg-parchment-100 border border-parchment-400 rounded-lg text-sm text-ink-700 hover:bg-gold-100 hover:border-gold-400 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? `bg-leather-800 ${userBubbleText}`
                    : 'bg-parchment-100 border border-parchment-400 text-ink-900'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={14} className="text-arcane-400" />
                    <span className="text-xs font-display uppercase text-arcane-500">ECHO</span>
                  </div>
                )}
                <div className="text-sm font-body whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-parchment-100 border border-parchment-400 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-arcane-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-arcane-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-arcane-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-ink-500">Consulting the scrolls...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-parchment-300 pt-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your character, rules, or tactics..."
            className="flex-1 px-4 py-3 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm resize-none focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400"
            rows={2}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="self-end">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
