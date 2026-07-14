export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
        }
        Update: {
          display_name?: string
        }
      }
      characters: {
        Row: Character
        Insert: CharacterInsert
        Update: CharacterUpdate
      }
      spell_slots: {
        Row: SpellSlot
        Insert: SpellSlotInsert
        Update: SpellSlotUpdate
      }
      spells: {
        Row: Spell
        Insert: SpellInsert
        Update: SpellUpdate
      }
      inventory_items: {
        Row: InventoryItem
        Insert: InventoryItemInsert
        Update: InventoryItemUpdate
      }
      active_effects: {
        Row: ActiveEffect
        Insert: ActiveEffectInsert
        Update: ActiveEffectUpdate
      }
      session_logs: {
        Row: SessionLog
        Insert: SessionLogInsert
        Update: SessionLogUpdate
      }
      lore_entries: {
        Row: LoreEntry
        Insert: LoreEntryInsert
        Update: LoreEntryUpdate
      }
      notes: {
        Row: Note
        Insert: NoteInsert
        Update: NoteUpdate
      }
      ai_conversations: {
        Row: AIConversation
        Insert: AIConversationInsert
        Update: AIConversationUpdate
      }
      campaigns: {
        Row: Campaign
        Insert: CampaignInsert
        Update: CampaignUpdate
      }
      campaign_members: {
        Row: CampaignMember
        Insert: CampaignMemberInsert
        Update: Partial<CampaignMemberInsert>
      }
      npcs: {
        Row: Npc
        Insert: NpcInsert
        Update: NpcUpdate
      }
      dm_notes: {
        Row: DmNote
        Insert: DmNoteInsert
        Update: DmNoteUpdate
      }
      dm_session_logs: {
        Row: DmSessionLog
        Insert: DmSessionLogInsert
        Update: DmSessionLogUpdate
      }
      campaign_session_logs: {
        Row: CampaignSessionLog
        Insert: CampaignSessionLogInsert
        Update: CampaignSessionLogUpdate
      }
      campaign_lore: {
        Row: CampaignLoreEntry
        Insert: CampaignLoreEntryInsert
        Update: CampaignLoreEntryUpdate
      }
      campaign_messages: {
        Row: CampaignMessage
        Insert: CampaignMessageInsert
        Update: Partial<CampaignMessageInsert>
      }
      campaign_quests: {
        Row: CampaignQuest
        Insert: CampaignQuestInsert
        Update: CampaignQuestUpdate
      }
      campaign_encounters: {
        Row: CampaignEncounter
        Insert: CampaignEncounterInsert
        Update: CampaignEncounterUpdate
      }
      encounter_combatants: {
        Row: EncounterCombatant
        Insert: EncounterCombatantInsert
        Update: EncounterCombatantUpdate
      }
    }
  }
}

export interface Character {
  id: string
  user_id: string
  is_active: boolean
  name: string
  race: string
  class: string
  subclass: string | null
  level: number
  background: string | null
  alignment: string | null
  experience_points: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  max_hp: number
  current_hp: number
  temp_hp: number
  armor_class: number
  initiative_bonus: number
  speed: number
  hit_dice_total: string
  hit_dice_remaining: number
  death_save_successes: number
  death_save_failures: number
  proficiencies: Proficiencies
  features: Feature[]
  copper: number
  silver: number
  electrum: number
  gold: number
  platinum: number
  personality_traits: string
  ideals: string
  bonds: string
  flaws: string
  portrait_url: string | null
  appearance: string
  backstory: string
  heroic_inspiration?: boolean
  spellcasting_ability: string | null
  spell_save_dc: number | null
  spell_attack_bonus: number | null
  created_at: string
  updated_at: string
}

export type CharacterInsert = Omit<Character, 'id' | 'created_at' | 'updated_at' | 'portrait_url'> & { id?: string; portrait_url?: string | null }
export type CharacterUpdate = Partial<Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface Proficiencies {
  skills: string[]
  savingThrows: string[]
  languages: string[]
  tools: string[]
  weapons: string[]
  armor: string[]
  expertise?: string[]  // skills or tools with double proficiency bonus
  weaponMasteries?: string[]  // weapons chosen for mastery properties (2024 PHB)
}

export interface Feature {
  name: string
  description: string
  source: string
  usesMax?: number
  usesRemaining?: number
  rechargeOn?: 'short_rest' | 'long_rest'
}

export interface SpellSlot {
  id: string
  character_id: string
  slot_level: number
  total: number
  expended: number
}

export type SpellSlotInsert = Omit<SpellSlot, 'id'> & { id?: string }
export type SpellSlotUpdate = Partial<Omit<SpellSlot, 'id' | 'character_id'>>

export interface Spell {
  id: string
  character_id: string
  name: string
  level: number
  school: string
  casting_time: string
  range: string
  components: string
  duration: string
  is_concentration: boolean
  is_ritual: boolean
  is_prepared: boolean
  description: string
  higher_levels: string
  source: string
  created_at: string
}

