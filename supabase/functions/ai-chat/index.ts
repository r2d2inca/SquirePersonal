// Supabase Edge Function — AI Chat Proxy
// Proxies requests to the Anthropic Claude API, keeping the API key server-side.
// Deploy with: supabase functions deploy ai-chat

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

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
say so clearly rather than guessing.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Verify user auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { message, conversationHistory, characterContext } = await req.json();

    // Build system prompt with character context
    const systemContent = `${SYSTEM_PROMPT}

## Current Character State
${characterContext}`;

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemContent,
      messages: [
        ...(conversationHistory || []).slice(-20).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(JSON.stringify({ content }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
