/**
 * D&D 2024 PHB class choices — subclasses, fighting styles, and other
 * class-specific options. All subclasses are from the 2024 Player's Handbook.
 * In 2024, all classes gain their subclass at level 3.
 */

export interface SubclassSpell {
  name: string
  index: string       // SRD API index for auto-fill
  level: number       // spell level
  grantedAtLevel: number  // class level when this spell is granted
}

export interface LocalSubclass {
  index: string
  name: string
  description: string
  spells?: SubclassSpell[]
}

export interface LocalFeatureOption {
  index: string
  name: string
  description: string
}

export interface ClassChoiceData {
  subclassLabel: string
  subclassLevel: number
  subclasses: LocalSubclass[]
  featureChoices: {
    id: string
    label: string
    featureIndex: string
    minLevel: number
    options: LocalFeatureOption[]
  }[]
}

// ─── Fighting Style Options ───

const FIGHTING_STYLES: LocalFeatureOption[] = [
  {
    index: 'fighting-style-archery',
    name: 'Fighting Style: Archery',
    description: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
  },
  {
    index: 'fighting-style-defense',
    name: 'Fighting Style: Defense',
    description: 'While you are wearing armor, you gain a +1 bonus to AC.',
  },
  {
    index: 'fighting-style-dueling',
    name: 'Fighting Style: Dueling',
    description:
      'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
  },
  {
    index: 'fighting-style-great-weapon-fighting',
    name: 'Fighting Style: Great Weapon Fighting',
    description:
      'When you roll a 1 or 2 on a damage die for an attack you make with a two-handed or versatile melee weapon, you can reroll the die and must use the new roll.',
  },
  {
    index: 'fighting-style-protection',
    name: 'Fighting Style: Protection',
    description:
      'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.',
  },
  {
    index: 'fighting-style-two-weapon-fighting',
    name: 'Fighting Style: Two-Weapon Fighting',
    description:
      'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.',
  },
]

// Paladin has a slightly different set (no Archery, no Two-Weapon Fighting)
const PALADIN_FIGHTING_STYLES = FIGHTING_STYLES.filter(
  (fs) =>
    !fs.index.includes('archery') && !fs.index.includes('two-weapon')
)

// Ranger gets Archery, Defense, Dueling, Two-Weapon Fighting
const RANGER_FIGHTING_STYLES = FIGHTING_STYLES.filter(
  (fs) =>
    !fs.index.includes('great-weapon') && !fs.index.includes('protection')
)

// Dragon-Rider gets Archery, Defense, Dueling, Mounted Combatant, Two-Weapon Fighting
const DRAGON_RIDER_FIGHTING_STYLES: LocalFeatureOption[] = [
  ...FIGHTING_STYLES.filter(
    (fs) => !fs.index.includes('great-weapon') && !fs.index.includes('protection')
  ),
  {
    index: 'fighting-style-mounted-combatant',
    name: 'Fighting Style: Mounted Combatant',
    description:
      'While mounted (including on your dragon), you gain a +1 bonus to attack rolls and AC.',
  },
]

// ─── Class Data ───

