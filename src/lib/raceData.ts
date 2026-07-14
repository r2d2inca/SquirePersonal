/**
 * D&D 2024 PHB (5.5e) species traits for auto-populating features on character creation.
 * In 2024 rules, species no longer grant ability score increases (backgrounds do).
 */

import type { Feature } from '@/lib/types/database'

export interface GrantedSpell {
  index: string    // SRD spell index (e.g., 'fire-bolt')
  name: string     // Display name
  level: number    // Spell level (0 = cantrip)
  grantedAtLevel: number  // Character level when this spell is granted
}

export interface SubraceData {
  index: string
  name: string
  description: string
  featureReplacements: {
    replaces: string
    feature: Feature
  }[]
  speedOverride?: number
  grantedSpells?: GrantedSpell[]
}

export interface RaceData {
  description: string
  speed: number
  size: string
  languages: string[]
  features: Feature[]
  /** Skills automatically granted by this species */
  skillProficiencies?: string[]
  /** Weapon proficiencies granted by this species */
  weaponProficiencies?: string[]
  /** Number of extra language slots the species grants (default 0) */
  extraLanguageSlots?: number
  /** Number of additional skill proficiency choices from this species (e.g. Human Skillful) */
  skillChoiceCount?: number
  /** Subraces/lineages for this species */
  subraces?: SubraceData[]
  /** Spells/cantrips granted by this species */
  grantedSpells?: GrantedSpell[]
}

