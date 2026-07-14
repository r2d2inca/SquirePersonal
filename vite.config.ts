import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function aiChatPlugin(): PluginOption {
  let apiKey: string | undefined

  return {
    name: 'ai-chat-proxy',
    configResolved(config) {
      // Load all env vars (including non-VITE_ prefixed ones) for server use
      const env = loadEnv(config.mode, config.root, '')
      apiKey = env.ANTHROPIC_API_KEY
      if (!apiKey) {
        console.warn('[Squire] ANTHROPIC_API_KEY not found in .env — AI assistant will not work')
      }
    },
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString())

          const { message, conversationHistory, characterContext } = body

          const SYSTEM_PROMPT = `You are ECHO, a Dungeons & Dragons 5th Edition player assistant.
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

          const systemContent = characterContext
            ? `${SYSTEM_PROMPT}\n\n## Current Character State\n${characterContext}`
            : SYSTEM_PROMPT

          const messages = [
            ...(conversationHistory || []).slice(-20).map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: message },
          ]

          const Anthropic = (await import('@anthropic-ai/sdk')).default
          const anthropic = new Anthropic({ apiKey })

          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemContent,
            messages,
          })

          const content = response.content[0].type === 'text' ? response.content[0].text : ''

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ content }))
        } catch (error) {
          console.error('AI Chat Error:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })

      // PDF character sheet parser endpoint
      server.middlewares.use('/api/parse-character-pdf', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString())
          const { pdf } = body

          if (!pdf) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No PDF data provided' }))
            return
          }

          const Anthropic = (await import('@anthropic-ai/sdk')).default
          const anthropic = new Anthropic({ apiKey })

          const PARSE_PROMPT = `You are a D&D 5e character sheet parser. Extract all character data from this PDF into JSON. Return ONLY valid JSON (no markdown, no code fences) matching the Squire app format. Use ability SCORES (8-20 range), not modifiers. Skill names: "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival". Saving throw names: lowercase ability names. For missing fields use defaults (0 for numbers, "" for strings, null for nullable).`

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
                    source: { type: 'base64', media_type: 'application/pdf', data: pdf },
                  },
                  {
                    type: 'text',
                    text: 'Parse this D&D character sheet. Return JSON with: character (name, race, class, subclass, level, background, alignment, experience_points, strength/dexterity/constitution/intelligence/wisdom/charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, hit_dice_total, hit_dice_remaining, proficiencies {skills, savingThrows, languages, tools, weapons, armor, expertise}, features [{name, description, source}], copper/silver/electrum/gold/platinum, personality_traits, ideals, bonds, flaws, appearance, backstory, spellcasting_ability, spell_save_dc, spell_attack_bonus), spells [{name, level, school, casting_time, range, components, duration, is_concentration, is_ritual, is_prepared, description, higher_levels, source}], spellSlots [{slot_level, total, expended}], inventoryItems [{name, category, quantity, weight, description, is_equipped, is_attuned, damage, weapon_properties, armor_bonus, sort_order}]',
                  },
                ],
              },
            ],
          })

          const text = response.content[0].type === 'text' ? response.content[0].text : ''
          const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
          const parsed = JSON.parse(cleaned)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(parsed))
        } catch (error) {
          console.error('PDF Parse Error:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'Failed to parse PDF',
            details: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    aiChatPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Squire',
        short_name: 'Squire',
        description: 'Every Hero Needs a Squire — D&D 5e Companion',
        theme_color: '#1e160e',
        background_color: '#ecdcc0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