export type SpellInsert = Omit<Spell, 'id' | 'created_at'> & { id?: string }
export type SpellUpdate = Partial<Omit<Spell, 'id' | 'character_id' | 'created_at'>>

export interface InventoryItem {
  id: string
  character_id: string
  name: string
  category: string
  quantity: number
  weight: number
  description: string
  is_equipped: boolean
  is_attuned: boolean
  damage: string | null
  weapon_properties: string | null
  armor_bonus: number | null
  ac_ability_score: string | null
  max_ability_modifier: number | null
  ac_bonus: number | null
  charges_max: number | null
  charges_remaining: number | null
  recharge_type: string | null
  sort_order: number
  created_at: string
}

export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'created_at'> & { id?: string }
export type InventoryItemUpdate = Partial<Omit<InventoryItem, 'id' | 'character_id' | 'created_at'>>

export interface ActiveEffect {
  id: string
  character_id: string
  name: string
  effect_type: string
  description: string
  is_concentration: boolean
  duration: string
  source: string
  ac_modifier: number
  /** Scaffold for future non-AC stat modifiers (ability scores, speed, saves), e.g.
   *  { strength: 2, speed: 10 }. Optional so existing inserts stay valid pre-migration. */
  modifiers?: Record<string, number>
  created_at: string
}

export type ActiveEffectInsert = Omit<ActiveEffect, 'id' | 'created_at'> & { id?: string }
export type ActiveEffectUpdate = Partial<Omit<ActiveEffect, 'id' | 'character_id' | 'created_at'>>

export interface SessionLog {
  id: string
  user_id: string
  character_id: string | null
  session_number: number | null
  title: string
  summary: string
  date_played: string
  notable_events: string
  created_at: string
  updated_at: string
}

export type SessionLogInsert = Omit<SessionLog, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type SessionLogUpdate = Partial<Omit<SessionLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface LoreEntry {
  id: string
  user_id: string
  character_id: string | null
  category: string
  name: string
  description: string
  tags: string[]
  is_pinned: boolean
  related_entries: string[]
  created_at: string
  updated_at: string
}