export const RACE_DATA: Record<string, RaceData> = {
  Hederan: {
    description: 'Hederans are living embodiments of alpine trees — sentient beings of bark and leaf whose bodies host moss, holly, and fungi. Their outer skin is thick bark that toughens with age, over a green, sap-filled musculature, with twigs and berries sprouting around their heads. They have extraordinary lifespans and serve as solitary guardians of winter forests, maintaining the balance of nature.',
    speed: 30,
    size: 'Small or Medium',
    languages: ['Common'],
    features: [
      { name: 'Darkvision', description: 'You have Darkvision with a range of 60 feet.', source: 'Species' },
      { name: 'Outdoor Adept', description: 'You can move across Difficult Terrain made from earth or foliage without expending extra movement.', source: 'Species' },
      { name: 'Protected by Nature', description: 'You can attempt to Hide even when you are only Lightly Obscured by foliage, heavy rain or snow, mist, or other natural phenomena.', source: 'Species' },
      { name: 'Friend of Fauna', description: 'Once per Long Rest, you can cast the Beast Bond spell without the material components and without expending a spell slot.', source: 'Species', usesMax: 1, usesRemaining: 1, rechargeOn: 'long_rest' },
    ],
  },
  Aasimar: {
    description: 'Aasimar are humanoids with a touch of the power of Mount Celestia. They are descended from humans with a blend of celestial energy.',
    speed: 30,
    size: 'Medium or Small',
    languages: ['Common', 'Celestial'],
    grantedSpells: [
      { index: 'light', name: 'Light', level: 0, grantedAtLevel: 1 },
    ],
    features: [
      {
        name: 'Celestial Resistance',
        description: 'You have Resistance to Necrotic damage and Radiant damage.',
        source: 'Species',
      },
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Healing Hands',
        description: 'As a Magic action, you touch a creature and roll a number of d4s equal to your Proficiency Bonus. The creature regains a number of Hit Points equal to the total rolled. Once you use this trait, you can\'t use it again until you finish a Long Rest.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
      {
        name: 'Light Bearer',
        description: 'You know the Light cantrip. Charisma is your spellcasting ability for it.',
        source: 'Species',
      },
      {
        name: 'Celestial Revelation',
        description: 'When you reach character level 3, you can transform as a Bonus Action using one of the options below (choose when you gain this feature). The transformation lasts for 1 minute or until you end it (no action required). Once you transform, you can\'t do so again until you finish a Long Rest. While transformed, you gain the following:\n\nNecrotic Shroud: Frightening flaming eyes. Each creature of your choice within 10 feet must succeed on a Charisma saving throw (DC = 8 + Charisma modifier + Proficiency Bonus) or have the Frightened condition for 1 minute. Extra Necrotic damage equal to your Proficiency Bonus once per turn.\n\nRadiant Consumption: Searing light radiates from you. You and each creature within 10 feet take Radiant damage equal to your Proficiency Bonus at the end of each of your turns. Extra Radiant damage equal to your Proficiency Bonus once per turn.\n\nRadiant Soul: Spectral wings. You have a Fly Speed equal to your Speed. Extra Radiant damage equal to your Proficiency Bonus once per turn.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
    ],
  },

  Tortle: {
    description: 'Tortles are peaceful, turtle-like humanoids who carry their homes on their backs. Born with the instincts of survivalists, they are slow to anger, quick to aid others, and protected by a thick shell. Adapted from Mordenkainen Presents: Monsters of the Multiverse.',
    speed: 30,
    size: 'Medium or Small',
    languages: ['Common'],
    extraLanguageSlots: 1,
    // Nature's Intuition grants one skill of the player's choice (Animal Handling,
    // Medicine, Nature, Perception, Stealth, or Survival). Modeled as a free skill pick.
    skillChoiceCount: 1,
    features: [
      {
        name: 'Claws',
        description: 'You have claws that you can use to make unarmed strikes. When you hit with them, the strike deals 1d6 + your Strength modifier Slashing damage, instead of the Bludgeoning damage normal for an unarmed strike.',
        source: 'Species',
      },
      {
        name: 'Hold Breath',
        description: 'You can hold your breath for up to 1 hour.',
        source: 'Species',
      },
      {
        name: 'Natural Armor',
        description: 'Your shell provides you a base AC of 17 (your Dexterity modifier doesn\'t affect this number). You can\'t wear light, medium, or heavy armor, but if you are using a Shield, you can apply the Shield\'s bonus as normal.',
        source: 'Species',
      },
      {
        name: "Nature's Intuition",
        description: 'You gain proficiency in one of the following skills of your choice: Animal Handling, Medicine, Nature, Perception, Stealth, or Survival.',
        source: 'Species',
      },
      {
        name: 'Shell Defense',
        description: 'You can withdraw into your shell as an action. Until you emerge, you gain a +4 bonus to your AC, and you have Advantage on Strength and Constitution saving throws. While in your shell, you have the Prone condition, your Speed is 0 and can\'t increase, you have Disadvantage on Dexterity saving throws, you can\'t take Reactions, and the only action you can take is a Bonus Action to emerge.',
        source: 'Species',
      },
    ],
  },

  Disembodied: {
    description: 'The Disembodied are beings partially untethered from the Material Plane. They mature slowly and have drastically higher life expectancy than other humanoids, with not a single Disembodied having passed due to old age.',
    speed: 30,
    size: 'Medium',
    languages: ['Common'],
    extraLanguageSlots: 2,
    skillProficiencies: ['Arcana'],
    features: [
      {
        name: 'Fade Away',
        description: 'On your turn, as an action, you can fade from the Material Realm and disappear into the Ethereal Plane. While faded away, you cannot interact with the Material Plane, and effects on the Material Plane cannot interact with you, including spells and creatures. However, you can move and hear as normal, and see everything in shades of grey. This effect lasts for 1 minute, or until you use a bonus action to end it. When the effect ends, you reappear in the Material Plane, in the closest unoccupied space you disappeared from. Once you use this feature, you cannot use it again until you complete a Long Rest.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
      {
        name: 'Planar Outcast',
        description: 'You can cast Feather Fall once per Long Rest, targeting yourself only. When you reach 3rd level, you can also cast Blur once per Long Rest. When you reach 5th level, you can also cast Blink once per Long Rest. Intelligence is your spellcasting ability for these spells.',
        source: 'Species',
      },
      {
        name: 'Arcane Origins',
        description: 'You gain proficiency in the Arcana skill.',
        source: 'Species',
      },
    ],
    grantedSpells: [
      { index: 'feather-fall', name: 'Feather Fall', level: 1, grantedAtLevel: 1 },
      { index: 'blur', name: 'Blur', level: 2, grantedAtLevel: 3 },
      { index: 'blink', name: 'Blink', level: 3, grantedAtLevel: 5 },
    ],
  },

  Dragonborn: {
    description: 'Dragonborn are humanoids with draconic ancestry, manifesting their heritage with breath weapons and elemental resistance.',
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Draconic'],
    features: [
      {
        name: 'Draconic Ancestry',
        description: 'You are descended from a dragon. Choose the type from the Draconic Ancestors table (Black/Acid, Blue/Lightning, Brass/Fire, Bronze/Lightning, Copper/Acid, Gold/Fire, Green/Poison, Red/Fire, Silver/Cold, White/Cold). Your Breath Weapon and damage resistance are determined by this choice.',
        source: 'Species',
      },
      {
        name: 'Breath Weapon',
        description: 'When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot line that is 5 feet wide (your choice each time). Each creature in that area must make a Dexterity saving throw (DC = 8 + Constitution modifier + Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type associated with your Draconic Ancestry. On a successful save, a creature takes half damage. The damage increases to 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level. You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all uses on a Long Rest.',
        source: 'Species',
      },
      {
        name: 'Damage Resistance',
        description: 'You have Resistance to the damage type determined by your Draconic Ancestry.',
        source: 'Species',
      },
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Draconic Flight',
        description: 'When you reach character level 5, you can channel your draconic energy to sprout spectral wings. As a Bonus Action, you gain a Fly Speed equal to your Speed that lasts for 10 minutes. You can use this trait once, and you regain the ability to do so when you finish a Long Rest.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
    ],
    subraces: (() => {
      const types: [string, string][] = [
        ['Black', 'Acid'], ['Blue', 'Lightning'], ['Brass', 'Fire'], ['Bronze', 'Lightning'], ['Copper', 'Acid'],
        ['Gold', 'Fire'], ['Green', 'Poison'], ['Red', 'Fire'], ['Silver', 'Cold'], ['White', 'Cold'],
      ]
      return types.map(([color, damage]) => ({
        index: color.toLowerCase(),
        name: `${color} (${damage})`,
        description: `${damage} breath weapon and ${damage} resistance.`,
        featureReplacements: [
          { replaces: 'Draconic Ancestry', feature: { name: `Draconic Ancestry: ${color} Dragon`, description: `You are descended from a ${color} Dragon. Your breath weapon deals ${damage} damage and you have Resistance to ${damage} damage.`, source: 'Species' } },
          { replaces: 'Breath Weapon', feature: { name: 'Breath Weapon', description: `When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot line that is 5 feet wide (your choice each time). Each creature in that area must make a Dexterity saving throw (DC = 8 + Constitution modifier + Proficiency Bonus). On a failed save, a creature takes 1d10 ${damage} damage. On a successful save, a creature takes half damage. The damage increases to 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level. You can use this a number of times equal to your Proficiency Bonus, and you regain all uses on a Long Rest.`, source: 'Species' } },
          { replaces: 'Damage Resistance', feature: { name: 'Damage Resistance', description: `You have Resistance to ${damage} damage.`, source: 'Species' } },
        ],
      }))
    })(),
  },

  Dwarf: {
    description: 'Dwarves are a stoic but stern people, known for their skill in warfare, ability in mining, and talent at metalwork and stonework.',
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Dwarvish'],
    features: [
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 120 feet.',
        source: 'Species',
      },
      {
        name: 'Dwarven Resilience',
        description: 'You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.',
        source: 'Species',
      },
      {
        name: 'Dwarven Toughness',
        description: 'Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.',
        source: 'Species',
      },
      {
        name: 'Stonecunning',
        description: 'As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.',
        source: 'Species',
      },
    ],
  },

  Elf: {
    description: 'Elves are a magical people of otherworldly grace, living in places of ethereal beauty, in silvery spires glittering with starlight.',
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Elvish'],
    skillProficiencies: ['Perception'],
    features: [
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Elven Lineage',
        description: 'You are part of a lineage that grants you supernatural abilities. Choose one of the following lineages:\n\nDrow: The range of your Darkvision increases to 120 feet. You know the Dancing Lights cantrip. At 3rd level, you can cast Faerie Fire once per Long Rest. At 5th level, you can cast Darkness once per Long Rest. Charisma is your spellcasting ability.\n\nHigh Elf: You know the Prestidigitation cantrip. At 3rd level, you can cast Detect Magic once per Long Rest. At 5th level, you can cast Misty Step once per Long Rest. Intelligence is your spellcasting ability.\n\nWood Elf: Your Speed increases to 35 feet. You know the Druidcraft cantrip. At 3rd level, you can cast Longstrider once per Long Rest. At 5th level, you can cast Pass without Trace once per Long Rest. Wisdom is your spellcasting ability.',
        source: 'Species',
      },
      {
        name: 'Fey Ancestry',
        description: 'You have Advantage on saving throws you make to avoid or end the Charmed condition.',
        source: 'Species',
      },
      {
        name: 'Keen Senses',
        description: 'You have proficiency in the Perception skill.',
        source: 'Species',
      },
      {
        name: 'Trance',
        description: 'You don\'t need to sleep, and magic can\'t put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.',
        source: 'Species',
      },
    ],
    subraces: [
      {
        index: 'drow',
        name: 'Drow',
        description: 'Darkvision 120 ft. Dancing Lights cantrip, plus Faerie Fire (3rd) and Darkness (5th).',
        featureReplacements: [{
          replaces: 'Elven Lineage',
          feature: { name: 'Elven Lineage: Drow', description: 'The range of your Darkvision increases to 120 feet. You know the Dancing Lights cantrip. At 3rd level, you can cast Faerie Fire once per Long Rest. At 5th level, you can cast Darkness once per Long Rest. Charisma is your spellcasting ability.', source: 'Species' },
        }],
        grantedSpells: [
          { index: 'dancing-lights', name: 'Dancing Lights', level: 0, grantedAtLevel: 1 },
          { index: 'faerie-fire', name: 'Faerie Fire', level: 1, grantedAtLevel: 3 },
          { index: 'darkness', name: 'Darkness', level: 2, grantedAtLevel: 5 },
        ],
      },
      {
        index: 'high-elf',
        name: 'High Elf',
        description: 'Prestidigitation cantrip, plus Detect Magic (3rd) and Misty Step (5th).',
        featureReplacements: [{
          replaces: 'Elven Lineage',
          feature: { name: 'Elven Lineage: High Elf', description: 'You know the Prestidigitation cantrip. At 3rd level, you can cast Detect Magic once per Long Rest. At 5th level, you can cast Misty Step once per Long Rest. Intelligence is your spellcasting ability.', source: 'Species' },
        }],
        grantedSpells: [
          { index: 'prestidigitation', name: 'Prestidigitation', level: 0, grantedAtLevel: 1 },
          { index: 'detect-magic', name: 'Detect Magic', level: 1, grantedAtLevel: 3 },
          { index: 'misty-step', name: 'Misty Step', level: 2, grantedAtLevel: 5 },
        ],
      },
      {
        index: 'wood-elf',
        name: 'Wood Elf',
        description: 'Speed 35 ft. Druidcraft cantrip, plus Longstrider (3rd) and Pass without Trace (5th).',
        speedOverride: 35,
        featureReplacements: [{
          replaces: 'Elven Lineage',
          feature: { name: 'Elven Lineage: Wood Elf', description: 'Your Speed increases to 35 feet. You know the Druidcraft cantrip. At 3rd level, you can cast Longstrider once per Long Rest. At 5th level, you can cast Pass without Trace once per Long Rest. Wisdom is your spellcasting ability.', source: 'Species' },
        }],
        grantedSpells: [
          { index: 'druidcraft', name: 'Druidcraft', level: 0, grantedAtLevel: 1 },
          { index: 'longstrider', name: 'Longstrider', level: 1, grantedAtLevel: 3 },
          { index: 'pass-without-trace', name: 'Pass without Trace', level: 2, grantedAtLevel: 5 },
        ],
      },
    ],
  },

  Gnome: {
    description: 'Gnomes are small folk with a keen intellect and a natural affinity for illusion magic.',
    speed: 30,
    size: 'Small',
    languages: ['Common', 'Gnomish'],
    features: [
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Gnomish Cunning',
        description: 'You have Advantage on Intelligence, Wisdom, and Charisma saving throws.',
        source: 'Species',
      },
      {
        name: 'Gnomish Lineage',
        description: 'You are part of a lineage that grants you supernatural abilities. Choose one:\n\nForest Gnome: You know the Minor Illusion cantrip. You can also cast Speak with Animals with this trait. You can cast it a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest. Intelligence is your spellcasting ability.\n\nRock Gnome: You know the Mending and Prestidigitation cantrips. You can also create Tiny clockwork devices using Tinker\'s Tools if you have proficiency.',
        source: 'Species',
      },
    ],
    subraces: [
      {
        index: 'forest-gnome',
        name: 'Forest Gnome',
        description: 'Minor Illusion cantrip and Speak with Animals.',
        featureReplacements: [{
          replaces: 'Gnomish Lineage',
          feature: { name: 'Gnomish Lineage: Forest Gnome', description: 'You know the Minor Illusion cantrip. You can also cast Speak with Animals with this trait. You can cast it a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest. Intelligence is your spellcasting ability.', source: 'Species' },
        }],
        grantedSpells: [
          { index: 'minor-illusion', name: 'Minor Illusion', level: 0, grantedAtLevel: 1 },
          { index: 'speak-with-animals', name: 'Speak with Animals', level: 1, grantedAtLevel: 1 },
        ],
      },
      {
        index: 'rock-gnome',
        name: 'Rock Gnome',
        description: 'Mending and Prestidigitation cantrips, plus Tinker ability.',
        featureReplacements: [{
          replaces: 'Gnomish Lineage',
          feature: { name: 'Gnomish Lineage: Rock Gnome', description: 'You know the Mending and Prestidigitation cantrips. You can also create Tiny clockwork devices using Tinker\'s Tools if you have proficiency.', source: 'Species' },
        }],
        grantedSpells: [
          { index: 'mending', name: 'Mending', level: 0, grantedAtLevel: 1 },
          { index: 'prestidigitation', name: 'Prestidigitation', level: 0, grantedAtLevel: 1 },
        ],
      },
    ],
  },

  Goliath: {
    description: 'Goliaths are towering humanoids with a connection to the ordning of the giants. They are driven by competition and personal glory.',
    speed: 35,
    size: 'Medium',
    languages: ['Common', 'Giant'],
    features: [
      {
        name: 'Giant Ancestry',
        description: 'You are descended from Giants. Choose one of the following benefits — a supernatural boon from your ancestry. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.\n\nCloud\'s Jaunt (Cloud Giant): As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.\n\nFire\'s Burn (Fire Giant): When you hit with an attack roll and deal damage, you can add 1d10 Fire damage. This increases to 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level.\n\nFrost\'s Chill (Frost Giant): When you hit with an attack roll and deal damage, you can add 1d6 Cold damage and reduce the target\'s Speed by 10 feet until the start of your next turn.\n\nHill\'s Tumble (Hill Giant): When you are hit by an attack, you can use your Reaction to reduce the damage by 1d12 + your Constitution modifier.\n\nStone\'s Endurance (Stone Giant): When you take damage, you can use your Reaction to roll 1d12 + Constitution modifier and reduce the damage by that amount.\n\nStorm\'s Thunder (Storm Giant): When you take damage, you can use your Reaction to emit a burst of sound, dealing 1d8 Thunder damage to the triggering creature if it is within 60 feet. This increases to 2d8 at 5th level, 3d8 at 11th level, and 4d8 at 17th level.',
        source: 'Species',
      },
      {
        name: 'Large Form',
        description: 'Starting at character level 5, you can change your size to Large as a Bonus Action (no action needed to end). This lasts 10 minutes or until you end it. While Large, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once used, you can\'t use it again until you finish a Long Rest.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
      {
        name: 'Powerful Build',
        description: 'You have Advantage on any saving throw you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.',
        source: 'Species',
      },
    ],
    subraces: [
      {
        index: 'cloud', name: "Cloud's Jaunt", description: 'Teleport up to 30 feet as a Bonus Action.',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Cloud's Jaunt", description: 'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
      {
        index: 'fire', name: "Fire's Burn", description: 'Add 1d10 Fire damage when you hit (scales with level).',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Fire's Burn", description: 'When you hit with an attack roll and deal damage, you can add 1d10 Fire damage. This increases to 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
      {
        index: 'frost', name: "Frost's Chill", description: 'Add 1d6 Cold damage and slow the target.',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Frost's Chill", description: 'When you hit with an attack roll and deal damage, you can add 1d6 Cold damage and reduce the target\'s Speed by 10 feet until the start of your next turn. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
      {
        index: 'hill', name: "Hill's Tumble", description: 'Reduce damage taken by 1d12 + CON mod as a Reaction.',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Hill's Tumble", description: 'When you are hit by an attack, you can use your Reaction to reduce the damage by 1d12 + your Constitution modifier. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
      {
        index: 'stone', name: "Stone's Endurance", description: 'Reduce damage by 1d12 + CON mod as a Reaction.',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Stone's Endurance", description: 'When you take damage, you can use your Reaction to roll 1d12 + Constitution modifier and reduce the damage by that amount. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
      {
        index: 'storm', name: "Storm's Thunder", description: 'Deal 1d8 Thunder damage to attacker as a Reaction (scales).',
        featureReplacements: [{ replaces: 'Giant Ancestry', feature: { name: "Giant Ancestry: Storm's Thunder", description: 'When you take damage, you can use your Reaction to emit a burst of sound, dealing 1d8 Thunder damage to the triggering creature if it is within 60 feet. This increases to 2d8 at 5th level, 3d8 at 11th level, and 4d8 at 17th level. You can use this a number of times equal to your Proficiency Bonus, regaining all uses on a Long Rest.', source: 'Species' } }],
      },
    ],
  },

  Halfling: {
    description: 'Halflings are resourceful survivors and cheerful wanderers, small in stature but big in heart.',
    speed: 30,
    size: 'Small',
    languages: ['Common', 'Halfling'],
    features: [
      {
        name: 'Brave',
        description: 'You have Advantage on saving throws you make to avoid or end the Frightened condition.',
        source: 'Species',
      },
      {
        name: 'Halfling Nimbleness',
        description: 'You can move through the space of any creature whose size is larger than yours, but you can\'t stop there.',
        source: 'Species',
      },
      {
        name: 'Luck',
        description: 'When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.',
        source: 'Species',
      },
      {
        name: 'Naturally Stealthy',
        description: 'You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.',
        source: 'Species',
      },
    ],
  },

  Orc: {
    description: 'Orcs trace their creation to Gruumsh, a powerful god whose fury they channel in battle. They are large, muscular humanoids.',
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Orc'],
    features: [
      {
        name: 'Adrenaline Rush',
        description: 'You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest.',
        source: 'Species',
      },
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 120 feet.',
        source: 'Species',
      },
      {
        name: 'Relentless Endurance',
        description: 'When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can\'t do so again until you finish a Long Rest.',
        source: 'Species',
        usesMax: 1,
        usesRemaining: 1,
        rechargeOn: 'long_rest',
      },
    ],
  },

  Human: {
    description: 'Humans are the most adaptable, ambitious, and diverse people among the common species. They are innovators, achievers, and pioneers.',
    speed: 30,
    size: 'Medium or Small',
    languages: ['Common'],
    features: [
      {
        name: 'Resourceful',
        description: 'You gain Heroic Inspiration whenever you finish a Long Rest.',
        source: 'Species',
      },
      {
        name: 'Skillful',
        description: 'You gain proficiency in one skill of your choice.',
        source: 'Species',
      },
      {
        name: 'Versatile',
        description: 'You gain an Origin feat of your choice. (See the "Feats" chapter for the list of Origin feats.)',
        source: 'Species',
      },
    ],
    extraLanguageSlots: 3,
    skillChoiceCount: 1,
  },

  Tiefling: {
    description: 'Tieflings are infused with the touch of the fiendish planes, carrying the appearance and sometimes the abilities of their dark heritage.',
    speed: 30,
    size: 'Medium or Small',
    languages: ['Common'],
    extraLanguageSlots: 3,
    grantedSpells: [
      { index: 'thaumaturgy', name: 'Thaumaturgy', level: 0, grantedAtLevel: 1 },
    ],
    features: [
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Fiendish Legacy',
        description: 'You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the options below. You gain the level 1 benefit listed. When you reach levels 3 and 5, you learn a higher-level spell and can cast it once per Long Rest. Charisma is your spellcasting ability for these spells.\n\nAbyssal: Level 1: You have Resistance to Poison damage. You also know the Poison Spray cantrip. Level 3: Ray of Sickness. Level 5: Hold Person.\n\nChthonic: Level 1: You have Resistance to Necrotic damage. You also know the Chill Touch cantrip. Level 3: False Life. Level 5: Ray of Enfeeblement.\n\nInfernal: Level 1: You have Resistance to Fire damage. You also know the Fire Bolt cantrip. Level 3: Hellish Rebuke. Level 5: Darkness.',
        source: 'Species',
      },
      {
        name: 'Otherworldly Presence',
        description: 'You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait.',
        source: 'Species',
      },
    ],
    subraces: [
      {
        index: 'abyssal', name: 'Abyssal', description: 'Poison resistance, Poison Spray cantrip, plus Ray of Sickness (3rd) and Hold Person (5th).',
        featureReplacements: [{ replaces: 'Fiendish Legacy', feature: { name: 'Fiendish Legacy: Abyssal', description: 'You have Resistance to Poison damage. You know the Poison Spray cantrip. At 3rd level, you can cast Ray of Sickness once per Long Rest. At 5th level, you can cast Hold Person once per Long Rest. Charisma is your spellcasting ability.', source: 'Species' } }],
        grantedSpells: [
          { index: 'poison-spray', name: 'Poison Spray', level: 0, grantedAtLevel: 1 },
          { index: 'ray-of-sickness', name: 'Ray of Sickness', level: 1, grantedAtLevel: 3 },
          { index: 'hold-person', name: 'Hold Person', level: 2, grantedAtLevel: 5 },
        ],
      },
      {
        index: 'chthonic', name: 'Chthonic', description: 'Necrotic resistance, Chill Touch cantrip, plus False Life (3rd) and Ray of Enfeeblement (5th).',
        featureReplacements: [{ replaces: 'Fiendish Legacy', feature: { name: 'Fiendish Legacy: Chthonic', description: 'You have Resistance to Necrotic damage. You know the Chill Touch cantrip. At 3rd level, you can cast False Life once per Long Rest. At 5th level, you can cast Ray of Enfeeblement once per Long Rest. Charisma is your spellcasting ability.', source: 'Species' } }],
        grantedSpells: [
          { index: 'chill-touch', name: 'Chill Touch', level: 0, grantedAtLevel: 1 },
          { index: 'false-life', name: 'False Life', level: 1, grantedAtLevel: 3 },
          { index: 'ray-of-enfeeblement', name: 'Ray of Enfeeblement', level: 2, grantedAtLevel: 5 },
        ],
      },
      {
        index: 'infernal', name: 'Infernal', description: 'Fire resistance, Fire Bolt cantrip, plus Hellish Rebuke (3rd) and Darkness (5th).',
        featureReplacements: [{ replaces: 'Fiendish Legacy', feature: { name: 'Fiendish Legacy: Infernal', description: 'You have Resistance to Fire damage. You know the Fire Bolt cantrip. At 3rd level, you can cast Hellish Rebuke once per Long Rest. At 5th level, you can cast Darkness once per Long Rest. Charisma is your spellcasting ability.', source: 'Species' } }],
        grantedSpells: [
          { index: 'fire-bolt', name: 'Fire Bolt', level: 0, grantedAtLevel: 1 },
          { index: 'hellish-rebuke', name: 'Hellish Rebuke', level: 1, grantedAtLevel: 3 },
          { index: 'darkness', name: 'Darkness', level: 2, grantedAtLevel: 5 },
        ],
      },
    ],
  },

  Goblin: {
    description: 'Goblins are small, scrappy creatures found across many worlds — some native humanoids, others touched by fey magic. Despite their size, goblins are fierce and resourceful.',
    speed: 30,
    size: 'Small',
    languages: ['Common', 'Goblin'],
    features: [
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Flight Instincts',
        description: 'As long as you have the bloodied or frightened condition, you can take the Disengage or Hide action as a bonus action.',
        source: 'Species',
      },
      {
        name: 'Fury',
        description: 'Once per turn when you damage a creature you can cause the attack or spell to deal extra damage. You can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a Long Rest.',
        source: 'Species',
      },
      {
        name: 'Unassuming',
        description: 'When you roll initiative in combat and are within 10 feet of another allied creature of a larger Size than yourself, attacks against you have disadvantage until you take your turn in the current combat.',
        source: 'Species',
      },
    ],
    subraces: [
      {
        index: 'native',
        name: 'Native',
        description: 'Humanoid goblin with Fury of the Scorned — extra damage when bloodied.',
        featureReplacements: [{
          replaces: 'Fury',
          feature: {
            name: 'Fury of the Scorned',
            description: 'Once per turn when you damage a creature you can cause the attack or spell to deal extra damage to the creature. The extra damage is equal to 1d6 + your proficiency bonus. To do so you must have lost hit points since the beginning of your last turn or have the bloodied condition.\n\nYou can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a Long Rest. Whenever you gain the dying condition, you gain a bonus use of this trait until the end of your next turn and can use it regardless whether you lost hit points or are bloodied.',
            source: 'Species',
          },
        }],
      },
      {
        index: 'fey',
        name: 'Fey',
        description: 'Fey goblin with Fury of the Small — extra damage against larger creatures.',
        featureReplacements: [{
          replaces: 'Fury',
          feature: {
            name: 'Fury of the Small',
            description: 'Once per turn when you deal damage to a creature of a Size larger than yourself, you can cause the attack or spell to deal extra damage to the creature. The damage is equal to your proficiency bonus. If the creature is 2 or more Sizes larger than you, the damage is equal to 1d6 + your proficiency bonus instead.\n\nYou can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a Long Rest.',
            source: 'Species',
          },
        }],
      },
    ],
  },

  Triton: {
    description: 'Tritons are aquatic humanoids from the Elemental Plane of Water who settled in the ocean depths long ago. They see themselves as guardians of the sea floor, warding against undersea threats.',
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Primordial'],
    features: [
      {
        name: 'Amphibious',
        description: 'You can breathe air and water.',
        source: 'Species',
      },
      {
        name: 'Control Air and Water',
        description: 'You can cast Fog Cloud with this trait. Starting at 3rd level, you can also cast Gust of Wind. Starting at 5th level, you can also cast Wall of Water. Once you cast any of these spells with this trait, you can\'t cast that spell with it again until you finish a Long Rest. You can also cast these spells using any spell slots you have of the appropriate level. Charisma is your spellcasting ability for these spells.',
        source: 'Species',
      },
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Emissary of the Sea',
        description: 'You can communicate simple ideas to any Beast, Elemental, or Monstrosity that has a swimming speed. It can understand your words, though you have no special ability to understand it in return.',
        source: 'Species',
      },
      {
        name: 'Guardians of the Depths',
        description: 'You have Resistance to Cold damage. You also ignore any of the drawbacks caused by a deep, underwater environment (adapted to even the most extreme ocean depths).',
        source: 'Species',
      },
      {
        name: 'Swim Speed',
        description: 'You have a swimming speed equal to your walking speed (30 ft).',
        source: 'Species',
      },
    ],
    grantedSpells: [
      { index: 'fog-cloud', name: 'Fog Cloud', level: 1, grantedAtLevel: 1 },
      { index: 'gust-of-wind', name: 'Gust of Wind', level: 2, grantedAtLevel: 3 },
      { index: 'wall-of-water', name: 'Wall of Water', level: 3, grantedAtLevel: 5 },
    ],
  },
  Plasmoid: {
    description: 'Plasmoids are amorphous beings with no typical shape. In the presence of other folk, they often adopt a humanoid form, but there is little chance of mistaking a plasmoid for anything else. They consume food by osmosis and can sense their environment in all directions.',
    speed: 30,
    size: 'Medium or Small',
    languages: ['Common'],
    extraLanguageSlots: 1,
    features: [
      {
        name: 'Amorphous',
        description: 'You can squeeze through a space as narrow as 1 inch wide, provided you are wearing and carrying nothing. You have Advantage on ability checks you make to initiate or escape a grapple.',
        source: 'Species',
      },
      {
        name: 'Darkvision',
        description: 'You have Darkvision with a range of 60 feet.',
        source: 'Species',
      },
      {
        name: 'Hold Breath',
        description: 'You can hold your breath for 1 hour.',
        source: 'Species',
      },
      {
        name: 'Natural Resilience',
        description: 'You have Resistance to Acid and Poison damage, and you have Advantage on saving throws against the Poisoned condition.',
        source: 'Species',
      },
      {
        name: 'Shape Self',
        description: 'As an Action, you can reshape your body to give yourself a head, one or two arms, one or two legs, and makeshift hands and feet, or you can revert to a limbless blob (no action required). While you have a humanoid shape, you can wear clothing and armor made for a Humanoid of your size. As a Bonus Action, you can extrude a pseudopod that is up to 6 inches wide and 10 feet long or reabsorb it. You can use this pseudopod to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour out the contents of a container. The pseudopod can\'t attack, activate magic items, or carry more than 10 pounds.',
        source: 'Species',
      },
    ],
  },
}

/** Get racial data, returning undefined if race is not found */
export function getRaceData(race: string): RaceData | undefined {
  return RACE_DATA[race]
}

/** Apply a subrace selection, replacing features and overriding speed */
export function applySubrace(raceData: RaceData, subrace: SubraceData): RaceData {
  const features = raceData.features.map(f => {
    const replacement = subrace.featureReplacements.find(r => r.replaces === f.name)
    return replacement ? replacement.feature : f
  })
  // Combine race + subrace granted spells
  const grantedSpells = [
    ...(raceData.grantedSpells ?? []),
    ...(subrace.grantedSpells ?? []),
  ]
  return {
    ...raceData,
    features,
    speed: subrace.speedOverride ?? raceData.speed,
    grantedSpells: grantedSpells.length > 0 ? grantedSpells : undefined,
  }
}

/** Parse a race string like "Elf (High Elf)" into parts */
export function parseRaceSubrace(raceString: string): { race: string; subrace: string | null } {
  const match = raceString.match(/^(.+?)\s*\((.+)\)$/)
  if (match) return { race: match[1], subrace: match[2] }
  return { race: raceString, subrace: null }
}

/** Format race and subrace into a display string */
export function formatRaceWithSubrace(race: string, subrace: string | null): string {
  return subrace ? `${race} (${subrace})` : race
}
