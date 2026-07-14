export const ABILITY_SCORES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
export type AbilityScore = (typeof ABILITY_SCORES)[number]

export const ABILITY_ABBREVIATIONS: Record<AbilityScore, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
}

export const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

export const SKILLS: { name: string; ability: AbilityScore }[] = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' },
]

export const CLASSES = [
  'Artificer', 'Barbarian', 'Barriomancer', 'Bard', 'Cleric', 'Dragon-Rider', 'Druid', 'Fighter', 'Monk',
  'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
] as const

export const RACES = [
  'Aasimar', 'Disembodied', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goblin', 'Goliath',
  'Halfling', 'Hederan', 'Human', 'Orc', 'Plasmoid', 'Tiefling', 'Tortle', 'Triton',
] as const

export const BACKGROUNDS = [
  'Acolyte', 'Artisan', 'Charlatan', 'Criminal', 'Entertainer', 'Farmer',
  'Guard', 'Guide', 'Hermit', 'Merchant', 'Noble', 'Sage',
  'Sailor', 'Scribe', 'Soldier', 'Wayfarer',
] as const

export const STANDARD_LANGUAGES = [
  'Common', 'Common Sign Language', 'Draconic', 'Dwarvish', 'Elvish',
  'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Infernal', 'Orc',
] as const

export const RARE_LANGUAGES = [
  'Abyssal', 'Celestial', 'Deep Speech', 'Druidic',
  'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon',
] as const

// Backwards compatibility aliases
export const COMMON_LANGUAGES = STANDARD_LANGUAGES
export const EXOTIC_LANGUAGES = RARE_LANGUAGES

export const ALL_LANGUAGES = [...STANDARD_LANGUAGES, ...RARE_LANGUAGES] as const

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
] as const

export const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
] as const

export const ITEM_CATEGORIES = [
  'weapon', 'armor', 'gear', 'consumable', 'treasure', 'magic_item',
] as const

export const LORE_CATEGORIES = [
  'npc', 'location', 'faction', 'plot_point', 'item', 'other',
] as const

export const EFFECT_TYPES = [
  'condition', 'spell', 'item', 'other',
] as const

/** Standard Array for ability score generation (2024 PHB) */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

/** Point buy costs per ability score value */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}

export const POINT_BUY_BUDGET = 27