export type LoreEntryInsert = Omit<LoreEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type LoreEntryUpdate = Partial<Omit<LoreEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface Note {
  id: string
  user_id: string
  character_id: string | null
  title: string
  content: string
  is_pinned: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type NoteUpdate = Partial<Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIConversation {
  id: string
  user_id: string
  character_id: string | null
  messages: AIMessage[]
  created_at: string
  updated_at: string
}

export type AIConversationInsert = Omit<AIConversation, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type AIConversationUpdate = Partial<Omit<AIConversation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ─── Campaign Types ───

export interface Campaign {
  id: string
  user_id: string
  name: string
  description: string
  invite_code: string
  is_active: boolean
  setting?: string
  tone?: string[]
  starting_level?: number
  house_rules?: string
  schedule?: string
  session_zero_notes?: string
  module_template?: string | null
  content_boundaries?: string
  created_at: string
  updated_at: string
}

export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface CampaignMember {
  id: string
  campaign_id: string
  user_id: string
  character_id: string | null
  role: 'player' | 'dm'
  joined_at: string
  // Joined fields from relations
  profiles?: { display_name: string }
  characters?: Pick<Character, 'name' | 'race' | 'class' | 'level' | 'current_hp' | 'max_hp' | 'armor_class' | 'portrait_url'> | null
}

export type CampaignMemberInsert = Omit<CampaignMember, 'id' | 'joined_at' | 'profiles' | 'characters'> & { id?: string }

// ─── NPC Types ───

export interface NpcAbilityAction {
  name: string
  desc: string
  attack_bonus?: number
  damage?: { damage_dice: string; damage_type: { name: string } }[]
  dc?: { dc_type: { name: string }; dc_value: number; success_type: string }
  usage?: { type: string; times?: number; rest_types?: string[] }
}

export interface Npc {
  id: string
  user_id: string
  campaign_id: string | null
  name: string
  size: string
  type: string
  alignment: string
  armor_class: number
  armor_desc: string
  hit_points: number
  hit_dice: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  saving_throws: { name: string; value: number }[]
  skills: { name: string; value: number }[]
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: string[]
  senses: string
  languages: string
  challenge_rating: number
  proficiency_bonus: number
  special_abilities: NpcAbilityAction[]
  actions: NpcAbilityAction[]
  reactions: NpcAbilityAction[]
  legendary_actions: NpcAbilityAction[]
  legendary_desc: string
  source: 'custom' | 'srd-modified'
  srd_index: string | null
  notes: string
  created_at: string
  updated_at: string
}

export type NpcInsert = Omit<Npc, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type NpcUpdate = Partial<Omit<Npc, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ─── DM Notes ───

export interface DmNote {
  id: string
  user_id: string
  campaign_id: string
  title: string
  content: string
  is_pinned: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type DmNoteInsert = Omit<DmNote, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type DmNoteUpdate = Partial<Omit<DmNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ─── DM Session Logs ───

export interface DmSessionLog {
  id: string
  user_id: string
  campaign_id: string
  session_number: number | null
  title: string
  summary: string
  date_played: string
  notable_events: string
  created_at: string
  updated_at: string
}

export type DmSessionLogInsert = Omit<DmSessionLog, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type DmSessionLogUpdate = Partial<Omit<DmSessionLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ─── Campaign Session Logs (shared) ───

export interface CampaignSessionLog {
  id: string
  campaign_id: string
  user_id: string
  title: string
  summary: string
  session_number: number | null
  date_played: string
  notable_events: string
  created_at: string
  updated_at: string
  profiles?: { display_name: string }
}

export type CampaignSessionLogInsert = Omit<CampaignSessionLog, 'id' | 'created_at' | 'updated_at' | 'profiles'> & { id?: string }
export type CampaignSessionLogUpdate = Partial<Omit<CampaignSessionLog, 'id' | 'user_id' | 'campaign_id' | 'created_at' | 'updated_at' | 'profiles'>>

// ─── Campaign Lore (shared) ───

export interface CampaignLoreEntry {
  id: string
  campaign_id: string
  user_id: string
  category: string
  name: string
  description: string
  tags: string[]
  is_pinned: boolean
  is_revealed: boolean
  visible_to: string[]
  created_at: string
  updated_at: string
  profiles?: { display_name: string }
}

export type CampaignLoreEntryInsert = Omit<CampaignLoreEntry, 'id' | 'is_revealed' | 'visible_to' | 'created_at' | 'updated_at' | 'profiles'> & { id?: string; is_revealed?: boolean; visible_to?: string[] }
export type CampaignLoreEntryUpdate = Partial<Omit<CampaignLoreEntry, 'id' | 'user_id' | 'campaign_id' | 'created_at' | 'updated_at' | 'profiles'>>

// ─── Campaign Messages ───

export interface CampaignMessage {
  id: string
  campaign_id: string
  sender_id: string
  recipient_id: string | null
  content: string
  created_at: string
  profiles?: { display_name: string }
}

export type CampaignMessageInsert = Omit<CampaignMessage, 'id' | 'created_at' | 'profiles'> & { id?: string }

/* ── Campaign Quests ── */

export interface QuestObjective {
  text: string
  completed: boolean
}

export interface CampaignQuest {
  id: string
  campaign_id: string
  user_id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  objectives: QuestObjective[]
  sort_order: number
  created_at: string
  updated_at: string
}

export type CampaignQuestInsert = Omit<CampaignQuest, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type CampaignQuestUpdate = Partial<Omit<CampaignQuest, 'id' | 'campaign_id' | 'user_id' | 'created_at' | 'updated_at'>>

/* ── Campaign Encounters (Shared Combat Tracker) ── */

export type EncounterStatus = 'setup' | 'initiative' | 'active' | 'completed'

export interface CampaignEncounter {
  id: string
  campaign_id: string
  dm_user_id: string
  status: EncounterStatus
  current_turn_combatant_id: string | null
  round: number
  grid_width: number
  grid_height: number
  map_image_url: string | null
  created_at: string
  updated_at: string
}

export type CampaignEncounterInsert = Omit<CampaignEncounter, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type CampaignEncounterUpdate = Partial<Omit<CampaignEncounter, 'id' | 'campaign_id' | 'dm_user_id' | 'created_at' | 'updated_at'>>

export type StatusConditionName =
  | 'Blinded' | 'Charmed' | 'Deafened' | 'Frightened' | 'Grappled'
  | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' | 'Poisoned'
  | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious' | 'Exhaustion'
  | 'Flying'

export type CreatureSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'

/** How many 5-ft grid cells a creature occupies per side */
export function creatureSizeCells(size: CreatureSize | string): number {
  switch (size) {
    case 'Tiny': return 1
    case 'Small': return 1
    case 'Medium': return 1
    case 'Large': return 2
    case 'Huge': return 3
    case 'Gargantuan': return 4
    default: return 1
  }
}

export interface EncounterCombatant {
  id: string
  encounter_id: string
  user_id: string | null
  name: string
  initiative: number | null
  initiative_bonus: number
  max_hp: number
  current_hp: number
  temp_hp: number
  armor_class: number
  is_player: boolean
  conditions: StatusConditionName[]
  grid_x: number | null
  grid_y: number | null
  token_color: string
  size: CreatureSize
  group_id: string | null
  created_at: string
  updated_at: string
}

export type EncounterCombatantInsert = Omit<EncounterCombatant, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type EncounterCombatantUpdate = Partial<Omit<EncounterCombatant, 'id' | 'encounter_id' | 'created_at' | 'updated_at'>>