export const CLASS_CHOICES: Record<string, ClassChoiceData> = {
  artificer: {
    subclassLabel: 'Artificer Specialist',
    subclassLevel: 3,
    subclasses: [
      { index: 'alchemist', name: 'Alchemist', description: 'An Artificer who specializes in using alchemy to heal and deal damage. Alchemists create experimental elixirs that produce unpredictable but potent effects.' },
      { index: 'armorer', name: 'Armorer', description: 'An Artificer who specializes in crafting and wearing magical armor. Armorers modify their armor to serve as a conduit for their magical abilities.' },
      { index: 'artillerist', name: 'Artillerist', description: 'An Artificer who specializes in crafting magical cannons. Artillerists use their arcane talents to create explosive and defensive turrets.' },
      { index: 'battle-smith', name: 'Battle Smith', description: 'An Artificer who specializes in combat support. Battle Smiths create a Steel Defender companion and use Intelligence for weapon attacks.' },
    ],
    featureChoices: [],
  },

  barbarian: {
    subclassLabel: 'Primal Path',
    subclassLevel: 3,
    subclasses: [
      { index: 'berserker', name: 'Path of the Berserker', description: 'A path of untrammeled fury that channels raw violence into a devastating frenzy. Berserkers embrace the chaos of battle, gaining abilities like Frenzy, Mindless Rage, and Retaliation.' },
      { index: 'wild-heart', name: 'Path of the Wild Heart', description: 'A spiritual journey that forges a bond with nature spirits. Wild Heart barbarians draw on the natural world, choosing animal aspects that grant powers like Eagle flight, Wolf pack tactics, or Bear resilience.' },
      { index: 'world-tree', name: 'Path of the World Tree', description: 'Barbarians connected to the World Tree who can use their rage to create portals and protect allies. They draw vitality from the roots of the cosmic tree.' },
      { index: 'zealot', name: 'Path of the Zealot', description: 'Warriors fueled by divine fury. Zealots channel their rage into divine power, dealing extra Radiant or Necrotic damage and becoming increasingly difficult to kill permanently.' },
    ],
    featureChoices: [],
  },

  bard: {
    subclassLabel: 'Bard College',
    subclassLevel: 3,
    subclasses: [
      { index: 'dance', name: 'College of Dance', description: 'Bards who channel magic through graceful movement. Dancers use their art to bolster allies and confound enemies, gaining supernatural agility and the ability to move without provoking opportunity attacks.' },
      { index: 'glamour', name: 'College of Glamour', description: 'Bards who have mastered the art of fey magic, weaving enchantments that beguile and captivate. Their performances inspire awe and can command the attention of all who hear them.' },
      { index: 'lore', name: 'College of Lore', description: 'Scholars and collectors of knowledge from every tradition. Lore bards pursue learning above all else, wielding Cutting Words and gaining additional Magical Secrets earlier than other bards.' },
      { index: 'valor', name: 'College of Valor', description: 'Warriors and skalds who inspire heroism through tales of great deeds. Valor bards are comfortable on the front lines, gaining Extra Attack and the ability to inspire allies with Combat Inspiration.' },
      { index: 'whispers', name: 'College of Whispers', description: 'Bards who use their knowledge and magic to uncover secrets and turn them against others. They appear as any other bard, but beneath the songs and stories lies a spy, a blackmailer, and a killer who wields fear and stolen identities as weapons.' },
    ],
    featureChoices: [],
  },

  cleric: {
    subclassLabel: 'Divine Domain',
    subclassLevel: 3,
    subclasses: [
      {
        index: 'life',
        name: 'Life Domain',
        description: 'Champions of vitality and healing. Life clerics are among the most potent healers, gaining bonus healing, Heavy armor proficiency, and the ability to heal multiple creatures at once.',
        spells: [
          { name: 'Bless', index: 'bless', level: 1, grantedAtLevel: 3 },
          { name: 'Cure Wounds', index: 'cure-wounds', level: 1, grantedAtLevel: 3 },
          { name: 'Aid', index: 'aid', level: 2, grantedAtLevel: 5 },
          { name: 'Lesser Restoration', index: 'lesser-restoration', level: 2, grantedAtLevel: 5 },
          { name: 'Mass Healing Word', index: 'mass-healing-word', level: 3, grantedAtLevel: 7 },
          { name: 'Revivify', index: 'revivify', level: 3, grantedAtLevel: 7 },
          { name: 'Aura of Life', index: 'aura-of-life', level: 4, grantedAtLevel: 9 },
          { name: 'Death Ward', index: 'death-ward', level: 4, grantedAtLevel: 9 },
          { name: 'Greater Restoration', index: 'greater-restoration', level: 5, grantedAtLevel: 9 },
          { name: 'Mass Cure Wounds', index: 'mass-cure-wounds', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'light',
        name: 'Light Domain',
        description: 'Agents of radiance and renewal who wield the cleansing power of fire and light. Light clerics drive back darkness with Warding Flare, Radiance of the Dawn, and powerful fire spells.',
        spells: [
          { name: 'Burning Hands', index: 'burning-hands', level: 1, grantedAtLevel: 3 },
          { name: 'Faerie Fire', index: 'faerie-fire', level: 1, grantedAtLevel: 3 },
          { name: 'Flaming Sphere', index: 'flaming-sphere', level: 2, grantedAtLevel: 5 },
          { name: 'Scorching Ray', index: 'scorching-ray', level: 2, grantedAtLevel: 5 },
          { name: 'Daylight', index: 'daylight', level: 3, grantedAtLevel: 7 },
          { name: 'Fireball', index: 'fireball', level: 3, grantedAtLevel: 7 },
          { name: 'Arcane Eye', index: 'arcane-eye', level: 4, grantedAtLevel: 9 },
          { name: 'Wall of Fire', index: 'wall-of-fire', level: 4, grantedAtLevel: 9 },
          { name: 'Flame Strike', index: 'flame-strike', level: 5, grantedAtLevel: 9 },
          { name: 'Scrying', index: 'scrying', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'trickery',
        name: 'Trickery Domain',
        description: 'Devotees of mischief, deception, and illusion. Trickery clerics are cunning agents who use stealth, duplicity, and magical deception including an illusory duplicate of themselves.',
        spells: [
          { name: 'Charm Person', index: 'charm-person', level: 1, grantedAtLevel: 3 },
          { name: 'Disguise Self', index: 'disguise-self', level: 1, grantedAtLevel: 3 },
          { name: 'Mirror Image', index: 'mirror-image', level: 2, grantedAtLevel: 5 },
          { name: 'Pass without Trace', index: 'pass-without-trace', level: 2, grantedAtLevel: 5 },
          { name: 'Hypnotic Pattern', index: 'hypnotic-pattern', level: 3, grantedAtLevel: 7 },
          { name: 'Nondetection', index: 'nondetection', level: 3, grantedAtLevel: 7 },
          { name: 'Confusion', index: 'confusion', level: 4, grantedAtLevel: 9 },
          { name: 'Dimension Door', index: 'dimension-door', level: 4, grantedAtLevel: 9 },
          { name: 'Dominate Person', index: 'dominate-person', level: 5, grantedAtLevel: 9 },
          { name: 'Modify Memory', index: 'modify-memory', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'war',
        name: 'War Domain',
        description: 'Holy warriors who channel divine fury into martial excellence. War clerics are formidable combatants who gain bonus attacks, guided strikes, and the ability to resist damage.',
        spells: [
          { name: 'Divine Favor', index: 'divine-favor', level: 1, grantedAtLevel: 3 },
          { name: 'Shield of Faith', index: 'shield-of-faith', level: 1, grantedAtLevel: 3 },
          { name: 'Magic Weapon', index: 'magic-weapon', level: 2, grantedAtLevel: 5 },
          { name: 'Spiritual Weapon', index: 'spiritual-weapon', level: 2, grantedAtLevel: 5 },
          { name: 'Crusader\'s Mantle', index: 'crusaders-mantle', level: 3, grantedAtLevel: 7 },
          { name: 'Spirit Guardians', index: 'spirit-guardians', level: 3, grantedAtLevel: 7 },
          { name: 'Freedom of Movement', index: 'freedom-of-movement', level: 4, grantedAtLevel: 9 },
          { name: 'Stoneskin', index: 'stoneskin', level: 4, grantedAtLevel: 9 },
          { name: 'Flame Strike', index: 'flame-strike', level: 5, grantedAtLevel: 9 },
          { name: 'Hold Monster', index: 'hold-monster', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'peace',
        name: 'Peace Domain',
        description: 'Clerics who weave bonds of unity and protection among allies. Peace clerics empower their companions with emboldening bonds, share one another\'s burdens through protective links, and mend wounds with serene radiance. Adapted from Tasha\'s Cauldron of Everything.',
        spells: [
          { name: 'Heroism', index: 'heroism', level: 1, grantedAtLevel: 3 },
          { name: 'Sanctuary', index: 'sanctuary', level: 1, grantedAtLevel: 3 },
          { name: 'Aid', index: 'aid', level: 2, grantedAtLevel: 3 },
          { name: 'Warding Bond', index: 'warding-bond', level: 2, grantedAtLevel: 3 },
          { name: 'Beacon of Hope', index: 'beacon-of-hope', level: 3, grantedAtLevel: 5 },
          { name: 'Sending', index: 'sending', level: 3, grantedAtLevel: 5 },
          { name: 'Aura of Purity', index: 'aura-of-purity', level: 4, grantedAtLevel: 7 },
          { name: 'Otiluke\'s Resilient Sphere', index: 'otilukes-resilient-sphere', level: 4, grantedAtLevel: 7 },
          { name: 'Greater Restoration', index: 'greater-restoration', level: 5, grantedAtLevel: 9 },
          { name: 'Rary\'s Telepathic Bond', index: 'rarys-telepathic-bond', level: 5, grantedAtLevel: 9 },
        ],
      },
    ],
    featureChoices: [],
  },

  druid: {
    subclassLabel: 'Druid Circle',
    subclassLevel: 3,
    subclasses: [
      { index: 'land', name: 'Circle of the Land', description: 'Mystics and sages who draw on the magical essence of a particular terrain. Land druids gain bonus spells tied to a biome and can recover spell slots during Short Rests.' },
      { index: 'moon', name: 'Circle of the Moon', description: 'Guardians of the wild who master the art of shapeshifting. Moon druids can transform into more powerful beast forms as a Bonus Action and eventually cast spells while in Wild Shape.' },
      { index: 'sea', name: 'Circle of the Sea', description: 'Druids attuned to the power of ocean currents and tidal forces. Sea druids wield water and lightning, gaining aquatic abilities and the power to call down storms.' },
      { index: 'stars', name: 'Circle of the Stars', description: 'Druids who draw on the power of starlight. Stars druids can assume a Starry Form that grants different constellations\' powers — Archer for ranged attacks, Chalice for healing, or Dragon for concentration.' },
    ],
    featureChoices: [],
  },

  fighter: {
    subclassLabel: 'Fighter Subclass',
    subclassLevel: 3,
    subclasses: [
      { index: 'battle-master', name: 'Battle Master', description: 'A tactical expert who employs special combat maneuvers. Battle Masters use superiority dice to perform techniques like disarming strikes, ripostes, and commanding strikes.' },
      { index: 'champion', name: 'Champion', description: 'A fighter who hones raw physical power to deadly perfection. Champions focus on straightforward combat excellence with Improved Critical, Remarkable Athlete, and Superior Critical.' },
      { index: 'eldritch-knight', name: 'Eldritch Knight', description: 'A warrior who combines martial skill with arcane magic. Eldritch Knights learn wizard spells to enhance their combat abilities, eventually bonding a weapon and casting with attacks.' },
      { index: 'psi-warrior', name: 'Psi Warrior', description: 'A fighter who augments physical might with psi-infused weapon strikes, telekinetic lashes, and barriers of mental force. Psi Warriors use Psionic Energy dice to fuel their abilities.' },
      { index: 'echo-knight', name: 'Echo Knight', description: 'A fighter who harnesses echoes from alternate timelines, manifesting a ghostly duplicate of themselves to strike from afar, guard allies, and fight as a legion of one.' },
    ],
    featureChoices: [
      {
        id: 'fighting-style',
        label: 'Fighting Style',
        featureIndex: 'fighter-fighting-style',
        minLevel: 1,
        options: FIGHTING_STYLES,
      },
    ],
  },

  monk: {
    subclassLabel: 'Monk Subclass',
    subclassLevel: 3,
    subclasses: [
      { index: 'open-hand', name: 'Warrior of the Open Hand', description: 'Masters of unarmed martial arts who use their Focus to manipulate foes. Open Hand warriors can knock enemies prone, push them away, or deny them reactions with their Flurry of Blows.' },
      { index: 'shadow', name: 'Warrior of Shadow', description: 'Practitioners who harness darkness and stealth as weapons. Shadow warriors can teleport between shadows, create zones of darkness, and become nearly invisible in dim light.',
        spells: [
          { name: 'Minor Illusion', index: 'minor-illusion', level: 0, grantedAtLevel: 3 },
        ],
      },
      { index: 'elements', name: 'Warrior of the Elements', description: 'Monks who channel elemental forces through their martial arts. They can wreathe themselves in elemental energy, dealing extra damage and gaining elemental abilities.' },
      { index: 'mercy', name: 'Warrior of Mercy', description: 'Monks who learn to manipulate the life force of others. Warriors of Mercy can heal allies with Hands of Healing and harm enemies with Hands of Harm using their Focus Points.' },
    ],
    featureChoices: [],
  },

  paladin: {
    subclassLabel: 'Sacred Oath',
    subclassLevel: 3,
    subclasses: [
      {
        index: 'devotion',
        name: 'Oath of Devotion',
        description: 'Paladins bound to the highest ideals of justice, virtue, and order. Devotion paladins radiate holy light, can turn the unholy, and emit a powerful aura of devotion.',
        spells: [
          { name: 'Protection from Evil and Good', index: 'protection-from-evil-and-good', level: 1, grantedAtLevel: 3 },
          { name: 'Shield of Faith', index: 'shield-of-faith', level: 1, grantedAtLevel: 3 },
          { name: 'Aid', index: 'aid', level: 2, grantedAtLevel: 5 },
          { name: 'Zone of Truth', index: 'zone-of-truth', level: 2, grantedAtLevel: 5 },
          { name: 'Beacon of Hope', index: 'beacon-of-hope', level: 3, grantedAtLevel: 9 },
          { name: 'Dispel Magic', index: 'dispel-magic', level: 3, grantedAtLevel: 9 },
          { name: 'Freedom of Movement', index: 'freedom-of-movement', level: 4, grantedAtLevel: 13 },
          { name: 'Guardian of Faith', index: 'guardian-of-faith', level: 4, grantedAtLevel: 13 },
          { name: 'Commune', index: 'commune', level: 5, grantedAtLevel: 17 },
          { name: 'Flame Strike', index: 'flame-strike', level: 5, grantedAtLevel: 17 },
        ],
      },
      {
        index: 'glory',
        name: 'Oath of Glory',
        description: 'Paladins who believe they are destined for greatness. Glory paladins inspire allies with Peerless Athlete, Inspiring Smite, and an Aura of Alacrity that increases speed.',
        spells: [
          { name: 'Guiding Bolt', index: 'guiding-bolt', level: 1, grantedAtLevel: 3 },
          { name: 'Heroism', index: 'heroism', level: 1, grantedAtLevel: 3 },
          { name: 'Enhance Ability', index: 'enhance-ability', level: 2, grantedAtLevel: 5 },
          { name: 'Magic Weapon', index: 'magic-weapon', level: 2, grantedAtLevel: 5 },
          { name: 'Haste', index: 'haste', level: 3, grantedAtLevel: 9 },
          { name: 'Protection from Energy', index: 'protection-from-energy', level: 3, grantedAtLevel: 9 },
          { name: 'Compulsion', index: 'compulsion', level: 4, grantedAtLevel: 13 },
          { name: 'Freedom of Movement', index: 'freedom-of-movement', level: 4, grantedAtLevel: 13 },
          { name: 'Legend Lore', index: 'legend-lore', level: 5, grantedAtLevel: 17 },
          { name: 'Yolande\'s Regal Presence', index: 'yolandes-regal-presence', level: 5, grantedAtLevel: 17 },
        ],
      },
      {
        index: 'ancients',
        name: 'Oath of the Ancients',
        description: 'Protectors of light and life who swear to preserve the beauty and joy of the world. Ancients paladins resist dark magic and ensnare foes with the power of nature.',
        spells: [
          { name: 'Ensnaring Strike', index: 'ensnaring-strike', level: 1, grantedAtLevel: 3 },
          { name: 'Speak with Animals', index: 'speak-with-animals', level: 1, grantedAtLevel: 3 },
          { name: 'Misty Step', index: 'misty-step', level: 2, grantedAtLevel: 5 },
          { name: 'Moonbeam', index: 'moonbeam', level: 2, grantedAtLevel: 5 },
          { name: 'Plant Growth', index: 'plant-growth', level: 3, grantedAtLevel: 9 },
          { name: 'Protection from Energy', index: 'protection-from-energy', level: 3, grantedAtLevel: 9 },
          { name: 'Ice Storm', index: 'ice-storm', level: 4, grantedAtLevel: 13 },
          { name: 'Stoneskin', index: 'stoneskin', level: 4, grantedAtLevel: 13 },
          { name: 'Commune with Nature', index: 'commune-with-nature', level: 5, grantedAtLevel: 17 },
          { name: 'Tree Stride', index: 'tree-stride', level: 5, grantedAtLevel: 17 },
        ],
      },
      {
        index: 'vengeance',
        name: 'Oath of Vengeance',
        description: 'Relentless hunters who pursue the wicked with single-minded determination. Vengeance paladins gain powers to track and punish evildoers with Vow of Enmity and Relentless Avenger.',
        spells: [
          { name: 'Bane', index: 'bane', level: 1, grantedAtLevel: 3 },
          { name: "Hunter's Mark", index: 'hunters-mark', level: 1, grantedAtLevel: 3 },
          { name: 'Hold Person', index: 'hold-person', level: 2, grantedAtLevel: 5 },
          { name: 'Misty Step', index: 'misty-step', level: 2, grantedAtLevel: 5 },
          { name: 'Haste', index: 'haste', level: 3, grantedAtLevel: 9 },
          { name: 'Protection from Energy', index: 'protection-from-energy', level: 3, grantedAtLevel: 9 },
          { name: 'Banishment', index: 'banishment', level: 4, grantedAtLevel: 13 },
          { name: 'Dimension Door', index: 'dimension-door', level: 4, grantedAtLevel: 13 },
          { name: 'Hold Monster', index: 'hold-monster', level: 5, grantedAtLevel: 17 },
          { name: 'Scrying', index: 'scrying', level: 5, grantedAtLevel: 17 },
        ],
      },
    ],
    featureChoices: [
      { id: 'fighting-style', label: 'Fighting Style', featureIndex: 'paladin-fighting-style', minLevel: 2, options: PALADIN_FIGHTING_STYLES },
    ],
  },

  ranger: {
    subclassLabel: 'Ranger Subclass',
    subclassLevel: 3,
    subclasses: [
      { index: 'beast-master', name: 'Beast Master', description: 'Rangers who forge a mystical bond with a Primal Companion. Beast Masters fight alongside their animal ally, commanding it in battle and sharing an instinctive connection.' },
      { index: 'fey-wanderer', name: 'Fey Wanderer', description: 'Rangers who draw on fey magic to guard the boundary between the mortal realm and the Feywild. They gain Otherworldly Glamour, Beguiling Twist, and can summon fey allies.' },
      { index: 'gloom-stalker', name: 'Gloom Stalker', description: 'Rangers at home in the darkest places. Gloom Stalkers are invisible to darkvision, strike with Dread Ambusher for extra attacks on the first turn, and gain an Iron Mind against fear and charm.' },
      { index: 'hunter', name: 'Hunter', description: 'Rangers who specialize in bringing down dangerous prey. Hunters choose tactical abilities like Colossus Slayer, Horde Breaker, or Giant Killer to fight hordes or powerful single targets.' },
    ],
    featureChoices: [
      { id: 'fighting-style', label: 'Fighting Style', featureIndex: 'ranger-fighting-style', minLevel: 2, options: RANGER_FIGHTING_STYLES },
    ],
  },

  rogue: {
    subclassLabel: 'Rogue Subclass',
    subclassLevel: 3,
    subclasses: [
      { index: 'arcane-trickster', name: 'Arcane Trickster', description: 'Rogues who augment their stealth with enchantment and illusion magic. Arcane Tricksters use wizard spells to distract, confuse, and outmaneuver their opponents.' },
      { index: 'assassin', name: 'Assassin', description: 'Deadly killers who specialize in striking unsuspecting targets. Assassins gain proficiency with disguise and poison kits, Assassinate for devastating first strikes, and Infiltration Expertise.' },
      { index: 'soulknife', name: 'Soulknife', description: 'Rogues who strike with psionic blades formed from their mind. Soulknives use Psionic Energy dice, can communicate telepathically, and create psychic blades for melee and ranged attacks.' },
      { index: 'thief', name: 'Thief', description: 'Masters of stealth and infiltration who excel at burglary and nimble escapes. Thieves can use objects as Bonus Actions with Fast Hands, climb with Second-Story Work, and gain Supreme Sneak.' },
    ],
    featureChoices: [],
  },

  sorcerer: {
    subclassLabel: 'Sorcerer Subclass',
    subclassLevel: 3,
    subclasses: [
      { index: 'aberrant', name: 'Aberrant Sorcery', description: 'Sorcerers touched by the Far Realm or aberrant forces. They gain telepathic abilities, can warp space around them, and eventually transform into an aberrant form with powerful psychic abilities.' },
      { index: 'clockwork', name: 'Clockwork Sorcery', description: 'Sorcerers infused with the power of order from Mechanus. They can restore balance by canceling advantage or disadvantage, gain armor-like protection, and impose order on the chaos of combat.' },
      { index: 'draconic', name: 'Draconic Sorcery', description: 'Sorcerers whose power traces back to a draconic ancestor. They manifest dragon-like traits including resilient scales, elemental affinity, and eventually dragon wings.' },
      { index: 'wild-magic', name: 'Wild Magic Sorcery', description: 'Sorcerers whose innate magic is volatile and unpredictable. Wild Magic sorcerers can bend luck with Tides of Chaos but risk triggering chaotic Wild Magic Surges.' },
    ],
    featureChoices: [
      {
        id: 'metamagic',
        label: 'Metamagic',
        featureIndex: 'sorcerer-metamagic',
        minLevel: 2,
        options: [
          { index: 'metamagic-careful', name: 'Careful Spell', description: 'Protect chosen creatures from your area spells, allowing them to automatically succeed on their saving throws. (1 Sorcery Point)' },
          { index: 'metamagic-distant', name: 'Distant Spell', description: 'Double the range of a spell, or give a touch-range spell a range of 30 feet. (1 Sorcery Point)' },
          { index: 'metamagic-empowered', name: 'Empowered Spell', description: 'Reroll a number of damage dice up to your Charisma modifier and use the new rolls. (1 Sorcery Point)' },
          { index: 'metamagic-extended', name: 'Extended Spell', description: 'Double the duration of a spell (max 24 hours). (1 Sorcery Point)' },
          { index: 'metamagic-heightened', name: 'Heightened Spell', description: 'Give one target Disadvantage on its first saving throw against the spell. (2 Sorcery Points)' },
          { index: 'metamagic-quickened', name: 'Quickened Spell', description: 'Change the casting time from an action to a Bonus Action. (2 Sorcery Points)' },
          { index: 'metamagic-seeking', name: 'Seeking Spell', description: 'If you miss with a spell attack, reroll the d20. (1 Sorcery Point)' },
          { index: 'metamagic-subtle', name: 'Subtle Spell', description: 'Cast a spell without Verbal, Somatic, or non-consumed Material components. (1 Sorcery Point)' },
          { index: 'metamagic-transmuted', name: 'Transmuted Spell', description: 'Change the damage type to Acid, Cold, Fire, Lightning, Poison, or Thunder. (1 Sorcery Point)' },
          { index: 'metamagic-twinned', name: 'Twinned Spell', description: 'Increase the spell\'s effective level by 1 to target an additional creature. (Sorcery Points = spell level)' },
        ],
      },
    ],
  },

  warlock: {
    subclassLabel: 'Otherworldly Patron',
    subclassLevel: 3,
    subclasses: [
      {
        index: 'archfey',
        name: 'Archfey Patron',
        description: 'A pact with a lord or lady of the fey, granting powers of charm and illusion. Archfey warlocks can beguile enemies with Steps of the Fey, Misty Escape, and Beguiling Defenses.',
        spells: [
          { name: 'Calm Emotions', index: 'calm-emotions', level: 2, grantedAtLevel: 3 },
          { name: 'Faerie Fire', index: 'faerie-fire', level: 1, grantedAtLevel: 3 },
          { name: 'Misty Step', index: 'misty-step', level: 2, grantedAtLevel: 3 },
          { name: 'Sleep', index: 'sleep', level: 1, grantedAtLevel: 3 },
          { name: 'Blink', index: 'blink', level: 3, grantedAtLevel: 5 },
          { name: 'Plant Growth', index: 'plant-growth', level: 3, grantedAtLevel: 5 },
          { name: 'Dominate Beast', index: 'dominate-beast', level: 4, grantedAtLevel: 7 },
          { name: 'Greater Invisibility', index: 'greater-invisibility', level: 4, grantedAtLevel: 7 },
          { name: 'Dominate Person', index: 'dominate-person', level: 5, grantedAtLevel: 9 },
          { name: 'Seeming', index: 'seeming', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'celestial',
        name: 'Celestial Patron',
        description: 'A pact with a being of the Upper Planes such as an empyrean, solar, or unicorn. Celestial warlocks gain healing abilities with Healing Light and can add Radiant or Fire damage to their attacks.',
        spells: [
          { name: 'Cure Wounds', index: 'cure-wounds', level: 1, grantedAtLevel: 3 },
          { name: 'Guiding Bolt', index: 'guiding-bolt', level: 1, grantedAtLevel: 3 },
          { name: 'Flaming Sphere', index: 'flaming-sphere', level: 2, grantedAtLevel: 3 },
          { name: 'Lesser Restoration', index: 'lesser-restoration', level: 2, grantedAtLevel: 3 },
          { name: 'Daylight', index: 'daylight', level: 3, grantedAtLevel: 5 },
          { name: 'Revivify', index: 'revivify', level: 3, grantedAtLevel: 5 },
          { name: 'Guardian of Faith', index: 'guardian-of-faith', level: 4, grantedAtLevel: 7 },
          { name: 'Wall of Fire', index: 'wall-of-fire', level: 4, grantedAtLevel: 7 },
          { name: 'Greater Restoration', index: 'greater-restoration', level: 5, grantedAtLevel: 9 },
          { name: 'Summon Celestial', index: 'summon-celestial', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'fiend',
        name: 'Fiend Patron',
        description: 'A bargain with a being from the Lower Planes. Fiend warlocks gain temporary hit points from slaying foes with Dark One\'s Blessing, and can hurl hellfire with Hurl Through Hell.',
        spells: [
          { name: 'Burning Hands', index: 'burning-hands', level: 1, grantedAtLevel: 3 },
          { name: 'Command', index: 'command', level: 1, grantedAtLevel: 3 },
          { name: 'Scorching Ray', index: 'scorching-ray', level: 2, grantedAtLevel: 3 },
          { name: 'Suggestion', index: 'suggestion', level: 2, grantedAtLevel: 3 },
          { name: 'Fireball', index: 'fireball', level: 3, grantedAtLevel: 5 },
          { name: 'Stinking Cloud', index: 'stinking-cloud', level: 3, grantedAtLevel: 5 },
          { name: 'Fire Shield', index: 'fire-shield', level: 4, grantedAtLevel: 7 },
          { name: 'Wall of Fire', index: 'wall-of-fire', level: 4, grantedAtLevel: 7 },
          { name: 'Geas', index: 'geas', level: 5, grantedAtLevel: 9 },
          { name: 'Insect Plague', index: 'insect-plague', level: 5, grantedAtLevel: 9 },
        ],
      },
      {
        index: 'great-old-one',
        name: 'Great Old One Patron',
        description: 'A connection to an incomprehensible entity from beyond the stars. Great Old One warlocks gain telepathic abilities, can assault minds with Psychic Spells, and create Thought Shield protection.',
        spells: [
          { name: 'Dissonant Whispers', index: 'dissonant-whispers', level: 1, grantedAtLevel: 3 },
          { name: "Tasha's Hideous Laughter", index: 'tashas-hideous-laughter', level: 1, grantedAtLevel: 3 },
          { name: 'Detect Thoughts', index: 'detect-thoughts', level: 2, grantedAtLevel: 3 },
          { name: 'Phantasmal Force', index: 'phantasmal-force', level: 2, grantedAtLevel: 3 },
          { name: 'Clairvoyance', index: 'clairvoyance', level: 3, grantedAtLevel: 5 },
          { name: 'Hunger of Hadar', index: 'hunger-of-hadar', level: 3, grantedAtLevel: 5 },
          { name: 'Compulsion', index: 'compulsion', level: 4, grantedAtLevel: 7 },
          { name: 'Evard\'s Black Tentacles', index: 'evards-black-tentacles', level: 4, grantedAtLevel: 7 },
          { name: 'Modify Memory', index: 'modify-memory', level: 5, grantedAtLevel: 9 },
          { name: 'Telekinesis', index: 'telekinesis', level: 5, grantedAtLevel: 9 },
        ],
      },
    ],
    featureChoices: [],
  },

  wizard: {
    subclassLabel: 'Arcane Tradition',
    subclassLevel: 3,
    subclasses: [
      { index: 'abjuration', name: 'School of Abjuration', description: 'Specialists in protective magic who create barriers, negate harmful effects, and banish intruders. Abjurers generate an Arcane Ward that absorbs damage and strengthens with each abjuration spell cast.' },
      { index: 'divination', name: 'School of Divination', description: 'Seers who peer into the past, present, and future. Diviners roll Portent dice each morning that can replace any attack roll, saving throw, or ability check they witness during the day.' },
      { index: 'evocation', name: 'School of Evocation', description: 'Wielders of raw elemental energy who specialize in damage-dealing spells. Evokers can Sculpt Spells to protect allies caught in the blast and eventually Overchannel for maximum damage.' },
      { index: 'illusion', name: 'School of Illusion', description: 'Tricksters who weave shadow, sound, and false images to deceive. Illusionists can alter their illusions on the fly with Malleable Illusions and eventually make them semi-real with Illusory Reality.' },
    ],
    featureChoices: [],
  },

  barriomancer: {
    subclassLabel: 'Barrier Force',
    subclassLevel: 3,
    subclasses: [
      {
        index: 'guardian-force',
        name: 'Guardian Force',
        description: 'The ultimate protector. Guardian Force Barriomancers specialize in absorbing damage, shielding allies, and standing as an immovable wall between their party and harm.',
      },
      {
        index: 'elemental-force',
        name: 'Elemental Force',
        description: 'Harness the elements through your barriers. Elemental Force Barriomancers infuse their defenses with fire, ice, earth, wind, light, and shadow to grant offensive capabilities alongside protection.',
      },
      {
        index: 'blood-force',
        name: 'Blood Force',
        description: 'Channel the power of blood and vitality. Blood Force Barriomancers focus on healing, life-stealing barriers, and keeping their allies alive through sanguine magic.',
      },
      {
        index: 'soul-force',
        name: 'Soul Force',
        description: 'Call upon animal spirits to enhance your barriers. Soul Force Barriomancers grant their allies the aspects of bear, eagle, wolf, raven, snake, and fox alongside protective wards.',
      },
    ],
    featureChoices: [],
  },

  'dragon-rider': {
    subclassLabel: 'Rider Path',
    subclassLevel: 3,
    subclasses: [
      {
        index: 'skylance',
        name: 'Path of the Skylance',
        description: 'Aerial cavalry — heavy armor, long reach, and a dragon as both mount and weapon. Skylances are the knights of the dragon-bonded: they fight from the saddle, charge through the sky, and break enemy lines with the weight of two bodies moving as one.',
      },
      {
        index: 'wyrmbond',
        name: 'Path of the Wyrmbond',
        description: 'Soul-fusion — you and your dragon are not partners; you are halves of a single being. The Wyrmbond fights as a fused entity, slipping in and out of merged form, blending soul and scale.',
      },
      {
        index: 'stormcaller',
        name: 'Path of the Stormcaller',
        description: 'Ranged elementalists — bow and breath, raining down ruin from a distance. Stormcallers fight from above, behind, and beyond, letting their dragon bring the wind and thunder while they rain arrows.',
      },
    ],
    featureChoices: [
      {
        id: 'fighting-style',
        label: 'Fighting Style',
        featureIndex: 'dr-fighting-style',
        minLevel: 1,
        options: DRAGON_RIDER_FIGHTING_STYLES,
      },
    ],
  },
}

/** Get class choice data, returning undefined if class is not found */
export function getClassChoiceData(classIndex: string): ClassChoiceData | undefined {
  return CLASS_CHOICES[classIndex.toLowerCase()]
}

/** Get the spells granted by a specific subclass, filtered by character level */
export function getSubclassSpells(
  classIndex: string,
  subclassIndex: string,
  characterLevel?: number
): SubclassSpell[] {
  const data = CLASS_CHOICES[classIndex.toLowerCase()]
  if (!data) return []
  const subclass = data.subclasses.find((s) => s.index === subclassIndex)
  if (!subclass?.spells) return []
  if (characterLevel === undefined) return subclass.spells
  return subclass.spells.filter((s) => s.grantedAtLevel <= characterLevel)
}
