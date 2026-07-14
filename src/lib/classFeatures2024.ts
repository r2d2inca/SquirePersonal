/**
 * 2024 PHB class features data — replaces the 2014 SRD API for class level progression.
 * Data sourced from the D&D 2024 Wikidot and Dylan's Squire Overhaul doc.
 *
 * Each class has:
 * - A level table (features gained at each level 1-20)
 * - Detailed feature descriptions
 * - Class-specific resource tracking (rage count, focus points, etc.)
 */

import type { SRDClassLevel, SRDFeatureSummary, SRDFeatureDetail } from './dnd5e'
import { getSpellcasting2024, getWarlockPactMagic } from './spellcastingData'

// ─── Types ───

export interface ClassFeature2024 {
  index: string
  name: string
  level: number
  description: string[]
  // If true, the feature involves a player choice (subclass, ASI/feat, etc.)
  hasChoice?: boolean
  // If this feature grants something automatically
  grants?: {
    proficiencies?: string[]
    spells?: string[]
    resources?: { name: string; amount: number | string }[]
  }
}

export interface ClassLevelTable2024 {
  level: number
  profBonus: number
  features: string[] // feature names at this level
  classSpecific?: Record<string, number | string>
}

export interface ClassData2024 {
  index: string
  name: string
  hitDie: number
  primaryAbility: string
  savingThrows: string[]
  armorTraining: string[]
  weaponProficiencies: string[]
  toolProficiencies: string[]
  skillChoices: { choose: number; from: string[] }
  startingEquipment: string
  levelTable: ClassLevelTable2024[]
  features: ClassFeature2024[]
}

// ─── Helper to convert our data to SRD-compatible types ───

function toSRDFeatureSummary(f: ClassFeature2024): SRDFeatureSummary {
  return { index: f.index, name: f.name, url: '' }
}

function toSRDFeatureDetail(f: ClassFeature2024, className: string): SRDFeatureDetail {
  return {
    index: f.index,
    name: f.name,
    desc: f.description,
    level: f.level,
    class: { index: className.toLowerCase(), name: className },
  }
}

function toSRDClassLevel(entry: ClassLevelTable2024, allFeatures: ClassFeature2024[], classIndex: string): SRDClassLevel {
  const features = entry.features
    .map(name => allFeatures.find(f => f.name === name && f.level === entry.level))
    .filter((f): f is ClassFeature2024 => f !== undefined)
    .map(toSRDFeatureSummary)

  // Build spellcasting data from local progression tables
  let spellcasting: SRDClassLevel['spellcasting'] | undefined
  if (classIndex === 'warlock') {
    const pact = getWarlockPactMagic(entry.level)
    const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    slots[pact.slotLevel - 1] = pact.pactSlots
    spellcasting = {
      cantrips_known: pact.cantripsKnown,
      spells_known: pact.spellsKnown,
      spell_slots_level_1: slots[0],
      spell_slots_level_2: slots[1],
      spell_slots_level_3: slots[2],
      spell_slots_level_4: slots[3],
      spell_slots_level_5: slots[4],
      spell_slots_level_6: slots[5],
      spell_slots_level_7: slots[6],
      spell_slots_level_8: slots[7],
      spell_slots_level_9: slots[8],
    }
  } else {
    const progression = getSpellcasting2024(classIndex, entry.level)
    if (progression) {
      const s = progression.spellSlots
      spellcasting = {
        cantrips_known: progression.cantripsKnown,
        spells_known: progression.spellsKnown,
        spell_slots_level_1: s[0],
        spell_slots_level_2: s[1],
        spell_slots_level_3: s[2],
        spell_slots_level_4: s[3],
        spell_slots_level_5: s[4],
        spell_slots_level_6: s[5],
        spell_slots_level_7: s[6],
        spell_slots_level_8: s[7],
        spell_slots_level_9: s[8],
      }
    }
  }

  return {
    level: entry.level,
    ability_score_bonuses: 0,
    prof_bonus: entry.profBonus,
    features,
    spellcasting,
    class_specific: entry.classSpecific,
  }
}

// ─── Public API ───

/** Get all 2024 class data, or undefined if class not yet added */
export function getClassData2024(classIndex: string): ClassData2024 | undefined {
  return CLASS_DATA_2024[classIndex.toLowerCase()]
}

/** Check if we have 2024 data for a given class */
export function has2024ClassData(classIndex: string): boolean {
  return classIndex.toLowerCase() in CLASS_DATA_2024
}

/** Get 2024 class levels in SRD-compatible format */
export function getClassLevels2024(classIndex: string): SRDClassLevel[] | undefined {
  const data = CLASS_DATA_2024[classIndex.toLowerCase()]
  if (!data) return undefined
  return data.levelTable.map(entry => toSRDClassLevel(entry, data.features, data.index))
}

/** Get a single 2024 class level in SRD-compatible format */
export function getClassLevel2024(classIndex: string, level: number): SRDClassLevel | undefined {
  const data = CLASS_DATA_2024[classIndex.toLowerCase()]
  if (!data) return undefined
  const entry = data.levelTable.find(e => e.level === level)
  if (!entry) return undefined
  return toSRDClassLevel(entry, data.features, data.index)
}

/** Get a 2024 feature detail in SRD-compatible format */
export function getFeatureDetail2024(featureIndex: string): SRDFeatureDetail | undefined {
  for (const classData of Object.values(CLASS_DATA_2024)) {
    const feature = classData.features.find(f => f.index === featureIndex)
    if (feature) return toSRDFeatureDetail(feature, classData.name)
  }
  return undefined
}

/** Get all features for a class in SRD-compatible format */
export function getClassFeatures2024(classIndex: string): SRDFeatureSummary[] | undefined {
  const data = CLASS_DATA_2024[classIndex.toLowerCase()]
  if (!data) return undefined
  return data.features.map(toSRDFeatureSummary)
}

// ─── Class Data ───

const CLASS_DATA_2024: Record<string, ClassData2024> = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ARTIFICER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  artificer: {
    index: 'artificer',
    name: 'Artificer',
    hitDie: 8,
    primaryAbility: 'Intelligence',
    savingThrows: ['Constitution', 'Intelligence'],
    armorTraining: ['Light armor', 'Medium armor', 'Shields'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: ["Thieves' Tools", "Tinker's Tools", "One type of Artisan's Tools of your choice"],
    skillChoices: {
      choose: 2,
      from: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand'],
    },
    startingEquipment: "Choose A or B: (A) Studded Leather Armor, Dagger, Thieves' Tools, Tinker's Tools, Dungeoneer's Pack, and 16 GP; or (B) 150 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Spellcasting', "Tinker's Magic"] },
      { level: 2, profBonus: 2, features: ['Replicate Magic Item'], classSpecific: { plansKnown: 4, magicItems: 2 } },
      { level: 3, profBonus: 2, features: ['Artificer Subclass'], classSpecific: { plansKnown: 4, magicItems: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { plansKnown: 4, magicItems: 2 } },
      { level: 5, profBonus: 3, features: [], classSpecific: { plansKnown: 4, magicItems: 2 } },
      { level: 6, profBonus: 3, features: ['Magic Item Tinker'], classSpecific: { plansKnown: 5, magicItems: 3 } },
      { level: 7, profBonus: 3, features: ['Flash of Genius'], classSpecific: { plansKnown: 5, magicItems: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { plansKnown: 5, magicItems: 3 } },
      { level: 9, profBonus: 4, features: [], classSpecific: { plansKnown: 5, magicItems: 3 } },
      { level: 10, profBonus: 4, features: ['Magic Item Adept'], classSpecific: { plansKnown: 6, magicItems: 4 } },
      { level: 11, profBonus: 4, features: ['Spell-Storing Item'], classSpecific: { plansKnown: 6, magicItems: 4 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { plansKnown: 6, magicItems: 4 } },
      { level: 13, profBonus: 5, features: [], classSpecific: { plansKnown: 6, magicItems: 4 } },
      { level: 14, profBonus: 5, features: ['Advanced Artifice'], classSpecific: { plansKnown: 7, magicItems: 5 } },
      { level: 15, profBonus: 5, features: ['Subclass Feature'], classSpecific: { plansKnown: 7, magicItems: 5 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { plansKnown: 7, magicItems: 5 } },
      { level: 17, profBonus: 6, features: [], classSpecific: { plansKnown: 7, magicItems: 5 } },
      { level: 18, profBonus: 6, features: ['Magic Item Master'], classSpecific: { plansKnown: 8, magicItems: 6 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { plansKnown: 8, magicItems: 6 } },
      { level: 20, profBonus: 6, features: ['Soul of Artifice'], classSpecific: { plansKnown: 8, magicItems: 6 } },
    ],

    features: [
      {
        index: 'artificer-spellcasting',
        name: 'Spellcasting',
        level: 1,
        description: [
          'You have learned how to channel magical energy through objects. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Artificer spells, which appear in the Artificer Spell List.',
          'Tools Required. You produce your Artificer spells through tools. You can use Thieves\' Tools, Tinker\'s Tools, or another kind of Artisan\'s Tools with which you have proficiency as a Spellcasting Focus, and you must have one of those focuses in hand when you cast an Artificer spell (meaning the spell has an M component when you cast it).',
          'Cantrips. You know two Artificer cantrips of your choice. Whenever you finish a Long Rest, you can replace one of your cantrips from this feature with another Artificer cantrip of your choice. When you reach Artificer levels 10 and 14, you learn another Artificer cantrip of your choice.',
          'Spell Slots. The Artificer Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
          'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Artificer spells. The number of spells on your list increases as you gain Artificer levels, as shown in the Prepared Spells column of the Artificer Features table. Whenever that number increases, choose additional Artificer spells until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots.',
          'Changing Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Artificer spells for which you have spell slots.',
          'Spellcasting Ability. Intelligence is your spellcasting ability for your Artificer spells.',
        ],
      },
      {
        index: 'artificer-tinkers-magic',
        name: "Tinker's Magic",
        level: 1,
        description: [
          'You know the Mending cantrip.',
          "As a Magic action while holding Tinker's Tools, you can create one item in an unoccupied space within 5 feet of yourself, choosing the item from the following list: Ball Bearings, Basket, Bedroll, Bell, Blanket, Block and Tackle, Bottle (Glass), Bucket, Caltrops, Candle, Crowbar, Flask, Grappling Hook, Hunting Trap, Jug, Lamp, Manacles, Net, Oil, Paper, Parchment, Pole, Pouch, Rope, Sack, Shovel, Spikes (Iron), String, Tinderbox, Torch, Vial.",
          "See the rules for the item in the Player's Handbook. The item lasts until you finish a Long Rest, at which point it vanishes.",
          'You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
        ],
      },
      {
        index: 'artificer-replicate-magic-item',
        name: 'Replicate Magic Item',
        level: 2,
        description: [
          'You have learned arcane plans that you use to make magic items.',
          'Plans Known. When you gain this feature, choose four plans to learn from the Magic Item Plans (Artificer Level 2+) table. Whenever you gain an Artificer level, you can replace one of the plans you know with a new plan for which you qualify.',
          'You learn another plan of your choice when you reach certain Artificer levels, as shown in the Plans Known column of the Artificer Features table. When you choose a plan to learn, you choose it from any Magic Item Plans table for which you qualify; your qualification is based on your Artificer level.',
          'Creating an Item. When you finish a Long Rest, you can create one or two different magic items if you have Tinker\'s Tools in hand. Each item is based on one of the plans you know for this feature.',
          'If a created item requires Attunement, you can attune yourself to it the instant you create it. If you decide to attune to the item later, you must do so using the normal process for Attunement.',
          'When you reach certain Artificer levels specified in the Magic Items column of the Artificer Features table, the number of magic items you can create at the end of a Long Rest increases. Each item you create must be based on a different plan you know.',
          "You can't have more magic items from this feature than the number shown in the Magic Items column of the Artificer Features table for your level. If you try to exceed your maximum number of magic items for this feature, the oldest item vanishes, and then the new item appears.",
          "Duration. A magic item created by this feature functions as the normal magic item, except its magic isn't permanent; when you die, the magic item vanishes after 1d4 days. If you replace a plan you know with a new plan, any magic item created with the replaced plan immediately vanishes.",
          'Spellcasting Focus. You can use any Wand or Weapon created by this feature as a Spellcasting Focus in lieu of using a set of Artisan\'s Tools.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-subclass',
        name: 'Artificer Subclass',
        level: 3,
        description: [
          'You gain an Artificer subclass of your choice. A subclass is a specialization that grants you features at certain Artificer levels. For the rest of your career, you gain each of your subclass\'s features that are of your Artificer level or lower.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-asi-4',
        name: 'Ability Score Improvement',
        level: 4,
        description: [
          'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Artificer levels 8, 12, and 16.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-magic-item-tinker',
        name: 'Magic Item Tinker',
        level: 6,
        description: [
          'Your Replicate Magic Item feature gains the following options.',
          'Charge Magic Item. As a Bonus Action, you can touch a magic item within 5 feet of yourself that you created with Replicate Magic Item and that uses charges. You expend a level 1+ spell slot and recharge the item. The number of charges the item regains is equal to the level of the spell slot expended.',
          'Drain Magic Item. As a Bonus Action, you can touch a magic item within 5 feet of yourself that you created with Replicate Magic Item and cause the item to vanish, converting its magical energy into a spell slot. The slot is level 1 if the item is Common or level 2 if the item is Uncommon or Rare. Once you use this feature, you can\'t do so again until you finish a Long Rest. Any spell slot you create with this feature vanishes when you finish a Long Rest.',
          'Transmute Magic Item. As a Magic action, you can touch one magic item within 5 feet of yourself that you created with Replicate Magic Item and transform it into a different magic item. The resulting item must be based on a magic item plan you know. Once you use this feature, you can\'t do so again until you finish a Long Rest.',
        ],
      },
      {
        index: 'artificer-flash-of-genius',
        name: 'Flash of Genius',
        level: 7,
        description: [
          'When you or another creature you can see within 30 feet of you makes an ability check or a saving throw, you can use your Reaction to add your Intelligence modifier to the roll.',
          'You can use this feature a number of times equal to your Intelligence modifier (minimum of once). You regain all expended uses when you finish a Long Rest.',
        ],
      },
      {
        index: 'artificer-asi-8',
        name: 'Ability Score Improvement',
        level: 8,
        description: [
          'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-magic-item-adept',
        name: 'Magic Item Adept',
        level: 10,
        description: [
          'You achieve a profound understanding of how to use and make magic items.',
          'Attunement Limit. You can now attune to up to four magic items at once.',
          'Craft Faster. If you craft a magic item with a creation time of more than 1 day, it takes you a quarter of the normal time to create it.',
        ],
      },
      {
        index: 'artificer-spell-storing-item',
        name: 'Spell-Storing Item',
        level: 11,
        description: [
          'Whenever you finish a Long Rest, you can touch one Simple or Martial weapon or one item that you can use as a Spellcasting Focus, and you store a spell in it, choosing a level 1 or level 2 spell from the Artificer spell list that requires 1 action to cast (you needn\'t have it prepared).',
          'While holding the item, a creature can take a Magic action to produce the spell\'s effect from it, using your spellcasting ability modifier. If the spell requires Concentration, the creature must concentrate.',
          'The spell stays in the item until it\'s been used a number of times equal to twice your Intelligence modifier (minimum of twice) or until you use this feature again to store a spell in an item.',
        ],
      },
      {
        index: 'artificer-asi-12',
        name: 'Ability Score Improvement',
        level: 12,
        description: [
          'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-advanced-artifice',
        name: 'Advanced Artifice',
        level: 14,
        description: [
          'Your understanding of magic items deepens.',
          'Attunement Limit. You can now attune to up to five magic items at once.',
        ],
      },
      {
        index: 'artificer-subclass-feature-15',
        name: 'Subclass Feature',
        level: 15,
        description: [
          'You gain a feature from your Artificer subclass.',
          '',
          'Alchemist — Chemical Mastery: You gain Resistance to Acid and Poison damage, and you are immune to the Poisoned condition. You can cast Greater Restoration and Heal without a spell slot, without preparing the spell, and without material components once each per Long Rest.',
          '',
          'Armorer — Perfected Armor: You gain additional benefits from your Arcane Armor. Guardian: Creatures you pull toward you with your Thunder Gauntlets are pulled 10 extra feet. Infiltrator: Any creature that takes Lightning damage from your Lightning Launcher glimmers with light until the start of your next turn, and the next attack roll against it has Advantage.',
          '',
          'Artillerist — Fortified Position: You can now have two Eldritch Cannons at the same time. You and allies within 10 feet of either cannon have Half Cover.',
          '',
          'Battle Smith — Improved Defender: Your Steel Defender gains a +2 bonus to AC. Additionally, whenever your Steel Defender forces a creature to make a saving throw, that creature takes force damage equal to 1d8 + your Intelligence modifier on a failed save.',
        ],
      },
      {
        index: 'artificer-asi-16',
        name: 'Ability Score Improvement',
        level: 16,
        description: [
          'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-magic-item-master',
        name: 'Magic Item Master',
        level: 18,
        description: [
          'You can now attune to up to six magic items at once.',
        ],
      },
      {
        index: 'artificer-epic-boon',
        name: 'Epic Boon',
        level: 19,
        description: [
          'You gain an Epic Boon feat or another feat of your choice for which you qualify.',
        ],
        hasChoice: true,
      },
      {
        index: 'artificer-soul-of-artifice',
        name: 'Soul of Artifice',
        level: 20,
        description: [
          'Your bond with your magic items deepens.',
          'Protective Items. You gain a +1 bonus to all saving throws per magic item you are currently attuned to.',
          'Redirect to Item. When you\'re reduced to 0 Hit Points but not killed outright, you can use your Reaction to end one of your magic items created by your Replicate Magic Item feature, causing you to drop to 1 Hit Point instead. If you do so, the item is destroyed.',
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BARBARIAN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  barbarian: {
    index: 'barbarian',
    name: 'Barbarian',
    hitDie: 12,
    primaryAbility: 'Strength',
    savingThrows: ['Strength', 'Constitution'],
    armorTraining: ['Light armor', 'Medium armor', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    },
    startingEquipment: "Choose A or B: (A) Greataxe, 4 Handaxes, Explorer's Pack, and 15 GP; or (B) 75 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Rage', 'Unarmored Defense', 'Weapon Mastery'], classSpecific: { rages: 2, rageDamage: 2, weaponMasteries: 2 } },
      { level: 2, profBonus: 2, features: ['Danger Sense', 'Reckless Attack'], classSpecific: { rages: 2, rageDamage: 2, weaponMasteries: 2 } },
      { level: 3, profBonus: 2, features: ['Barbarian Subclass', 'Primal Knowledge', 'Subclass Feature'], classSpecific: { rages: 3, rageDamage: 2, weaponMasteries: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { rages: 3, rageDamage: 2, weaponMasteries: 3 } },
      { level: 5, profBonus: 3, features: ['Extra Attack', 'Fast Movement'], classSpecific: { rages: 3, rageDamage: 2, weaponMasteries: 3 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { rages: 4, rageDamage: 2, weaponMasteries: 3 } },
      { level: 7, profBonus: 3, features: ['Feral Instinct'], classSpecific: { rages: 4, rageDamage: 2, weaponMasteries: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { rages: 4, rageDamage: 2, weaponMasteries: 3 } },
      { level: 9, profBonus: 4, features: ['Brutal Strike'], classSpecific: { rages: 4, rageDamage: 3, weaponMasteries: 3 } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { rages: 4, rageDamage: 3, weaponMasteries: 4 } },
      { level: 11, profBonus: 4, features: ['Relentless Rage'], classSpecific: { rages: 4, rageDamage: 3, weaponMasteries: 4 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { rages: 5, rageDamage: 3, weaponMasteries: 4 } },
      { level: 13, profBonus: 5, features: ['Improved Brutal Strike'], classSpecific: { rages: 5, rageDamage: 3, weaponMasteries: 4 } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { rages: 5, rageDamage: 3, weaponMasteries: 4 } },
      { level: 15, profBonus: 5, features: ['Persistent Rage'], classSpecific: { rages: 5, rageDamage: 3, weaponMasteries: 4 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { rages: 5, rageDamage: 4, weaponMasteries: 4 } },
      { level: 17, profBonus: 6, features: ['Improved Brutal Strike'], classSpecific: { rages: 6, rageDamage: 4, weaponMasteries: 4 } },
      { level: 18, profBonus: 6, features: ['Indomitable Might'], classSpecific: { rages: 6, rageDamage: 4, weaponMasteries: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { rages: 6, rageDamage: 4, weaponMasteries: 4 } },
      { level: 20, profBonus: 6, features: ['Primal Champion'], classSpecific: { rages: 'Unlimited', rageDamage: 4, weaponMasteries: 4 } },
    ],

    features: [
      {
        index: 'barbarian-rage',
        name: 'Rage',
        level: 1,
        description: [
          'You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience. You can enter it as a Bonus Action if you aren\'t wearing Heavy armor.',
          'You can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.',
          'While active, you gain the following benefits:',
          'Damage Resistance. You have Resistance to Bludgeoning, Piercing, and Slashing damage.',
          'Rage Damage. When you make an attack using Strength — with either a weapon or an Unarmed Strike — and deal damage to the target, you gain a bonus to the damage that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian Features table.',
          'Strength Advantage. You have Advantage on Strength checks and Strength saving throws.',
          'No Concentration or Spells. You can\'t maintain Concentration, and you can\'t cast spells.',
          'The Rage lasts until the end of your next turn, and it ends early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following: make an attack roll, force a saving throw, or take a Bonus Action to extend your Rage.',
          'You can also end your Rage early as a Bonus Action.',
        ],
        grants: {
          resources: [{ name: 'Rage', amount: 2 }],
        },
      },
      {
        index: 'barbarian-unarmored-defense',
        name: 'Unarmored Defense',
        level: 1,
        description: [
          'While you aren\'t wearing any armor, your base Armor Class equals 10 plus your Dexterity and Constitution modifiers. You can use a Shield and still gain this benefit.',
        ],
      },
      {
        index: 'barbarian-weapon-mastery',
        name: 'Weapon Mastery',
        level: 1,
        description: [
          'Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice, such as Greataxes and Handaxes. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices.',
          'When you reach certain Barbarian levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Barbarian Features table.',
        ],
        hasChoice: true,
      },
      {
        index: 'barbarian-danger-sense',
        name: 'Danger Sense',
        level: 2,
        description: [
          'You gain an uncanny sense of when things aren\'t as they should be, giving you an edge when you dodge perils. You have Advantage on Dexterity saving throws unless you have the Incapacitated condition.',
        ],
      },
      {
        index: 'barbarian-reckless-attack',
        name: 'Reckless Attack',
        level: 2,
        description: [
          'You can throw aside all concern for defense to attack with increased ferocity. When you make your first attack roll on your turn, you can decide to attack recklessly. Doing so gives you Advantage on attack rolls using Strength until the start of your next turn, but attack rolls against you have Advantage during that time.',
        ],
      },
      {
        index: 'barbarian-subclass',
        name: 'Barbarian Subclass',
        level: 3,
        description: [
          'You gain a Barbarian subclass of your choice. A subclass is a specialization that grants you features at certain Barbarian levels. For the rest of your career, you gain each of your subclass\'s features that are of your Barbarian level or lower.',
        ],
        hasChoice: true,
      },
      {
        index: 'barbarian-primal-knowledge',
        name: 'Primal Knowledge',
        level: 3,
        description: [
          'You gain proficiency in another skill from the Barbarian skill list.',
          'In addition, while your Rage is active, you can channel primal power when you attempt certain tasks; whenever you make an ability check using one of the following skills, you can make it as a Strength check even if it normally uses a different ability: Acrobatics, Intimidation, Perception, Stealth, or Survival. When you use this ability, your Strength represents primal power coursing through you, honing your agility and senses.',
        ],
        grants: {
          proficiencies: ['One Barbarian skill'],
        },
      },
      {
        index: 'barbarian-subclass-feature-3',
        name: 'Subclass Feature',
        level: 3,
        description: [
          'You gain a feature from your Barbarian subclass.',
          '',
          'Berserker — Frenzy: While your Rage is active, if you use Reckless Attack, the first creature you hit on your turn with a Strength-based attack (a melee weapon or an Unarmed Strike) takes extra damage. The extra damage is a number of d6s equal to your Rage Damage bonus (2d6 at levels 3–8, 3d6 at 9–15, 4d6 at 16+), of the same type as the attack. There is no Exhaustion cost in 2024.',
          '',
          'Wild Heart — Rage of the Wilds: When you activate your Rage, choose Bear (Resistance to every damage type except Force, Necrotic, Psychic, and Radiant), Eagle (you can take the Disengage and Dash actions together as a single Bonus Action while Raging), or Wolf (your allies have Advantage on attack rolls against any enemy within 5 feet of you while you Rage).',
          '',
          'World Tree — Vitality of the Tree: When you activate your Rage, you gain Temporary Hit Points equal to your Barbarian level. At the start of each of your turns while Raging, one creature of your choice within 10 feet gains Temporary Hit Points equal to a roll of d6s equal to your Rage Damage bonus.',
          '',
          'Zealot — Divine Fury: While your Rage is active, the first creature you hit on each of your turns with a weapon or an Unarmed Strike takes extra damage equal to 1d6 plus half your Barbarian level (rounded down). The damage is Necrotic or Radiant (your choice).',
        ],
      },
      {
        index: 'barbarian-subclass-feature-3b',
        name: 'Subclass Feature',
        level: 3,
        description: [
          'You gain an additional feature from your Barbarian subclass.',
          '',
          'Wild Heart — Animal Speaker: You can cast Beast Sense and Speak with Animals, but only as Rituals. Wisdom is your spellcasting ability for them.',
          '',
          'Zealot — Warrior of the Gods: You have a pool of four d12s to heal yourself. As a Bonus Action, you can expend dice from the pool, roll them, and regain that many Hit Points. The pool grows as you gain Barbarian levels and refills when you finish a Long Rest.',
        ],
      },
      {
        index: 'barbarian-asi-4',
        name: 'Ability Score Improvement',
        level: 4,
        description: [
          'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16.',
        ],
        hasChoice: true,
      },
      {
        index: 'barbarian-extra-attack',
        name: 'Extra Attack',
        level: 5,
        description: [
          'You can attack twice instead of once whenever you take the Attack action on your turn.',
        ],
      },
      {
        index: 'barbarian-fast-movement',
        name: 'Fast Movement',
        level: 5,
        description: [
          'Your speed increases by 10 feet while you aren\'t wearing Heavy armor.',
        ],
      },
      {
        index: 'barbarian-subclass-feature-6',
        name: 'Subclass Feature',
        level: 6,
        description: [
          'You gain a feature from your Barbarian subclass.',
          '',
          'Berserker — Mindless Rage: You can\'t be Charmed or Frightened while Raging. If you are Charmed or Frightened when you enter Rage, the condition ends on you.',
          '',
          'Wild Heart — Aspect of the Wilds: You gain one of the following options (choose each time you finish a Long Rest): Owl (Darkvision 60 ft, and Advantage on Wisdom (Perception) checks), Panther (climbing speed equal to your Speed), or Salmon (swimming speed equal to your Speed).',
          '',
          'World Tree — Branching Strike: While Raging, when you hit with an attack roll, you can push the target into an unoccupied space you can see within 5 feet of that creature. If the target is pushed to a space within your reach, they take extra damage equal to half your Barbarian level.',
          '',
          'Zealot — Fanatical Focus: If you fail a saving throw while Raging, you can reroll it with a bonus equal to your Rage Damage bonus, and you must use the new roll. You can use this once per Rage.',
        ],
      },
      {
        index: 'barbarian-feral-instinct',
        name: 'Feral Instinct',
        level: 7,
        description: [
          'Your instincts are so honed that you have Advantage on Initiative rolls.',
        ],
      },
      {
        index: 'barbarian-asi-8',
        name: 'Ability Score Improvement',
        level: 8,
        description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'],
        hasChoice: true,
      },
      {
        index: 'barbarian-brutal-strike',
        name: 'Brutal Strike',
        level: 9,
        description: [
          'If you use Reckless Attack, you can forgo Advantage on the next attack roll you make on your turn with a Strength-based attack. If that attack hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options.',
          'Forceful Blow. The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.',
          'Hamstring Blow. The target\'s Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time — the most recent one takes precedence.',
        ],
      },
      {
        index: 'barbarian-subclass-feature-10',
        name: 'Subclass Feature',
        level: 10,
        description: [
          'You gain a feature from your Barbarian subclass.',
          '',
          'Berserker — Retaliation: When you take damage from a creature that is within 5 feet of you, you can use your Reaction to make one melee attack against that creature, using a weapon or an Unarmed Strike.',
          '',
          'Wild Heart — Natural Speaker: You can cast Beast Sense and Speak with Animals as rituals.',
          '',
          'World Tree — Travel Along the Tree: While Raging, when you hit a creature with an attack roll, you can teleport the target to an unoccupied space you can see within 15 feet of yourself.',
          '',
          'Zealot — Zealous Presence: As a Bonus Action, you unleash a battle cry infused with divine energy. Up to 10 other creatures of your choice within 60 feet of you gain Advantage on attack rolls and saving throws until the start of your next turn. Once you use this, you can\'t again until you finish a Long Rest.',
        ],
      },
      {
        index: 'barbarian-relentless-rage',
        name: 'Relentless Rage',
        level: 11,
        description: [
          'Your Rage can keep you fighting despite grievous wounds. If you drop to 0 Hit Points while your Rage is active and you don\'t die outright, you can make a DC 10 Constitution saving throw. If you succeed, your Hit Points instead change to a number equal to twice your Barbarian level.',
          'Each time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10.',
        ],
      },
      {
        index: 'barbarian-asi-12',
        name: 'Ability Score Improvement',
        level: 12,
        description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'],
        hasChoice: true,
      },
      {
        index: 'barbarian-improved-brutal-strike-13',
        name: 'Improved Brutal Strike',
        level: 13,
        description: [
          'You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options.',
          'Staggering Blow. The target has Disadvantage on the next saving throw it makes, and it can\'t make Opportunity Attacks until the start of your next turn.',
          'Sundering Blow. Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus.',
        ],
      },
      {
        index: 'barbarian-subclass-feature-14',
        name: 'Subclass Feature',
        level: 14,
        description: [
          'You gain a feature from your Barbarian subclass.',
          '',
          'Berserker — Intimidating Presence: As a Bonus Action, you can frighten a creature. Choose one creature you can see within 30 feet. It must succeed on a Wisdom saving throw (DC = 8 + your proficiency bonus + your Strength modifier) or have the Frightened condition until the end of your next turn. You can use this once per Rage.',
          '',
          'Wild Heart — Power of the Wilds: Whenever you activate Rage, you manifest a supernatural aura for 1 minute. Choose: Bear (you and allies within 5 feet have resistance to all damage except Psychic), Eagle (you gain a flying speed equal to your walking speed while Raging), or Wolf (when you hit a creature, allies have Advantage on attack rolls against it until the start of your next turn).',
          '',
          'World Tree — Vitality of the Tree: While Raging, when you enter a space within reach of an ally, you can grant them temporary hit points equal to your Barbarian level. A creature can benefit from this once per Rage.',
          '',
          'Zealot — Rage Beyond Death: While Raging, having 0 hit points doesn\'t knock you unconscious. You still make death saving throws, and you suffer the normal effects of taking damage while at 0 hit points. If you would die due to failing death saves, your death is delayed until your Rage ends.',
        ],
      },
      {
        index: 'barbarian-persistent-rage',
        name: 'Persistent Rage',
        level: 15,
        description: [
          'When you roll Initiative, you can regain all expended uses of Rage. After you regain uses of Rage in this way, you can\'t do so again until you finish a Long Rest.',
          'In addition, your Rage is so fierce that it now lasts for 10 minutes without you needing to do anything to extend it from round to round. Your Rage ends early only if you have the Unconscious condition (not just Incapacitated) or don Heavy armor.',
        ],
      },
      {
        index: 'barbarian-asi-16',
        name: 'Ability Score Improvement',
        level: 16,
        description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'],
        hasChoice: true,
      },
      {
        index: 'barbarian-improved-brutal-strike-17',
        name: 'Improved Brutal Strike',
        level: 17,
        description: [
          'Your Brutal Strike damage increases to 2d10. In addition, you can use two different Brutal Strike effects whenever you use your Brutal Strike feature.',
        ],
      },
      {
        index: 'barbarian-indomitable-might',
        name: 'Indomitable Might',
        level: 18,
        description: [
          'If your total for a Strength check or Strength saving throw is less than your Strength score, you can use that score in place of the total.',
        ],
      },
      {
        index: 'barbarian-epic-boon',
        name: 'Epic Boon',
        level: 19,
        description: [
          'You gain an Epic Boon feat or another feat of your choice for which you qualify.',
        ],
        hasChoice: true,
      },
      {
        index: 'barbarian-primal-champion',
        name: 'Primal Champion',
        level: 20,
        description: [
          'You embody the power of the wilds. Your Strength and Constitution scores increase by 4, to a maximum of 25.',
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  bard: {
    index: 'bard',
    name: 'Bard',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: ['Dexterity', 'Charisma'],
    armorTraining: ['Light armor'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: ['Three Musical Instruments of your choice'],
    skillChoices: { choose: 3, from: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'] },
    startingEquipment: "Choose A or B: (A) Leather Armor, 2 Daggers, Musical Instrument of your choice, Entertainer's Pack, and 19 GP; or (B) 100 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Bardic Inspiration', 'Spellcasting'], classSpecific: { bardicInspirationDie: 'd6' } },
      { level: 2, profBonus: 2, features: ['Expertise', 'Jack of All Trades'], classSpecific: { bardicInspirationDie: 'd6' } },
      { level: 3, profBonus: 2, features: ['Bard Subclass', 'Subclass Feature'], classSpecific: { bardicInspirationDie: 'd6' } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { bardicInspirationDie: 'd6' } },
      { level: 5, profBonus: 3, features: ['Font of Inspiration'], classSpecific: { bardicInspirationDie: 'd8' } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { bardicInspirationDie: 'd8' } },
      { level: 7, profBonus: 3, features: ['Countercharm'], classSpecific: { bardicInspirationDie: 'd8' } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { bardicInspirationDie: 'd8' } },
      { level: 9, profBonus: 4, features: ['Expertise'], classSpecific: { bardicInspirationDie: 'd8' } },
      { level: 10, profBonus: 4, features: ['Magical Secrets'], classSpecific: { bardicInspirationDie: 'd10' } },
      { level: 11, profBonus: 4, features: [], classSpecific: { bardicInspirationDie: 'd10' } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { bardicInspirationDie: 'd10' } },
      { level: 13, profBonus: 5, features: [], classSpecific: { bardicInspirationDie: 'd10' } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { bardicInspirationDie: 'd10' } },
      { level: 15, profBonus: 5, features: [], classSpecific: { bardicInspirationDie: 'd12' } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { bardicInspirationDie: 'd12' } },
      { level: 17, profBonus: 6, features: [], classSpecific: { bardicInspirationDie: 'd12' } },
      { level: 18, profBonus: 6, features: ['Superior Inspiration'], classSpecific: { bardicInspirationDie: 'd12' } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { bardicInspirationDie: 'd12' } },
      { level: 20, profBonus: 6, features: ['Words of Creation'], classSpecific: { bardicInspirationDie: 'd12' } },
    ],

    features: [
      { index: 'bard-bardic-inspiration', name: 'Bardic Inspiration', level: 1, description: [
        'You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which starts as a d6.',
        'Using Bardic Inspiration. As a Bonus Action, you can inspire another creature within 60 feet of you who can hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time.',
        'Once within the next 10 minutes, the inspired creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw the creature makes. The Bardic Inspiration die is lost when the roll is made or when 10 minutes have passed.',
        'Number of Uses. You can use this feature a number of times equal to your Charisma modifier (minimum of once). You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.',
        'Die Progression. Your Bardic Inspiration die changes when you reach certain Bard levels: d8 at level 5, d10 at level 10, and d12 at level 15.',
      ] },
      { index: 'bard-spellcasting', name: 'Spellcasting', level: 1, description: [
        'You have learned to cast spells through your musical performances and poetic recitations. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Bard spells.',
        'Cantrips. You know two cantrips of your choice from the Bard spell list. Whenever you gain a Bard level, you can replace one of your cantrips with another cantrip of your choice from the Bard spell list.',
        'Spell Slots. The Bard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 Bard spells.',
        'Whenever you gain a Bard level, you can replace one spell on your list with another Bard spell for which you have spell slots.',
        'Spellcasting Ability. Charisma is your spellcasting ability for your Bard spells.',
        'Spellcasting Focus. You can use a Musical Instrument as a Spellcasting Focus for your Bard spells.',
      ] },
      { index: 'bard-expertise-2', name: 'Expertise', level: 2, description: [
        'You gain Expertise in two of your skill proficiencies of your choice. You gain this feature again at Bard level 9.',
      ], hasChoice: true },
      { index: 'bard-jack-of-all-trades', name: 'Jack of All Trades', level: 2, description: [
        'You can add half your Proficiency Bonus (round down) to any ability check you make that doesn\'t already use your Proficiency Bonus.',
      ] },
      { index: 'bard-subclass', name: 'Bard Subclass', level: 3, description: [
        'You gain a Bard subclass of your choice. A subclass is a specialization that grants you features at certain Bard levels. For the rest of your career, you gain each of your subclass\'s features that are of your Bard level or lower.',
      ], hasChoice: true },
      { index: 'bard-subclass-feature-3', name: 'Subclass Feature', level: 3, description: [
        'You gain a feature from your Bard subclass.',
        '',
        'Dance — Dazzling Footwork: While you wear no armor and use no Shield, your Unarmored Defense is 10 + your Dexterity and Charisma modifiers, you can use Dexterity for your Unarmed Strikes and their damage die becomes your Bardic Inspiration die, and you have Advantage on Charisma (Performance) checks that involve dancing.',
        '',
        'Glamour — Mantle of Inspiration: As a Bonus Action, you can expend one use of Bardic Inspiration and roll the die. Choose a number of creatures within 60 feet equal to your Charisma modifier (minimum 1). Each gains Temporary Hit Points equal to twice the number rolled and can immediately use its Reaction to move up to its Speed without provoking Opportunity Attacks.',
        '',
        'Lore — Cutting Words: When a creature you can see within 60 feet makes a damage roll or succeeds on an attack roll or ability check, you can use your Reaction to expend one use of Bardic Inspiration, roll the die, and subtract the number from that roll — potentially turning a hit into a miss or reducing its damage.',
        '',
        'Valor — Combat Inspiration: A creature that has a Bardic Inspiration die from you can use it to add the roll to its AC against one attack (as a Reaction), or to add the roll to one damage roll it makes.',
        '',
        'Whispers — Psychic Blades: When you hit a creature with an attack using a weapon, you can expend one use of Bardic Inspiration to deal extra Psychic damage to the target. The extra damage is 2d6 at Bard level 3, 3d6 at level 5, 5d6 at level 10, and 8d6 at level 15. You can use this feature only once on each of your turns.',
      ] },
      { index: 'bard-subclass-feature-3b', name: 'Subclass Feature', level: 3, description: [
        'You gain an additional feature from your Bard subclass.',
        '',
        'Glamour — Beguiling Magic: You always have Charm Person and Mirror Image prepared. Immediately after you cast an Enchantment or Illusion spell using a spell slot, you can force one creature you can see within 60 feet to succeed on a Wisdom saving throw or be Charmed or Frightened (your choice) for 1 minute, repeating the save at the end of each of its turns. Usable once per Long Rest, or by expending a use of Bardic Inspiration.',
        '',
        'Lore — Bonus Proficiencies: You gain proficiency in three skills of your choice.',
        '',
        'Valor — Martial Training: You gain proficiency with Martial weapons and training with Medium armor and Shields, and you can use a Simple or Martial weapon as a Spellcasting Focus for your Bard spells.',
        '',
        'Whispers — Words of Terror: If you speak to a Humanoid alone for at least 1 minute, you can attempt to seed paranoia in its mind. At the end of the conversation, the target makes a Wisdom saving throw against your spell save DC. On a failed save, it is Frightened of you or another creature of your choice for 1 hour, believing that terrible harm will come its way. You regain the use of this feature when you finish a Short or Long Rest.',
      ] },
      { index: 'bard-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16.'], hasChoice: true },
      { index: 'bard-font-of-inspiration', name: 'Font of Inspiration', level: 5, description: [
        'You now regain all your expended uses of Bardic Inspiration when you finish a Short or Long Rest.',
      ] },
      { index: 'bard-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Bard subclass.',
        '',
        'Dance — Inspiring Movement: When an ally you can see within 30 feet starts their turn, you can use your Reaction to grant them 10 extra feet of movement and allow them to move without provoking Opportunity Attacks until the end of their turn.',
        '',
        'Glamour — Mantle of Majesty: As a Bonus Action, you cast Command without expending a spell slot. You can do this for 1 minute (Concentration). Creatures automatically fail their save if you have given them Temporary Hit Points from Mantle of Inspiration. Once per Long Rest.',
        '',
        'Lore — Unfailing Inspiration: When a creature uses your Bardic Inspiration die and the roll fails, the creature keeps the die.',
        '',
        'Valor — Extra Attack: You can attack twice instead of once whenever you take the Attack action on your turn.',
        '',
        'Whispers — Mantle of Whispers: As a Reaction when a Humanoid dies within 30 feet of you, you can magically capture its shadow. You retain this shadow until you use it or finish a Long Rest. As a Magic action, you can then use the shadow as a disguise, appearing as the dead person did while alive and gaining knowledge of the general appearance and demeanor of that individual\'s life. A creature that knew the person can see through your disguise with a Wisdom (Insight) check contested by your Charisma (Deception) check, on which you have Advantage. The disguise lasts until you end it as a Bonus Action or you are Incapacitated. You regain the use of this feature when you finish a Short or Long Rest.',
      ] },
      { index: 'bard-countercharm', name: 'Countercharm', level: 7, description: [
        'You can use musical notes or words of power to disrupt mind-influencing effects. If you or a creature within 30 feet of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can use your Reaction to cause the save to be rerolled, and the new roll must be used.',
      ] },
      { index: 'bard-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bard-expertise-9', name: 'Expertise', level: 9, description: ['You gain Expertise in two of your skill proficiencies of your choice.'], hasChoice: true },
      { index: 'bard-magical-secrets', name: 'Magical Secrets', level: 10, description: [
        'You have collected magical knowledge from a wide spectrum of disciplines. Choose two spells from any spell list, including this one. Each spell you choose must be a cantrip or a spell for which you have spell slots, as shown in the Bard Features table.',
        'The chosen spells count as Bard spells for you and are included in the number in the Prepared Spells column of the Bard Features table.',
        'Whenever you gain a Bard level, you can replace one of these two spells with another eligible spell.',
      ], hasChoice: true },
      { index: 'bard-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bard-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Bard subclass.',
        '',
        'Dance — Tandem Footwork: When you roll Initiative, you and allies within 30 feet can add your Charisma modifier to the roll. You can also use your Reaction to grant one of those allies advantage on their first attack roll of combat.',
        '',
        'Glamour — Unbreakable Majesty: As a Bonus Action, you assume a magically majestic presence for 1 minute. During this time, whenever a creature attacks you for the first time on a turn, it must make a Charisma saving throw against your spell save DC. On a fail, it can\'t attack you and must choose a new target or waste the attack. Once per Long Rest.',
        '',
        'Lore — Peerless Skill: When you make an ability check or attack roll, you can expend one use of Bardic Inspiration, rolling the die and adding the number to your check or roll.',
        '',
        'Valor — Battle Magic: When you use your action to cast a Bard spell, you can make one weapon attack as a Bonus Action.',
        '',
        'Whispers — Shadow Lore: As a Magic action, you whisper a phrase of dark secrets to one creature within 30 feet that can hear and understand you. The target makes a Wisdom saving throw against your spell save DC, succeeding automatically if it doesn\'t understand your language. On a failed save, it is Charmed by you for 8 hours or until you or your allies attack it, damage it, or force it to make a saving throw. It interprets the whispers as a description of its deepest fears, and while Charmed it regards you as a trusted friend and obeys your reasonable requests. You regain the use of this feature when you finish a Long Rest.',
      ] },
      { index: 'bard-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bard-superior-inspiration', name: 'Superior Inspiration', level: 18, description: [
        'When you roll Initiative, you regain two expended uses of Bardic Inspiration.',
      ] },
      { index: 'bard-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bard-words-of-creation', name: 'Words of Creation', level: 20, description: [
        'You have mastered two of the Words of Creation: the words of life and death. You therefore always have Power Word Heal and Power Word Kill prepared. When you cast either spell, you can target a second creature with it if that creature is within 10 feet of the first target.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLERIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cleric: {
    index: 'cleric',
    name: 'Cleric',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: ['Wisdom', 'Charisma'],
    armorTraining: ['Light armor', 'Medium armor', 'Shields'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'] },
    startingEquipment: "Choose A or B: (A) Chain Shirt, Shield, Mace, Holy Symbol, Priest's Pack, and 7 GP; or (B) 110 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Spellcasting', 'Divine Order'], classSpecific: { channelDivinityUses: 0 } },
      { level: 2, profBonus: 2, features: ['Channel Divinity'], classSpecific: { channelDivinityUses: 2 } },
      { level: 3, profBonus: 2, features: ['Cleric Subclass', 'Subclass Feature'], classSpecific: { channelDivinityUses: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { channelDivinityUses: 2 } },
      { level: 5, profBonus: 3, features: ['Sear Undead'], classSpecific: { channelDivinityUses: 2 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { channelDivinityUses: 3 } },
      { level: 7, profBonus: 3, features: ['Blessed Strikes'], classSpecific: { channelDivinityUses: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { channelDivinityUses: 3 } },
      { level: 9, profBonus: 4, features: ['Subclass Feature'], classSpecific: { channelDivinityUses: 3 } },
      { level: 10, profBonus: 4, features: ['Divine Intervention'], classSpecific: { channelDivinityUses: 3 } },
      { level: 11, profBonus: 4, features: [], classSpecific: { channelDivinityUses: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { channelDivinityUses: 3 } },
      { level: 13, profBonus: 5, features: [], classSpecific: { channelDivinityUses: 3 } },
      { level: 14, profBonus: 5, features: ['Improved Blessed Strikes'], classSpecific: { channelDivinityUses: 3 } },
      { level: 15, profBonus: 5, features: [], classSpecific: { channelDivinityUses: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { channelDivinityUses: 3 } },
      { level: 17, profBonus: 6, features: ['Subclass Feature'], classSpecific: { channelDivinityUses: 3 } },
      { level: 18, profBonus: 6, features: [], classSpecific: { channelDivinityUses: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { channelDivinityUses: 4 } },
      { level: 20, profBonus: 6, features: ['Greater Divine Intervention'], classSpecific: { channelDivinityUses: 4 } },
    ],

    features: [
      { index: 'cleric-spellcasting', name: 'Spellcasting', level: 1, description: [
        'You have learned to cast spells through prayer and meditation. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Cleric spells.',
        'Cantrips. You know three cantrips of your choice from the Cleric spell list. Whenever you gain a Cleric level, you can replace one of your cantrips with another cantrip of your choice from the Cleric spell list.',
        'Spell Slots. The Cleric Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 Cleric spells.',
        'The number of spells on your list increases as you gain Cleric levels. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Cleric spells for which you have spell slots.',
        'Spellcasting Ability. Wisdom is your spellcasting ability for your Cleric spells.',
        'Spellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Cleric spells.',
      ] },
      { index: 'cleric-divine-order', name: 'Divine Order', level: 1, description: [
        'You have dedicated yourself to one of the following sacred roles of your choice.',
        'Protector. Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.',
        'Thaumaturge. You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Religion) checks. The bonus equals your Wisdom modifier (minimum of +1).',
      ], hasChoice: true },
      { index: 'cleric-channel-divinity', name: 'Channel Divinity', level: 2, description: [
        'You gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. You start with two such effects: Divine Spark and Turn Undead, each of which is described below. Each time you use your Channel Divinity, you choose which effect to create. You must then finish a Short or Long Rest to use your Channel Divinity again.',
        'Some Channel Divinity effects require saving throws. When you use such an effect, the DC equals your Cleric spell save DC.',
        'You can use Channel Divinity twice between rests starting at level 2, three times starting at level 6, and four times starting at level 18.',
        'Divine Spark. As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at it. Roll 1d8 and add your Wisdom modifier. You either restore Hit Points to the creature equal to that total or force the creature to make a Constitution saving throw. On a failed save, the creature takes Necrotic or Radiant damage (your choice) equal to that total. On a successful save, the creature takes half as much damage (round down). The number of dice increases by 1d8 at Cleric levels 7 (2d8), 13 (3d8), and 18 (4d8).',
        'Turn Undead. As a Magic action, you present your Holy Symbol and speak a prayer censuring Undead creatures. Each Undead of your choice within 30 feet of you must make a Wisdom saving throw. If the creature fails its saving throw, it has the Frightened and Incapacitated conditions for 1 minute. An affected creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.',
      ] },
      { index: 'cleric-subclass', name: 'Cleric Subclass', level: 3, description: ['You gain a Cleric subclass of your choice. A subclass is a specialization that grants you features at certain Cleric levels. For the rest of your career, you gain each of your subclass\'s features that are of your Cleric level or lower.'], hasChoice: true },
      { index: 'cleric-subclass-feature-3', name: 'Subclass Feature', level: 3, description: [
        'You gain a feature from your Cleric subclass.',
        '',
        'Life — Disciple of Life: When a spell you cast with a level 1+ spell slot restores Hit Points to a creature, that creature regains additional Hit Points equal to 2 plus the spell slot\'s level.',
        '',
        'Light — Warding Flare: When a creature you can see within 30 feet of you makes an attack roll, you can take a Reaction to impose Disadvantage on that roll, causing light to flare before the attack hits or misses. A creature that can\'t be Blinded is immune. You can use this a number of times equal to your Wisdom modifier (minimum once), regaining all expended uses on a Long Rest. You also gain the Light cantrip if you don\'t already know it.',
        '',
        'Trickery — Invoke Duplicity: As a Bonus Action (Channel Divinity), you create a perfect visual illusion of yourself in an unoccupied space within 30 feet that lasts 1 minute. As a Bonus Action you can move it up to 30 feet (no farther than 120 feet from you). You can cast spells as though you were in the illusion\'s space, and you have Advantage on attack rolls against any creature within 5 feet of it that you can see.',
        '',
        'Trickery — Blessing of the Trickster: As a Magic action, you can touch a willing creature (other than yourself) to give it Advantage on Dexterity (Stealth) checks. This blessing lasts 8 hours or until you use this feature again.',
        '',
        'War — War Priest: When you take the Attack action on your turn, you can make one additional attack as a Bonus Action. You can use this a number of times equal to your Wisdom modifier (minimum once), regaining all expended uses on a Short or Long Rest.',
        '',
        'Peace — Emboldening Bond: When you choose this domain, you gain proficiency in your choice of the Insight, Performance, or Persuasion skill (Implement of Peace). As a Magic action, you can choose creatures, which can include you, within 30 feet of you (up to a number equal to your Proficiency Bonus); they must be willing. You create a magical bond among them for 10 minutes or until you use this feature again. While a bonded creature is within 30 feet of any other bonded creature, it can roll a d4 and add the number rolled to one attack roll, ability check, or saving throw it makes (no more than once per turn). You can use this feature a number of times equal to your Proficiency Bonus, regaining all expended uses on a Long Rest.',
      ] },
      { index: 'cleric-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16.'], hasChoice: true },
      { index: 'cleric-sear-undead', name: 'Sear Undead', level: 5, description: [
        'Whenever you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum of 1d8) and add them together. Each Undead that fails its saving throw against that use of Turn Undead takes Radiant damage equal to the roll\'s total. This damage doesn\'t end the turn effect.',
      ] },
      { index: 'cleric-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Cleric subclass.',
        '',
        'Life — Blessed Healer: When you cast a spell of 1st level or higher that restores hit points to a creature other than you, you regain hit points equal to 2 + the spell\'s level.',
        '',
        'Light — Improved Flare: When you use Warding Flare, you can target any creature you can see within 30 feet instead of only yourself.',
        '',
        'Trickery — Trickster\'s Transposition: You can teleport, swapping places with a creature affected by your Invoke Duplicity. Both you and the duplicate can teleport in this way.',
        '',
        'War — War God\'s Blessing: When a creature within 30 feet of you makes an attack roll, you can use your Reaction to grant that creature a +10 bonus to the roll. You can use this a number of times equal to your Wisdom modifier per Long Rest.',
        '',
        'Peace — Protective Bond: When a creature affected by your Emboldening Bond takes damage, a different creature affected by the bond and within 30 feet of it can take a Reaction to teleport to an unoccupied space within 5 feet of the endangered creature. The creature that uses this Reaction then takes all of the damage instead.',
      ] },
      { index: 'cleric-blessed-strikes', name: 'Blessed Strikes', level: 7, description: [
        'Divine power infuses you in battle. You gain one of the following options of your choice.',
        'Divine Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).',
        'Potent Spellcasting. You add your Wisdom modifier to the damage you deal with any Cleric cantrip.',
      ], hasChoice: true },
      { index: 'cleric-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'cleric-subclass-feature-9', name: 'Subclass Feature', level: 9, description: [
        'You gain a feature from your Cleric subclass.',
        '',
        'Life — Supreme Healing: When you would roll dice to restore hit points with a Cleric spell, you instead use the highest number possible for each die.',
        '',
        'Light — Sunburst: You can cast Sunburst once without expending a spell slot. Once you do so, you can\'t do so again until you finish a Long Rest.',
        '',
        'Trickery — Improved Duplicity: Your Invoke Duplicity duplicate can now move up to 120 feet from you. When you and your duplicate are both within 5 feet of a creature, you have Advantage on attack rolls against that creature.',
        '',
        'War — Avatar of Battle: You have Resistance to Bludgeoning, Piercing, and Slashing damage from nonmagical attacks.',
      ] },
      { index: 'cleric-divine-intervention', name: 'Divine Intervention', level: 10, description: [
        'You can call on your deity or pantheon to intervene on your behalf. As a Magic action, choose any Cleric spell of level 5 or lower that doesn\'t require a Reaction to cast. As part of the same action, you cast that spell without expending a spell slot or needing Material components. You can\'t use this feature again until you finish a Long Rest.',
      ] },
      { index: 'cleric-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'cleric-improved-blessed-strikes', name: 'Improved Blessed Strikes', level: 14, description: [
        'The option you chose for Blessed Strikes grows more powerful.',
        'Divine Strike. The extra damage of your Divine Strike increases to 2d8.',
        'Potent Spellcasting. When you cast a Cleric cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting a number of Temporary Hit Points equal to twice your Wisdom modifier.',
      ] },
      { index: 'cleric-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'cleric-subclass-feature-17', name: 'Subclass Feature', level: 17, description: [
        'You gain a feature from your Cleric subclass.',
        '',
        'Life — Greater Healing: Your healing spells are empowered. When you cast a spell that restores hit points, each target regains additional hit points equal to your Wisdom modifier (minimum 1).',
        '',
        'Light — Corona of Light: You can use an action to activate an aura of sunlight for 1 minute. You emit bright light in a 60-foot radius and dim light 30 feet beyond that. Enemies in the bright light have Disadvantage on saving throws against your spells that deal Fire or Radiant damage.',
        '',
        'Trickery — Supreme Duplicity: When you create your Invoke Duplicity duplicate, you can create up to four duplicates, rather than one. You can move any number of them up to 30 feet each time, and they can flank.',
        '',
        'War — Avatar of War: You gain Resistance to all Bludgeoning, Piercing, and Slashing damage (including magical). Your weapon attacks deal an extra 1d8 damage.',
        '',
        'Peace — Expansive Bond: The benefits of your Emboldening Bond and Protective Bond now work when the creatures are within 60 feet of one another. Moreover, when a creature uses your Protective Bond to take someone else\'s damage, the creature has Resistance to that damage.',
      ] },
      { index: 'cleric-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'cleric-greater-divine-intervention', name: 'Greater Divine Intervention', level: 20, description: [
        'You can call on even more powerful divine intervention. When you use your Divine Intervention feature, you can choose Wish when you select a spell. If you do so, you can\'t use Divine Intervention again until you finish 2d4 Long Rests.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DRUID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  druid: {
    index: 'druid',
    name: 'Druid',
    hitDie: 8,
    primaryAbility: 'Wisdom',
    savingThrows: ['Intelligence', 'Wisdom'],
    armorTraining: ['Light armor', 'Shields'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: ['Herbalism Kit'],
    skillChoices: { choose: 2, from: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'] },
    startingEquipment: "Choose A or B: (A) Leather Armor, Shield, Sickle, Druidic Focus (Quarterstaff), Explorer's Pack, Herbalism Kit, and 9 GP; or (B) 50 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Spellcasting', 'Druidic', 'Primal Order'] },
      { level: 2, profBonus: 2, features: ['Wild Shape', 'Wild Companion'], classSpecific: { wildShapeUses: 2 } },
      { level: 3, profBonus: 2, features: ['Druid Subclass'], classSpecific: { wildShapeUses: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { wildShapeUses: 2 } },
      { level: 5, profBonus: 3, features: ['Wild Resurgence'], classSpecific: { wildShapeUses: 2 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { wildShapeUses: 3 } },
      { level: 7, profBonus: 3, features: ['Elemental Fury'], classSpecific: { wildShapeUses: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { wildShapeUses: 3 } },
      { level: 9, profBonus: 4, features: [], classSpecific: { wildShapeUses: 3 } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { wildShapeUses: 3 } },
      { level: 11, profBonus: 4, features: [], classSpecific: { wildShapeUses: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { wildShapeUses: 3 } },
      { level: 13, profBonus: 5, features: [], classSpecific: { wildShapeUses: 3 } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { wildShapeUses: 3 } },
      { level: 15, profBonus: 5, features: ['Improved Elemental Fury'], classSpecific: { wildShapeUses: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { wildShapeUses: 3 } },
      { level: 17, profBonus: 6, features: [], classSpecific: { wildShapeUses: 4 } },
      { level: 18, profBonus: 6, features: ['Beast Spells'], classSpecific: { wildShapeUses: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { wildShapeUses: 4 } },
      { level: 20, profBonus: 6, features: ['Archdruid'], classSpecific: { wildShapeUses: 4 } },
    ],

    features: [
      { index: 'druid-spellcasting', name: 'Spellcasting', level: 1, description: [
        'You have learned to cast spells through studying the mystical forces of nature. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Druid spells.',
        'Cantrips. You know two cantrips of your choice from the Druid spell list. Whenever you gain a Druid level, you can replace one of your cantrips with another cantrip of your choice from the Druid spell list.',
        'Spell Slots. The Druid Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 Druid spells.',
        'Whenever you finish a Long Rest, you can change your list of prepared spells.',
        'Spellcasting Ability. Wisdom is your spellcasting ability for your Druid spells.',
        'Spellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Druid spells.',
      ] },
      { index: 'druid-druidic', name: 'Druidic', level: 1, description: [
        'You know Druidic, the secret language of Druids. While learning this language, you also unlocked a magical connection to the natural world.',
        'You always have the Speak with Animals spell prepared. You can also cast it without expending a spell slot, and you can do so a number of times equal to your Wisdom modifier (minimum of once). You regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'druid-primal-order', name: 'Primal Order', level: 1, description: [
        'You have dedicated yourself to one of the following sacred roles of your choice.',
        'Magician. You know one extra cantrip from the Druid spell list. In addition, your mystical connection to nature gives you a bonus to your Intelligence (Nature) checks. The bonus equals your Wisdom modifier (minimum of +1).',
        'Warden. Trained for battle, you gain proficiency with Martial weapons and training with Medium armor.',
      ], hasChoice: true },
      { index: 'druid-wild-shape', name: 'Wild Shape', level: 2, description: [
        'The power of nature allows you to assume the form of an animal. As a Bonus Action, you shape-shift into a Beast form that you have learned for this feature. You stay in that form for a number of hours equal to half your Druid level (round down). You can also leave the form early as a Bonus Action.',
        'Number of Uses. You can use Wild Shape a certain number of times, as shown in the Wild Shape column of the Druid Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.',
        'Known Forms. You know a number of forms for this feature equal to 2 plus half your Druid level (round down). Whenever you finish a Long Rest, you can replace one of your known forms with another eligible form.',
      ], hasChoice: true },
      { index: 'druid-wild-companion', name: 'Wild Companion', level: 2, description: [
        'You can summon a nature spirit that assumes an animal form to aid you. As a Magic action, you can expend a spell slot or a use of Wild Shape to cast the Find Familiar spell without Material components.',
        'When you cast the spell in this way, the familiar is Fey and disappears when the duration of the spell ends or when you use this feature to summon the familiar again.',
      ] },
      { index: 'druid-subclass', name: 'Druid Subclass', level: 3, description: ['You gain a Druid subclass of your choice. A subclass is a specialization that grants you features at certain Druid levels. For the rest of your career, you gain each of your subclass\'s features that are of your Druid level or lower.'], hasChoice: true },
      { index: 'druid-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Druid levels 8, 12, and 16.'], hasChoice: true },
      { index: 'druid-wild-resurgence', name: 'Wild Resurgence', level: 5, description: [
        'Once on each of your turns, if you have no uses of Wild Shape left, you can give yourself one use by expending a spell slot (no action required).',
        'In addition, you can expend one use of Wild Shape (no action required) to give yourself a level 1 spell slot, but you can\'t do so again until you finish a Long Rest.',
      ] },
      { index: 'druid-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Druid subclass.',
        '',
        'Land — Natural Recovery: During a Short Rest, you can recover expended spell slots. The slots can have a combined level equal to or less than half your Druid level (rounded up), and none can be 6th level or higher. Once per Long Rest.',
        '',
        'Moon — Improved Wild Shape: While in Wild Shape, your attacks count as magical. You can also cast Heal targeting yourself once without expending a spell slot while in Wild Shape, once per Long Rest.',
        '',
        'Sea — Wrath of the Sea: When you use your Wild Shape, you can create a 10-foot-radius sphere of ocean mist centered on yourself. Each creature of your choice in the sphere must make a Constitution saving throw or take cold damage equal to 2d6 + your Druid level and have their speed halved until the start of your next turn.',
        '',
        'Stars — Cosmic Omen: When you finish a Long Rest, you can consult a star chart. Roll a die: on even, allies within 30 feet can add 1d6 to a saving throw (Reaction); on odd, you can subtract 1d6 from an enemy\'s attack roll (Reaction). Uses equal to your proficiency bonus per Long Rest.',
      ] },
      { index: 'druid-elemental-fury', name: 'Elemental Fury', level: 7, description: [
        'The might of the elements flows through you. You gain one of the following options of your choice.',
        'Primal Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon or an Unarmed Strike, you can cause the target to take an extra 1d8 Cold, Fire, Lightning, or Thunder damage (your choice).',
        'Potent Spellcasting. You add your Wisdom modifier to the damage you deal with any Druid cantrip.',
      ], hasChoice: true },
      { index: 'druid-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'druid-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Druid subclass.',
        '',
        'Land — Nature\'s Ward: You can\'t be Charmed or Frightened by Elementals or Fey. You are also immune to Poison and Disease.',
        '',
        'Moon — Elemental Wild Shape: You can expend two uses of Wild Shape to transform into an Air, Earth, Fire, or Water Elemental.',
        '',
        'Sea — Oceanic Gift: Water within 30 feet of you that you can see becomes difficult terrain for enemies. Allies in the water gain a swimming speed equal to their walking speed.',
        '',
        'Stars — Twinkling Constellations: Your Starry Form gains additional effects. Archer: extra 1d6 radiant on hits. Chalice: targets also gain temp HP equal to your Wisdom modifier. Dragon: you also gain a flying speed of 20 feet.',
      ] },
      { index: 'druid-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'druid-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Druid subclass.',
        '',
        'Land — Nature\'s Sanctuary: Beasts and Plant creatures must make a Wisdom saving throw before attacking you. On a failure, they must choose a different target. If they can\'t, they automatically miss.',
        '',
        'Moon — Archdruid Wild Shape: Your Wild Shape forms gain bonus hit points equal to your Druid level. When you revert, you regain hit points equal to half the hit points your Wild Shape form had remaining.',
        '',
        'Sea — Master of the Deep: You can cast Maelstrom without expending a spell slot. Once per Long Rest. While concentrating on this spell, you have a swimming speed of 120 feet and can breathe underwater.',
        '',
        'Stars — Star Flare: As a Bonus Action, you can teleport up to 30 feet and cause each creature within 10 feet of your destination to make a Constitution save or take 4d10 radiant damage and be blinded until the end of your next turn. Once per Long Rest.',
      ] },
      { index: 'druid-improved-elemental-fury', name: 'Improved Elemental Fury', level: 15, description: [
        'The option you chose for Elemental Fury grows more powerful.',
        'Primal Strike. The extra damage of your Primal Strike increases to 2d8.',
        'Potent Spellcasting. When you cast a Druid cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting a number of Temporary Hit Points equal to twice your Wisdom modifier.',
      ] },
      { index: 'druid-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'druid-beast-spells', name: 'Beast Spells', level: 18, description: [
        'While using Wild Shape, you can cast spells in Beast form, except for any spell that has a Material component with a stated cost or that consumes its Material component.',
      ] },
      { index: 'druid-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'druid-archdruid', name: 'Archdruid', level: 20, description: [
        'The vitality of nature constantly blooms within you, granting you the following benefits.',
        'Evergreen Wild Shape. Whenever you roll Initiative and have no uses of Wild Shape left, you regain one expended use of it.',
        'Nature Magician. You can convert uses of Wild Shape into a spell slot (no action required). Choose a number of your Wild Shape uses to convert. The spell slot level equals half the number of uses you converted (round up). For example, if you convert four uses, you produce a level 2 spell slot. Once you use this benefit, you can\'t do so again until you finish a Long Rest.',
        'Longevity. The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FIGHTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  fighter: {
    index: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    primaryAbility: 'Strength or Dexterity',
    savingThrows: ['Strength', 'Constitution'],
    armorTraining: ['Light armor', 'Medium armor', 'Heavy armor', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'] },
    startingEquipment: "Choose A or B: (A) Chain Mail, Greatsword, Flail, 8 Javelins, Dungeoneer's Pack, and 4 GP; or (B) 175 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Fighting Style', 'Second Wind', 'Weapon Mastery'], classSpecific: { secondWindUses: 2, weaponMasteries: 3 } },
      { level: 2, profBonus: 2, features: ['Action Surge', 'Tactical Mind'], classSpecific: { secondWindUses: 2, actionSurgeUses: 1, weaponMasteries: 3 } },
      { level: 3, profBonus: 2, features: ['Fighter Subclass'], classSpecific: { secondWindUses: 2, actionSurgeUses: 1, weaponMasteries: 3 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, weaponMasteries: 4 } },
      { level: 5, profBonus: 3, features: ['Extra Attack', 'Tactical Shift'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, weaponMasteries: 4 } },
      { level: 6, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, weaponMasteries: 4 } },
      { level: 7, profBonus: 3, features: ['Subclass Feature'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, weaponMasteries: 4 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, weaponMasteries: 4 } },
      { level: 9, profBonus: 4, features: ['Indomitable', 'Tactical Master'], classSpecific: { secondWindUses: 3, actionSurgeUses: 1, indomitableUses: 1, weaponMasteries: 4 } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 1, weaponMasteries: 5 } },
      { level: 11, profBonus: 4, features: ['Two Extra Attacks'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 1, weaponMasteries: 5 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 1, weaponMasteries: 5 } },
      { level: 13, profBonus: 5, features: ['Indomitable', 'Studied Attacks'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 2, weaponMasteries: 5 } },
      { level: 14, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 2, weaponMasteries: 5 } },
      { level: 15, profBonus: 5, features: ['Subclass Feature'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 2, weaponMasteries: 5 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { secondWindUses: 4, actionSurgeUses: 1, indomitableUses: 2, weaponMasteries: 6 } },
      { level: 17, profBonus: 6, features: ['Action Surge', 'Indomitable'], classSpecific: { secondWindUses: 4, actionSurgeUses: 2, indomitableUses: 3, weaponMasteries: 6 } },
      { level: 18, profBonus: 6, features: ['Subclass Feature'], classSpecific: { secondWindUses: 4, actionSurgeUses: 2, indomitableUses: 3, weaponMasteries: 6 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { secondWindUses: 4, actionSurgeUses: 2, indomitableUses: 3, weaponMasteries: 6 } },
      { level: 20, profBonus: 6, features: ['Three Extra Attacks'], classSpecific: { secondWindUses: 4, actionSurgeUses: 2, indomitableUses: 3, weaponMasteries: 6 } },
    ],

    features: [
      { index: 'fighter-fighting-style', name: 'Fighting Style', level: 1, description: [
        'You gain a Fighting Style feat of your choice. Instead of choosing one of those feats, you can choose the option below.',
        'Great Weapon Fighting. When you roll damage for an attack you make with a Melee weapon that you are holding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.',
      ], hasChoice: true },
      { index: 'fighter-second-wind', name: 'Second Wind', level: 1, description: [
        'You have a limited well of physical stamina that you can draw on to protect yourself from harm. As a Bonus Action, you can regain Hit Points equal to 1d10 plus your Fighter level.',
        'You can use this feature the number of times shown for your Fighter level in the Second Wind column of the Fighter Features table. You regain all expended uses when you finish a Short or Long Rest.',
      ] },
      { index: 'fighter-weapon-mastery', name: 'Weapon Mastery', level: 1, description: [
        'Your training with weapons allows you to use the mastery properties of three kinds of Simple or Martial weapons of your choice. Whenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        'When you reach certain Fighter levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Fighter Features table.',
      ], hasChoice: true },
      { index: 'fighter-action-surge', name: 'Action Surge', level: 2, description: [
        'You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action, except the Magic action.',
        'Once you use this feature, you must finish a Short or Long Rest before you can use it again. Starting at level 17, you can use it twice before a rest but only once on a turn.',
      ] },
      { index: 'fighter-tactical-mind', name: 'Tactical Mind', level: 2, description: [
        'You have a tactical mind that helps you in combat. When you fail an ability check, you can expend a use of your Second Wind to push yourself toward success. Rather than regaining Hit Points, you roll 1d10 and add the number rolled to the ability check, potentially turning it into a success. If the check still fails, the use of Second Wind isn\'t expended.',
      ] },
      { index: 'fighter-subclass', name: 'Fighter Subclass', level: 3, description: ['You gain a Fighter subclass of your choice. A subclass is a specialization that grants you features at certain Fighter levels. For the rest of your career, you gain each of your subclass\'s features that are of your Fighter level or lower.'], hasChoice: true },
      { index: 'fighter-subclass-feature-3', name: 'Subclass Feature', level: 3, description: [
        'You gain a feature from your Fighter subclass.',
        '',
        'Battle Master — Combat Superiority: You learn maneuvers fueled by Superiority Dice. You have four Superiority Dice (d8), regained on a Short or Long Rest, and you know four maneuvers of your choice. A maneuver\'s save DC = 8 + your Proficiency Bonus + your Strength or Dexterity modifier (your choice). You learn more maneuvers and gain more dice as you advance.',
        '',
        'Champion — Improved Critical: Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20.',
        '',
        'Eldritch Knight — Spellcasting: You have learned to cast spells. You know two Wizard cantrips and prepare a small number of Wizard spells (mainly Abjuration and Evocation), using Intelligence as your spellcasting ability. See the class table for how many spells and slots you have.',
        '',
        'Psi Warrior — Psionic Power: You harbor a wellspring of psionic energy represented by Psionic Energy Dice (d6). You have a number of these dice equal to twice your Proficiency Bonus, and you can spend them on Protective Field, Psionic Strike, and Telekinetic Movement. You regain one die on a Short Rest and all dice on a Long Rest; the die size grows as you gain Fighter levels.',
        '',
        'Echo Knight — Manifest Echo: As a Bonus Action, you magically manifest an echo of yourself in an unoccupied space you can see within 30 feet. The echo is a Tiny, translucent duplicate with AC 14 + your Proficiency Bonus, 1 Hit Point, and immunity to all conditions. It lasts until it is destroyed, until you dismiss it (Bonus Action), until you manifest another echo, or until you have the Incapacitated condition. While the echo is within 30 feet of you, you can use a Bonus Action to move it up to 30 feet, and you can make attacks and Opportunity Attacks as though you were in its space. You can also swap places with it as a Bonus Action.',
      ] },
      { index: 'fighter-subclass-feature-3b', name: 'Subclass Feature', level: 3, description: [
        'You gain an additional feature from your Fighter subclass at level 3.',
        '',
        'Battle Master — Student of War: You gain proficiency with one type of Artisan\'s Tools of your choice, and you gain proficiency in one skill of your choice from the Fighter skill list.',
        '',
        'Eldritch Knight — War Bond: You learn a ritual that bonds you to a weapon. You can bond with up to two weapons but only summon one at a time. While bonded, you can\'t be disarmed of that weapon unless you have the Incapacitated condition, and you can summon it to your hand as a Bonus Action if it is on the same plane of existence.',
        '',
        'Echo Knight — Unleash Incarnation: Whenever you take the Attack action, you can make one additional melee attack from your echo\'s space. You can use this feature a number of times equal to your Constitution modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'fighter-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16.'], hasChoice: true },
      { index: 'fighter-extra-attack', name: 'Extra Attack', level: 5, description: ['You can attack twice instead of once whenever you take the Attack action on your turn.'] },
      { index: 'fighter-tactical-shift', name: 'Tactical Shift', level: 5, description: [
        'Whenever you activate your Second Wind with a Bonus Action, you can move up to half your Speed without provoking Opportunity Attacks.',
      ] },
      { index: 'fighter-asi-6', name: 'Ability Score Improvement', level: 6, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-subclass-feature-7', name: 'Subclass Feature', level: 7, description: [
        'You gain a feature from your Fighter subclass.',
        '',
        'Battle Master — Know Your Enemy: If you spend at least 1 minute observing a creature, the DM tells you if the creature is your equal, superior, or inferior in two characteristics of your choice (AC, current HP, total class levels, Fighter levels, Strength score, Dexterity score, Constitution score, or similar).',
        '',
        'Champion — Remarkable Athlete: You add half your proficiency bonus (rounded up) to any Strength, Dexterity, or Constitution check you make that doesn\'t already use your proficiency bonus. Your long jump distance increases by a number of feet equal to your Strength modifier.',
        '',
        'Eldritch Knight — War Magic: When you use your action to cast a cantrip, you can make one weapon attack as a Bonus Action.',
        '',
        'Psi Warrior — Telekinetic Adept: You can cast Telekinesis once without a spell slot (using Intelligence as the casting ability). Once per Long Rest. You can also propel yourself when you use Telekinetic Thrust, giving yourself a flying speed equal to your walking speed until end of turn.',
        '',
        'Echo Knight — Echo Avatar: As a Magic action, you can see and hear through your echo for up to 10 minutes. During this time, you have the Deafened and Blinded conditions with regard to your own senses, and the echo can be up to 1,000 feet away from you.',
      ] },
      { index: 'fighter-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-indomitable', name: 'Indomitable', level: 9, description: [
        'If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. You must use the new result.',
        'You can use this feature once. You gain additional uses at Fighter levels 13 (twice) and 17 (three times). You regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'fighter-tactical-master', name: 'Tactical Master', level: 9, description: [
        'When you attack with a weapon whose mastery property you can use, you can replace that property with the Push, Sap, or Slow property for that attack.',
      ] },
      { index: 'fighter-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Fighter subclass.',
        '',
        'Battle Master — Improved Combat Superiority: Your Superiority Dice become d10s.',
        '',
        'Champion — Heroic Warrior: You gain Heroic Inspiration whenever you start combat with none. Additionally, when you roll a 20 on an attack roll, you gain 5 temporary hit points.',
        '',
        'Eldritch Knight — Eldritch Strike: When you hit a creature with a weapon attack, that creature has Disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.',
        '',
        'Psi Warrior — Guarded Mind: You have Resistance to Psychic damage. Also, if you start your turn Charmed or Frightened, you can expend a Psionic Energy die to end every effect causing those conditions on yourself.',
        '',
        'Echo Knight — Shadow Martyr: As a Reaction when a creature you can see makes an attack roll against a target other than you that is within 5 feet of your echo, you can teleport the echo to an unoccupied space within 5 feet of that target and make the echo the target of the attack instead. Once per Short or Long Rest.',
      ] },
      { index: 'fighter-two-extra-attacks', name: 'Two Extra Attacks', level: 11, description: ['You can attack three times instead of once whenever you take the Attack action on your turn.'] },
      { index: 'fighter-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-studied-attacks', name: 'Studied Attacks', level: 13, description: [
        'You study your opponents and learn from each attack you make. If you make an attack roll against a creature and miss, you have Advantage on your next attack roll against that creature before the end of your next turn.',
      ] },
      { index: 'fighter-asi-14', name: 'Ability Score Improvement', level: 14, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-subclass-feature-15', name: 'Subclass Feature', level: 15, description: [
        'You gain a feature from your Fighter subclass.',
        '',
        'Battle Master — Relentless: When you roll Initiative with no Superiority Dice remaining, you regain one Superiority Die.',
        '',
        'Champion — Superior Critical: Your weapon attacks score a critical hit on a roll of 18, 19, or 20.',
        '',
        'Eldritch Knight — Arcane Charge: When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see. You can teleport before or after the additional action.',
        '',
        'Psi Warrior — Bulwark of Force: As a Bonus Action, you can choose up to your Intelligence modifier creatures within 30 feet. Each gains half cover for 1 minute or until you use this again. Once per Long Rest, or by expending a Psionic Energy die.',
        '',
        'Echo Knight — Reclaim Potential: When an echo of yours is destroyed by taking damage, you can gain temporary hit points equal to 2d6 + your Constitution modifier, provided you don\'t already have temporary hit points. You can use this a number of times equal to your Constitution modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'fighter-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-subclass-feature-18', name: 'Subclass Feature', level: 18, description: [
        'You gain a feature from your Fighter subclass.',
        '',
        'Battle Master — Ultimate Combat Superiority: Your Superiority Dice become d12s.',
        '',
        'Champion — Survivor: At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half your hit points remaining. You don\'t gain this benefit if you have 0 hit points.',
        '',
        'Eldritch Knight — Improved War Magic: When you use your action to cast a spell, you can make one weapon attack as a Bonus Action.',
        '',
        'Psi Warrior — Telekinetic Master: You can cast Telekinesis without a spell slot using Intelligence. While concentrating on it, you can also make one weapon attack as a Bonus Action on each of your turns.',
        '',
        'Echo Knight — Legion of One: You can use a Bonus Action to create two echoes with your Manifest Echo feature, and these echoes can coexist. If you try to create a third echo, the previous two are destroyed. Anything you can do from one echo\'s space, you can do from the other\'s instead. In addition, when you roll Initiative and have no uses of Unleash Incarnation left, you regain one use of that feature.',
      ] },
      { index: 'fighter-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'fighter-three-extra-attacks', name: 'Three Extra Attacks', level: 20, description: ['You can attack four times instead of once whenever you take the Attack action on your turn.'] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MONK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  monk: {
    index: 'monk',
    name: 'Monk',
    hitDie: 8,
    primaryAbility: 'Dexterity and Wisdom',
    savingThrows: ['Strength', 'Dexterity'],
    armorTraining: [],
    weaponProficiencies: ['Simple weapons', 'Martial weapons that have the Light property'],
    toolProficiencies: ["Choose one type of Artisan's Tools or Musical Instrument"],
    skillChoices: { choose: 2, from: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'] },
    startingEquipment: "Choose A or B: (A) Spear, 5 Daggers, Artisan's Tools or Musical Instrument chosen above, Explorer's Pack, and 11 GP; or (B) 50 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Martial Arts', 'Unarmored Defense'], classSpecific: { martialArtsDie: 'd6', focusPoints: 0 } },
      { level: 2, profBonus: 2, features: ["Monk's Focus", 'Unarmored Movement', 'Uncanny Metabolism'], classSpecific: { martialArtsDie: 'd6', focusPoints: 2, unarmoredMovement: 10 } },
      { level: 3, profBonus: 2, features: ['Monk Subclass', 'Deflect Attacks'], classSpecific: { martialArtsDie: 'd6', focusPoints: 3, unarmoredMovement: 10 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement', 'Slow Fall'], classSpecific: { martialArtsDie: 'd6', focusPoints: 4, unarmoredMovement: 10 } },
      { level: 5, profBonus: 3, features: ['Extra Attack', 'Stunning Strike'], classSpecific: { martialArtsDie: 'd8', focusPoints: 5, unarmoredMovement: 10 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature', 'Empowered Strikes'], classSpecific: { martialArtsDie: 'd8', focusPoints: 6, unarmoredMovement: 15 } },
      { level: 7, profBonus: 3, features: ['Evasion'], classSpecific: { martialArtsDie: 'd8', focusPoints: 7, unarmoredMovement: 15 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { martialArtsDie: 'd8', focusPoints: 8, unarmoredMovement: 15 } },
      { level: 9, profBonus: 4, features: ['Acrobatic Movement'], classSpecific: { martialArtsDie: 'd8', focusPoints: 9, unarmoredMovement: 15 } },
      { level: 10, profBonus: 4, features: ['Heightened Focus', 'Self-Restoration'], classSpecific: { martialArtsDie: 'd8', focusPoints: 10, unarmoredMovement: 20 } },
      { level: 11, profBonus: 4, features: ['Subclass Feature'], classSpecific: { martialArtsDie: 'd10', focusPoints: 11, unarmoredMovement: 20 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { martialArtsDie: 'd10', focusPoints: 12, unarmoredMovement: 20 } },
      { level: 13, profBonus: 5, features: ['Deflect Energy'], classSpecific: { martialArtsDie: 'd10', focusPoints: 13, unarmoredMovement: 20 } },
      { level: 14, profBonus: 5, features: ['Disciplined Survivor'], classSpecific: { martialArtsDie: 'd10', focusPoints: 14, unarmoredMovement: 25 } },
      { level: 15, profBonus: 5, features: ['Perfect Focus'], classSpecific: { martialArtsDie: 'd10', focusPoints: 15, unarmoredMovement: 25 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { martialArtsDie: 'd10', focusPoints: 16, unarmoredMovement: 25 } },
      { level: 17, profBonus: 6, features: ['Subclass Feature'], classSpecific: { martialArtsDie: 'd12', focusPoints: 17, unarmoredMovement: 25 } },
      { level: 18, profBonus: 6, features: ['Superior Defense'], classSpecific: { martialArtsDie: 'd12', focusPoints: 18, unarmoredMovement: 30 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { martialArtsDie: 'd12', focusPoints: 19, unarmoredMovement: 30 } },
      { level: 20, profBonus: 6, features: ['Body and Mind'], classSpecific: { martialArtsDie: 'd12', focusPoints: 20, unarmoredMovement: 30 } },
    ],

    features: [
      { index: 'monk-martial-arts', name: 'Martial Arts', level: 1, description: [
        'Your practice of martial arts gives you mastery of combat styles that use your Unarmed Strike and Monk weapons, which are Simple Melee weapons and Martial Melee weapons with the Light property.',
        'You gain the following benefits while you are unarmed or wielding only Monk weapons and you aren\'t wearing armor or wielding a Shield.',
        'Bonus Unarmed Strike. You can make one Unarmed Strike as a Bonus Action.',
        'Dexterous Attacks. You can use Dexterity instead of Strength for the attack and damage rolls of your Unarmed Strikes and Monk weapons. In addition, when you use the Grapple or Shove option of your Unarmed Strike, you can use your Dexterity modifier instead of your Strength modifier to determine the save DC.',
        'Martial Arts Die. You can roll your Martial Arts die in place of the normal damage of your Unarmed Strike or Monk weapons. This die starts as a d6 and changes as you gain Monk levels, as shown in the Martial Arts column of the Monk Features table.',
      ] },
      { index: 'monk-unarmored-defense', name: 'Unarmored Defense', level: 1, description: [
        'While you aren\'t wearing any armor or wielding a Shield, your base Armor Class equals 10 plus your Dexterity and Wisdom modifiers.',
      ] },
      { index: 'monk-focus', name: "Monk's Focus", level: 2, description: [
        'Your focus and martial training allow you to harness a well of extraordinary energy within yourself. Your access to this energy is represented by a number of Focus Points. Your Monk level determines the number of points you have, as shown in the Focus Points column of the Monk Features table.',
        'You can spend these points to fuel certain Monk features. You start knowing three such features: Flurry of Blows, Patient Defense, and Step of the Wind, each of which is detailed below.',
        'When you spend a Focus Point, it is unavailable until you finish a Short or Long Rest, at the end of which you regain all your expended Focus Points.',
        'Flurry of Blows. You can spend 1 Focus Point to make two Unarmed Strikes as a Bonus Action.',
        'Patient Defense. You can take the Disengage action as a Bonus Action. Alternatively, you can spend 1 Focus Point to take both the Disengage and the Dodge actions as a Bonus Action.',
        'Step of the Wind. You can take the Dash action as a Bonus Action. Alternatively, you can spend 1 Focus Point to take both the Dash and the Disengage actions as a Bonus Action, and your jump distance is doubled for the turn.',
      ] },
      { index: 'monk-unarmored-movement', name: 'Unarmored Movement', level: 2, description: [
        'Your speed increases by 10 feet while you aren\'t wearing armor or wielding a Shield. This bonus increases when you reach certain Monk levels, as shown on the Monk Features table.',
      ] },
      { index: 'monk-uncanny-metabolism', name: 'Uncanny Metabolism', level: 2, description: [
        'When you roll Initiative, you can regain all expended Focus Points. When you do so, roll your Martial Arts die, and regain a number of Hit Points equal to your Monk level plus the number rolled.',
        'Once you use this feature, you can\'t use it again until you finish a Long Rest.',
      ] },
      { index: 'monk-subclass', name: 'Monk Subclass', level: 3, description: ['You gain a Monk subclass of your choice. A subclass is a specialization that grants you features at certain Monk levels. For the rest of your career, you gain each of your subclass\'s features that are of your Monk level or lower.'], hasChoice: true },
      { index: 'monk-deflect-attacks', name: 'Deflect Attacks', level: 3, description: [
        'You can use your Reaction to deflect melee and ranged attacks against you that deal Bludgeoning, Piercing, or Slashing damage. When you do so, the total damage you take from the attack is reduced by 1d10 plus your Dexterity modifier plus your Monk level.',
        'If you reduce the damage to 0 and the attack was a ranged attack, you can spend 1 Focus Point to redirect the attack. When you do, you make a ranged attack (range 20/60) using the deflected projectile or weapon. The attack uses your Martial Arts die for damage.',
      ] },
      { index: 'monk-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16.'], hasChoice: true },
      { index: 'monk-slow-fall', name: 'Slow Fall', level: 4, description: [
        'You can use your Reaction when you fall to reduce any damage you take from the fall by an amount equal to five times your Monk level.',
      ] },
      { index: 'monk-extra-attack', name: 'Extra Attack', level: 5, description: ['You can attack twice instead of once whenever you take the Attack action on your turn.'] },
      { index: 'monk-stunning-strike', name: 'Stunning Strike', level: 5, description: [
        'Once per turn when you hit a creature with a Monk weapon or an Unarmed Strike, you can spend 1 Focus Point to attempt a stunning strike. The target must make a Constitution saving throw. On a failed save, the target has the Stunned condition until the start of your next turn.',
      ] },
      { index: 'monk-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Monk subclass.',
        '',
        'Open Hand — Wholeness of Body: As a Bonus Action, you can roll your Martial Arts die. You regain hit points equal to the number rolled plus your Wisdom modifier. You can use this a number of times equal to your proficiency bonus per Long Rest.',
        '',
        'Shadow — Shadow Step: When you are in dim light or darkness, as a Bonus Action you can teleport up to 60 feet to an unoccupied space you can see that is also in dim light or darkness. You then have Advantage on the first melee attack you make before the end of the turn.',
        '',
        'Elements — Elemental Burst: When you use Flurry of Blows, you can replace the unarmed strikes with a burst of elemental energy. Each creature within 20 feet must make a Dexterity saving throw, taking damage equal to three rolls of your Martial Arts die on a failure (half on success). Choose Acid, Cold, Fire, Lightning, or Thunder for the damage type each time.',
        '',
        'Mercy — Physician\'s Touch: Your Hands of Harm can also inflict the Poisoned condition. Your Hands of Healing can also end one of the following conditions: Blinded, Deafened, Paralyzed, Poisoned, or Stunned.',
      ] },
      { index: 'monk-empowered-strikes', name: 'Empowered Strikes', level: 6, description: [
        'Whenever you deal damage with your Unarmed Strike, it can deal your choice of Force damage or its normal damage type.',
      ] },
      { index: 'monk-evasion', name: 'Evasion', level: 7, description: [
        'When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You can\'t use this feature if you have the Incapacitated condition.',
      ] },
      { index: 'monk-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'monk-acrobatic-movement', name: 'Acrobatic Movement', level: 9, description: [
        'While you aren\'t wearing armor or wielding a Shield, you gain the ability to move along vertical surfaces and across liquids on your turn without falling during the movement.',
      ] },
      { index: 'monk-heightened-focus', name: 'Heightened Focus', level: 10, description: [
        'Your Flurry of Blows, Patient Defense, and Step of the Wind gain the following improvements.',
        'Flurry of Blows. You can spend 1 Focus Point to use Flurry of Blows and make three Unarmed Strikes with it instead of two.',
        'Patient Defense. When you spend a Focus Point to use Patient Defense, you gain a number of Temporary Hit Points equal to two rolls of your Martial Arts die.',
        'Step of the Wind. When you spend a Focus Point to use Step of the Wind, you can choose a willing creature within 5 feet of you that is Small or Medium. You move the creature with you until the end of your turn.',
      ] },
      { index: 'monk-self-restoration', name: 'Self-Restoration', level: 10, description: [
        'Through sheer force of will, you can remove one of the following conditions from yourself at the end of each of your turns: Charmed, Frightened, or Poisoned.',
        'In addition, forgoing food and drink doesn\'t give you levels of Exhaustion.',
      ] },
      { index: 'monk-subclass-feature-11', name: 'Subclass Feature', level: 11, description: [
        'You gain a feature from your Monk subclass.',
        '',
        'Open Hand — Fleet Step: When you take a Bonus Action other than Step of the Wind, you can also move up to half your speed without provoking Opportunity Attacks.',
        '',
        'Shadow — Cloak of Shadows: You can use a Bonus Action to become Invisible in dim light or darkness. The invisibility lasts until you attack, cast a spell, or enter bright light.',
        '',
        'Elements — Stride of the Elements: You gain a flying speed and a swimming speed equal to your walking speed.',
        '',
        'Mercy — Flurry of Healing and Harm: When you use Flurry of Blows, you can now replace each unarmed strike with a use of Hands of Healing without spending Focus Points. Each time you use Hands of Harm, you deal extra necrotic damage equal to one roll of your Martial Arts die.',
      ] },
      { index: 'monk-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'monk-deflect-energy', name: 'Deflect Energy', level: 13, description: [
        'You can now use your Deflect Attacks feature against attacks that deal any damage type, not just Bludgeoning, Piercing, or Slashing.',
      ] },
      { index: 'monk-disciplined-survivor', name: 'Disciplined Survivor', level: 14, description: [
        'Your physical and mental discipline grant you proficiency in all saving throws.',
        'Additionally, whenever you make a saving throw and fail, you can spend 1 Focus Point to reroll it, and you must use the new result.',
      ] },
      { index: 'monk-perfect-focus', name: 'Perfect Focus', level: 15, description: [
        'When you roll Initiative and have fewer than 4 Focus Points, your Focus Points are restored to 4.',
      ] },
      { index: 'monk-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'monk-subclass-feature-17', name: 'Subclass Feature', level: 17, description: [
        'You gain a feature from your Monk subclass.',
        '',
        'Open Hand — Quivering Palm: When you hit a creature with an unarmed strike, you can start imperceptible vibrations that last for a number of days equal to your Monk level. You can then use an action to end the vibrations: the creature must make a Constitution saving throw. On a failure, it drops to 0 hit points. On a success, it takes 10d12 Force damage. You can have only one creature under this effect at a time.',
        '',
        'Shadow — Opportunist: When a creature within 5 feet of you is hit by an attack roll made by another creature, you can use your Reaction to make a melee attack against that creature.',
        '',
        'Elements — Elemental Epitome: When you activate your Elemental Attunement, you also gain additional benefits: Resistance to your chosen element, your Elemental Burst damage becomes four Martial Arts dice, and you gain a +1 bonus to AC.',
        '',
        'Mercy — Hand of Ultimate Mercy: As an action, you can touch the corpse of a creature that died within the past 24 hours and expend 5 Focus Points. The creature returns to life with hit points equal to 4d10 + your Wisdom modifier. Once per Long Rest.',
      ] },
      { index: 'monk-superior-defense', name: 'Superior Defense', level: 18, description: [
        'At the start of your turn, you can spend 3 Focus Points to bolster yourself against harm for 1 minute or until you have the Incapacitated condition. During that time, you have Resistance to all damage except Force damage.',
      ] },
      { index: 'monk-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'monk-body-and-mind', name: 'Body and Mind', level: 20, description: [
        'You have honed your body and mind to new heights. Your Dexterity and Wisdom scores increase by 4, to a maximum of 25.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PALADIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  paladin: {
    index: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    primaryAbility: 'Strength and Charisma',
    savingThrows: ['Wisdom', 'Charisma'],
    armorTraining: ['Light armor', 'Medium armor', 'Heavy armor', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'] },
    startingEquipment: "Choose A or B: (A) Chain Mail, Shield, Longsword, 6 Javelins, Holy Symbol, Priest's Pack, and 9 GP; or (B) 150 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Lay on Hands', 'Spellcasting', 'Weapon Mastery'], classSpecific: { layOnHandsPool: 5, weaponMasteries: 2 } },
      { level: 2, profBonus: 2, features: ['Divine Smite', 'Fighting Style'], classSpecific: { layOnHandsPool: 10, weaponMasteries: 2 } },
      { level: 3, profBonus: 2, features: ['Channel Divinity', 'Paladin Subclass'], classSpecific: { layOnHandsPool: 15, channelDivinityUses: 2, weaponMasteries: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { layOnHandsPool: 20, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 5, profBonus: 3, features: ['Extra Attack', 'Faithful Steed'], classSpecific: { layOnHandsPool: 25, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 6, profBonus: 3, features: ['Aura of Protection'], classSpecific: { layOnHandsPool: 30, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 7, profBonus: 3, features: ['Subclass Feature'], classSpecific: { layOnHandsPool: 35, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { layOnHandsPool: 40, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 9, profBonus: 4, features: ['Abjure Foes'], classSpecific: { layOnHandsPool: 45, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 10, profBonus: 4, features: ['Aura of Courage'], classSpecific: { layOnHandsPool: 50, channelDivinityUses: 2, weaponMasteries: 3 } },
      { level: 11, profBonus: 4, features: ['Radiant Strikes'], classSpecific: { layOnHandsPool: 55, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { layOnHandsPool: 60, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 13, profBonus: 5, features: [], classSpecific: { layOnHandsPool: 65, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 14, profBonus: 5, features: ['Restoring Touch'], classSpecific: { layOnHandsPool: 70, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 15, profBonus: 5, features: ['Subclass Feature'], classSpecific: { layOnHandsPool: 75, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { layOnHandsPool: 80, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 17, profBonus: 6, features: [], classSpecific: { layOnHandsPool: 85, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 18, profBonus: 6, features: ['Aura Expansion'], classSpecific: { layOnHandsPool: 90, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { layOnHandsPool: 95, channelDivinityUses: 3, weaponMasteries: 3 } },
      { level: 20, profBonus: 6, features: ['Subclass Feature'], classSpecific: { layOnHandsPool: 100, channelDivinityUses: 3, weaponMasteries: 3 } },
    ],

    features: [
      { index: 'paladin-lay-on-hands', name: 'Lay on Hands', level: 1, description: [
        'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you finish a Long Rest. With that pool, you can restore a total number of Hit Points equal to five times your Paladin level.',
        'As a Bonus Action, you can touch a creature (which could be yourself) and draw power from the pool of healing to restore a number of Hit Points to that creature, up to the maximum amount remaining in the pool.',
        'You can also expend 5 Hit Points from the pool of healing power to remove the Poisoned condition from the creature; those points don\'t also restore Hit Points to the creature.',
      ] },
      { index: 'paladin-spellcasting', name: 'Spellcasting', level: 1, description: [
        'You have learned to cast spells through prayer, meditation, and devotion. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Paladin spells.',
        'Spell Slots. The Paladin Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Paladin spells.',
        'Whenever you finish a Long Rest, you can change your list of prepared spells.',
        'Spellcasting Ability. Charisma is your spellcasting ability for your Paladin spells.',
        'Spellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Paladin spells.',
      ] },
      { index: 'paladin-weapon-mastery', name: 'Weapon Mastery', level: 1, description: [
        'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        'When you reach certain Paladin levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Paladin Features table.',
      ], hasChoice: true },
      { index: 'paladin-divine-smite', name: 'Divine Smite', level: 2, description: [
        'When you hit a target with an attack roll using a Melee weapon or an Unarmed Strike, you can expend one spell slot to deal extra Radiant damage. The extra damage is 2d8 for a level 1 spell slot, plus 1d8 for each spell level higher than 1.',
      ] },
      { index: 'paladin-fighting-style', name: 'Fighting Style', level: 2, description: [
        'You gain a Fighting Style feat of your choice.',
      ], hasChoice: true },
      { index: 'paladin-channel-divinity', name: 'Channel Divinity', level: 3, description: [
        'You can channel divine energy to fuel magical effects. Each Channel Divinity option provided by your subclass explains how to use it.',
        'When you use your Channel Divinity, you choose which option to use. You must then finish a Short or Long Rest to use your Channel Divinity again.',
      ] },
      { index: 'paladin-subclass', name: 'Paladin Subclass', level: 3, description: ['You gain a Paladin subclass of your choice. A subclass is a specialization that grants you features at certain Paladin levels. For the rest of your career, you gain each of your subclass\'s features that are of your Paladin level or lower.'], hasChoice: true },
      { index: 'paladin-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16.'], hasChoice: true },
      { index: 'paladin-extra-attack', name: 'Extra Attack', level: 5, description: ['You can attack twice instead of once whenever you take the Attack action on your turn.'] },
      { index: 'paladin-faithful-steed', name: 'Faithful Steed', level: 5, description: [
        'You can call on the celestial forces to provide you with a loyal mount. You always have the Find Steed spell prepared. You can also cast it once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest.',
      ] },
      { index: 'paladin-aura-of-protection', name: 'Aura of Protection', level: 6, description: [
        'You radiate a protective, invisible aura in a 10-foot Emanation that originates from you. The aura is inactive while you have the Incapacitated condition.',
        'You and your allies in the aura gain a bonus to saving throws equal to your Charisma modifier (minimum bonus of +1).',
        'If another Paladin is present, a creature can benefit from only one Aura of Protection at a time; the creature chooses which one when entering the auras.',
      ] },
      { index: 'paladin-subclass-feature-7', name: 'Subclass Feature', level: 7, description: [
        'You gain a feature from your Paladin subclass.',
        '',
        'Devotion — Aura of Devotion: You and friendly creatures within 10 feet of you can\'t be Charmed while you are conscious. At 18th level, the range increases to 30 feet.',
        '',
        'Glory — Aura of Alacrity: Your walking speed increases by 10 feet. Allies within 5 feet also gain +10 walking speed while they start their turn there. At 18th level, the range increases to 10 feet.',
        '',
        'Ancients — Aura of Warding: You and friendly creatures within 10 feet have Resistance to damage from spells. At 18th level, the range increases to 30 feet.',
        '',
        'Vengeance — Relentless Avenger: When you hit a creature with an Opportunity Attack, you can move up to half your speed immediately after the attack as part of the same Reaction. This movement doesn\'t provoke Opportunity Attacks.',
      ] },
      { index: 'paladin-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'paladin-abjure-foes', name: 'Abjure Foes', level: 9, description: [
        'As a Magic action, you can present your Holy Symbol and speak a prayer of denunciation. Each creature of your choice within 60 feet of you must make a Wisdom saving throw against your spell save DC. On a failed save, the creature has the Frightened condition for 1 minute. The Frightened creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.',
        'You can use this feature a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'paladin-aura-of-courage', name: 'Aura of Courage', level: 10, description: [
        'You and your allies have Immunity to the Frightened condition while in your Aura of Protection. If a Frightened ally enters the aura, that condition has no effect on that ally while there.',
      ] },
      { index: 'paladin-radiant-strikes', name: 'Radiant Strikes', level: 11, description: [
        'Your attacks are now infused with divine energy. When you hit a target with an attack roll using a Melee weapon or an Unarmed Strike, the target takes an extra 1d8 Radiant damage.',
      ] },
      { index: 'paladin-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'paladin-restoring-touch', name: 'Restoring Touch', level: 14, description: [
        'When you use Lay on Hands on a creature, you can also remove one or more of the following conditions from the creature: Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned. You must expend 5 Hit Points from the healing pool for each of these conditions you remove; those points don\'t also restore Hit Points to the creature.',
      ] },
      { index: 'paladin-subclass-feature-15', name: 'Subclass Feature', level: 15, description: [
        'You gain a feature from your Paladin subclass.',
        '',
        'Devotion — Smite of Protection: Whenever you cast Divine Smite, you and your allies have Half Cover while within your Aura of Protection. The aura has this benefit until the start of your next turn.',
        '',
        'Glory — Glorious Defense: When a creature you can see hits you or an ally within 10 feet with an attack roll, you can use your Reaction to add your Charisma modifier to AC against that attack, potentially causing it to miss. If it misses, you can make one weapon attack against the attacker. Uses equal to Charisma modifier per Long Rest.',
        '',
        'Ancients — Undying Sentinel: When you are reduced to 0 hit points but not killed outright, you drop to 1 hit point instead. Once per Long Rest. Additionally, you suffer none of the drawbacks of old age.',
        '',
        'Vengeance — Soul of Vengeance: When a creature under your Vow of Enmity makes an attack, you can use your Reaction to make a melee weapon attack against that creature if it is within range.',
      ] },
      { index: 'paladin-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'paladin-aura-expansion', name: 'Aura Expansion', level: 18, description: [
        'Your Aura of Protection now extends in a 30-foot Emanation.',
      ] },
      { index: 'paladin-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'paladin-subclass-feature-20', name: 'Subclass Feature', level: 20, description: [
        'You gain a feature from your Paladin subclass.',
        '',
        'Devotion — Holy Nimbus: As a Bonus Action, you emanate an aura of sunlight for 1 minute. You emit bright light in a 30-foot radius and dim light 30 feet beyond that. Enemies that start their turn in the bright light take 10 radiant damage. You also have Advantage on saving throws against spells cast by Fiends or Undead. Once per Long Rest.',
        '',
        'Glory — Living Legend: As a Bonus Action, you gain the following benefits for 1 minute: Advantage on all Charisma checks, once per turn when you miss with a weapon attack you can make the attack hit instead, and if you fail a saving throw you can use your Reaction to reroll it. Once per Long Rest.',
        '',
        'Ancients — Elder Champion: As a Bonus Action, you undergo a transformation for 1 minute: you regain 10 HP at the start of each turn, you can cast Paladin spells with a casting time of 1 action as a Bonus Action, and enemies within 10 feet have Disadvantage on saving throws against your spells and Channel Divinity. Once per Long Rest.',
        '',
        'Vengeance — Avenging Angel: As a Bonus Action, you transform for 1 hour: you sprout spectral wings (60-ft flying speed), and you emanate a menacing aura in a 30-foot radius. Enemies that enter the aura or start their turn there must make a Wisdom saving throw or be Frightened for 1 minute. Once per Long Rest.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RANGER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ranger: {
    index: 'ranger',
    name: 'Ranger',
    hitDie: 10,
    primaryAbility: 'Dexterity and Wisdom',
    savingThrows: ['Strength', 'Dexterity'],
    armorTraining: ['Light armor', 'Medium armor', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 3, from: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'] },
    startingEquipment: "Choose A or B: (A) Studded Leather Armor, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Druidic Focus (Sprig of Mistletoe), Explorer's Pack, and 7 GP; or (B) 150 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Spellcasting', 'Favored Enemy', 'Weapon Mastery'], classSpecific: { weaponMasteries: 2 } },
      { level: 2, profBonus: 2, features: ['Deft Explorer', 'Fighting Style'], classSpecific: { weaponMasteries: 2 } },
      { level: 3, profBonus: 2, features: ['Ranger Subclass'], classSpecific: { weaponMasteries: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { weaponMasteries: 3 } },
      { level: 5, profBonus: 3, features: ['Extra Attack'], classSpecific: { weaponMasteries: 3 } },
      { level: 6, profBonus: 3, features: ['Roving'], classSpecific: { weaponMasteries: 3 } },
      { level: 7, profBonus: 3, features: ['Subclass Feature'], classSpecific: { weaponMasteries: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { weaponMasteries: 3 } },
      { level: 9, profBonus: 4, features: ['Expertise'], classSpecific: { weaponMasteries: 3 } },
      { level: 10, profBonus: 4, features: ['Tireless'], classSpecific: { weaponMasteries: 3 } },
      { level: 11, profBonus: 4, features: ['Subclass Feature'], classSpecific: { weaponMasteries: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { weaponMasteries: 3 } },
      { level: 13, profBonus: 5, features: ['Relentless Hunter'], classSpecific: { weaponMasteries: 3 } },
      { level: 14, profBonus: 5, features: ["Nature's Veil"], classSpecific: { weaponMasteries: 3 } },
      { level: 15, profBonus: 5, features: ['Subclass Feature'], classSpecific: { weaponMasteries: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { weaponMasteries: 3 } },
      { level: 17, profBonus: 6, features: ['Precise Hunter'], classSpecific: { weaponMasteries: 3 } },
      { level: 18, profBonus: 6, features: ['Feral Senses'], classSpecific: { weaponMasteries: 3 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { weaponMasteries: 3 } },
      { level: 20, profBonus: 6, features: ['Foe Slayer'], classSpecific: { weaponMasteries: 3 } },
    ],

    features: [
      { index: 'ranger-spellcasting', name: 'Spellcasting', level: 1, description: [
        'You have learned to channel the magical essence of nature to cast spells. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Ranger spells.',
        'Spell Slots. The Ranger Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Ranger spells.',
        'Whenever you finish a Long Rest, you can replace one spell on your list with another Ranger spell for which you have spell slots.',
        'Spellcasting Ability. Wisdom is your spellcasting ability for your Ranger spells.',
        'Spellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Ranger spells.',
      ] },
      { index: 'ranger-favored-enemy', name: 'Favored Enemy', level: 1, description: [
        'You always have the Hunter\'s Mark spell prepared. You can cast it twice without expending a spell slot, and you regain all expended uses of this ability when you finish a Long Rest.',
        'The number of times you can cast the spell in this way increases when you reach certain Ranger levels, as shown in the Favored Enemy column of the Ranger Features table.',
      ] },
      { index: 'ranger-weapon-mastery', name: 'Weapon Mastery', level: 1, description: [
        'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        'When you reach certain Ranger levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Ranger Features table.',
      ], hasChoice: true },
      { index: 'ranger-deft-explorer', name: 'Deft Explorer', level: 2, description: [
        'Thanks to your travels, you gain the following benefits.',
        'Expertise. Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills.',
        'Languages. You know two languages of your choice.',
      ], hasChoice: true },
      { index: 'ranger-fighting-style', name: 'Fighting Style', level: 2, description: [
        'You gain a Fighting Style feat of your choice.',
      ], hasChoice: true },
      { index: 'ranger-subclass', name: 'Ranger Subclass', level: 3, description: ['You gain a Ranger subclass of your choice. A subclass is a specialization that grants you features at certain Ranger levels.'], hasChoice: true },
      { index: 'ranger-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16.'], hasChoice: true },
      { index: 'ranger-extra-attack', name: 'Extra Attack', level: 5, description: ['You can attack twice instead of once whenever you take the Attack action on your turn.'] },
      { index: 'ranger-roving', name: 'Roving', level: 6, description: [
        'Your Speed increases by 10 feet while you aren\'t wearing Heavy armor. You also have a Climb Speed and a Swim Speed equal to your Speed.',
      ] },
      { index: 'ranger-subclass-feature-7', name: 'Subclass Feature', level: 7, description: [
        'You gain a feature from your Ranger subclass.',
        '',
        'Beast Master — Exceptional Training: On any of your turns when your beast companion doesn\'t attack, you can use a Bonus Action to command the beast to Dash, Disengage, Dodge, or Help.',
        '',
        'Fey Wanderer — Beguiling Twist: When you or a creature you can see within 120 feet succeeds on a saving throw against being Charmed or Frightened, you can use your Reaction to force a different creature within 120 feet to make a Wisdom save or be Charmed or Frightened by you for 1 minute.',
        '',
        'Gloom Stalker — Iron Mind: You gain proficiency in Wisdom saving throws. If you already have it, you gain Intelligence or Charisma saves instead.',
        '',
        'Hunter — Defensive Tactics: Choose one: Escape the Horde (opportunity attacks against you have Disadvantage), Multiattack Defense (after a creature hits you, you gain +4 AC against all subsequent attacks from that creature this turn), or Steel Will (you have Advantage on saves against being Frightened).',
      ] },
      { index: 'ranger-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'ranger-expertise', name: 'Expertise', level: 9, description: ['Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills.'], hasChoice: true },
      { index: 'ranger-tireless', name: 'Tireless', level: 10, description: [
        'Primal forces now help fuel you on every excursion.',
        'Temporary Hit Points. As a Magic action, you can give yourself a number of Temporary Hit Points equal to 1d8 plus your Wisdom modifier (minimum of 1). You can use this action a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
        'Decrease Exhaustion. Whenever you finish a Short Rest, your Exhaustion level, if any, decreases by 1.',
      ] },
      { index: 'ranger-subclass-feature-11', name: 'Subclass Feature', level: 11, description: [
        'You gain a feature from your Ranger subclass.',
        '',
        'Beast Master — Bestial Fury: Your beast companion can make two attacks when you command it to take the Attack action. Additionally, the beast\'s attacks now count as magical.',
        '',
        'Fey Wanderer — Misty Wanderer: You can cast Misty Step without expending a spell slot a number of times equal to your Wisdom modifier per Long Rest. When you cast Misty Step, you can bring along one willing creature within 5 feet.',
        '',
        'Gloom Stalker — Stalker\'s Flurry: When you miss with an attack roll, you can make another attack roll as part of the same action. You can use this only once per turn.',
        '',
        'Hunter — Multiattack: Choose one: Volley (as an action, make a ranged attack against any number of creatures within 10 feet of a point you can see in range, with separate attack rolls) or Whirlwind Attack (as an action, make a melee attack against any number of creatures within 5 feet of you, with separate attack rolls).',
      ] },
      { index: 'ranger-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'ranger-relentless-hunter', name: 'Relentless Hunter', level: 13, description: [
        'Taking damage can\'t break your Concentration on Hunter\'s Mark.',
      ] },
      { index: 'ranger-natures-veil', name: "Nature's Veil", level: 14, description: [
        'You invoke spirits of nature to magically hide yourself. As a Bonus Action, you can give yourself the Invisible condition until the end of your next turn.',
        'You can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'ranger-subclass-feature-15', name: 'Subclass Feature', level: 15, description: [
        'You gain a feature from your Ranger subclass.',
        '',
        'Beast Master — Share Spells: When you cast a spell targeting yourself, you can also affect your beast companion if the beast is within 30 feet of you.',
        '',
        'Fey Wanderer — Fey Reinforcements: You can cast Summon Fey without a spell slot, and it doesn\'t require Concentration when cast this way. Once per Long Rest. The fey spirit you summon is friendly to you and your companions.',
        '',
        'Gloom Stalker — Shadowy Dodge: When a creature makes an attack roll against you and you can see the attacker, you can use your Reaction to impose Disadvantage on the attack roll.',
        '',
        'Hunter — Superior Hunter\'s Defense: Choose one: Evasion (Dexterity saves for half damage: take no damage on success, half on failure), Stand Against the Tide (when a hostile creature misses you with a melee attack, you can force it to repeat the attack against another creature of your choice), or Uncanny Dodge (when an attacker you can see hits you, halve the attack\'s damage).',
      ] },
      { index: 'ranger-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'ranger-precise-hunter', name: 'Precise Hunter', level: 17, description: [
        'You have Advantage on attack rolls against the creature currently marked by your Hunter\'s Mark.',
      ] },
      { index: 'ranger-feral-senses', name: 'Feral Senses', level: 18, description: [
        'You gain preternatural senses that help you fight creatures you can\'t see. When you attack a creature you can\'t see, your inability to see it doesn\'t impose Disadvantage on your attack rolls against it.',
        'You are also aware of the location of any Invisible creature within 30 feet of you, provided that the creature isn\'t hidden from you and you aren\'t Blinded or Deafened.',
      ] },
      { index: 'ranger-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'ranger-foe-slayer', name: 'Foe Slayer', level: 20, description: [
        'You become an unparalleled hunter of your enemies. Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll against the target of your Hunter\'s Mark. You can choose to use this feature before or after the roll, but before any effects of the roll are applied.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ROGUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  rogue: {
    index: 'rogue',
    name: 'Rogue',
    hitDie: 8,
    primaryAbility: 'Dexterity',
    savingThrows: ['Dexterity', 'Intelligence'],
    armorTraining: ['Light armor'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons that have the Finesse or Light property'],
    toolProficiencies: ["Thieves' Tools"],
    skillChoices: { choose: 4, from: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'] },
    startingEquipment: "Choose A or B: (A) Leather Armor, 2 Daggers, Shortsword, Shortbow, 20 Arrows, Quiver, Thieves' Tools, Burglar's Pack, and 8 GP; or (B) 100 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Expertise', 'Sneak Attack', "Thieves' Cant", 'Weapon Mastery'], classSpecific: { sneakAttackDice: 1, weaponMasteries: 2 } },
      { level: 2, profBonus: 2, features: ['Cunning Action'], classSpecific: { sneakAttackDice: 1, weaponMasteries: 2 } },
      { level: 3, profBonus: 2, features: ['Rogue Subclass', 'Steady Aim'], classSpecific: { sneakAttackDice: 2, weaponMasteries: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { sneakAttackDice: 2, weaponMasteries: 3 } },
      { level: 5, profBonus: 3, features: ['Cunning Strike', 'Uncanny Dodge'], classSpecific: { sneakAttackDice: 3, weaponMasteries: 3 } },
      { level: 6, profBonus: 3, features: ['Expertise'], classSpecific: { sneakAttackDice: 3, weaponMasteries: 3 } },
      { level: 7, profBonus: 3, features: ['Evasion', 'Reliable Talent'], classSpecific: { sneakAttackDice: 4, weaponMasteries: 3 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { sneakAttackDice: 4, weaponMasteries: 3 } },
      { level: 9, profBonus: 4, features: ['Subclass Feature'], classSpecific: { sneakAttackDice: 5, weaponMasteries: 3 } },
      { level: 10, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { sneakAttackDice: 5, weaponMasteries: 4 } },
      { level: 11, profBonus: 4, features: ['Improved Cunning Strike'], classSpecific: { sneakAttackDice: 6, weaponMasteries: 4 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { sneakAttackDice: 6, weaponMasteries: 4 } },
      { level: 13, profBonus: 5, features: ['Subclass Feature', 'Subtle Strikes'], classSpecific: { sneakAttackDice: 7, weaponMasteries: 4 } },
      { level: 14, profBonus: 5, features: ['Devious Strikes'], classSpecific: { sneakAttackDice: 7, weaponMasteries: 4 } },
      { level: 15, profBonus: 5, features: ['Slippery Mind'], classSpecific: { sneakAttackDice: 8, weaponMasteries: 4 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { sneakAttackDice: 8, weaponMasteries: 4 } },
      { level: 17, profBonus: 6, features: ['Subclass Feature'], classSpecific: { sneakAttackDice: 9, weaponMasteries: 4 } },
      { level: 18, profBonus: 6, features: ['Elusive'], classSpecific: { sneakAttackDice: 9, weaponMasteries: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { sneakAttackDice: 10, weaponMasteries: 4 } },
      { level: 20, profBonus: 6, features: ['Stroke of Luck'], classSpecific: { sneakAttackDice: 10, weaponMasteries: 4 } },
    ],

    features: [
      { index: 'rogue-expertise-1', name: 'Expertise', level: 1, description: ['You gain Expertise in two of your skill proficiencies of your choice. You gain this feature again at Rogue level 6.'], hasChoice: true },
      { index: 'rogue-sneak-attack', name: 'Sneak Attack', level: 1, description: [
        'You know how to turn a subtle attack into a deadly one. Once per turn, you can deal extra damage to one creature you hit with an attack roll if you\'re attacking with a Finesse or Ranged weapon and if at least one of the following requirements is met:',
        'Advantage. You have Advantage on the attack roll.',
        'Ally Adjacent to Target. At least one of your allies is within 5 feet of the target, the ally doesn\'t have the Incapacitated condition, and you don\'t have Disadvantage on the attack roll.',
        'The extra damage equals a number of d6s equal to half your Rogue level (round up), as shown in the Sneak Attack column of the Rogue Features table.',
      ] },
      { index: 'rogue-thieves-cant', name: "Thieves' Cant", level: 1, description: [
        'You picked up various languages in the criminal underworld. You know Thieves\' Cant and one other language of your choice.',
      ] },
      { index: 'rogue-weapon-mastery', name: 'Weapon Mastery', level: 1, description: [
        'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency.',
        'Whenever you finish a Long Rest, you can change the kinds of weapons you chose. When you reach certain Rogue levels, you gain the ability to use the mastery properties of more kinds of weapons.',
      ], hasChoice: true },
      { index: 'rogue-cunning-action', name: 'Cunning Action', level: 2, description: [
        'Your quick thinking and agility allow you to move and act quickly. On your turn, you can take one of the following actions as a Bonus Action: Dash, Disengage, or Hide.',
      ] },
      { index: 'rogue-subclass', name: 'Rogue Subclass', level: 3, description: ['You gain a Rogue subclass of your choice. A subclass is a specialization that grants you features at certain Rogue levels.'], hasChoice: true },
      { index: 'rogue-steady-aim', name: 'Steady Aim', level: 3, description: [
        'As a Bonus Action, you give yourself Advantage on your next attack roll on the current turn. You can use this feature only if you haven\'t moved during this turn, and after you use it, your Speed is 0 until the end of the current turn.',
      ] },
      { index: 'rogue-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16.'], hasChoice: true },
      { index: 'rogue-cunning-strike', name: 'Cunning Strike', level: 5, description: [
        'You have developed cunning ways to use your Sneak Attack. When you deal Sneak Attack damage, you can add one of the following Cunning Strike effects. Each effect has a die cost, which is the number of Sneak Attack damage dice you must forgo to add the effect. You remove the specified number of d6s from your Sneak Attack and apply the effect.',
        'Disarm (Cost: 1d6). The target must succeed on a Dexterity saving throw against your spell save DC, or it drops one item of your choice that it\'s holding.',
        'Poison (Cost: 1d6). You add a toxic substance to your strike. The target must succeed on a Constitution saving throw against your spell save DC, or it has the Poisoned condition for 1 minute. The Poisoned creature can repeat the save at the end of each of its turns, ending the effect on a success.',
        'Trip (Cost: 1d6). If the target is Large or smaller, it must succeed on a Dexterity saving throw against your spell save DC, or it has the Prone condition.',
        'Withdraw (Cost: 1d6). Immediately after dealing the damage, you move up to half your Speed without provoking Opportunity Attacks.',
      ] },
      { index: 'rogue-uncanny-dodge', name: 'Uncanny Dodge', level: 5, description: [
        'When an attacker that you can see hits you with an attack roll, you can use your Reaction to halve the attack\'s damage against you.',
      ] },
      { index: 'rogue-expertise-6', name: 'Expertise', level: 6, description: ['You gain Expertise in two of your skill proficiencies of your choice.'], hasChoice: true },
      { index: 'rogue-evasion', name: 'Evasion', level: 7, description: [
        'When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You can\'t use this feature if you have the Incapacitated condition.',
      ] },
      { index: 'rogue-reliable-talent', name: 'Reliable Talent', level: 7, description: [
        'Whenever you make an ability check that uses one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10.',
      ] },
      { index: 'rogue-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'rogue-subclass-feature-9', name: 'Subclass Feature', level: 9, description: [
        'You gain a feature from your Rogue subclass.',
        '',
        'Arcane Trickster — Magical Ambush: If you are hidden from a creature when you cast a spell on it, the creature has Disadvantage on any saving throw against the spell.',
        '',
        'Assassin — Infiltration Expertise: You can unerringly create false identities. You must spend seven days establishing the history, profession, and affiliations for a persona. After this, if you adopt the new identity as a disguise, other creatures believe you to be that person.',
        '',
        'Soulknife — Soul Blades: Your Psychic Blades are more powerful. Homing Strikes: if you miss with your blade, you can roll a Psionic Energy die and add it to the roll, potentially hitting. Psychic Teleportation: as a Bonus Action, roll a Psionic Energy die and teleport that many x 10 feet.',
        '',
        'Thief — Supreme Sneak: You have Advantage on Dexterity (Stealth) checks if you move no more than half your speed on the same turn.',
      ] },
      { index: 'rogue-asi-10', name: 'Ability Score Improvement', level: 10, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'rogue-improved-cunning-strike', name: 'Improved Cunning Strike', level: 11, description: [
        'You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each effect.',
      ] },
      { index: 'rogue-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'rogue-subclass-feature-13', name: 'Subclass Feature', level: 13, description: [
        'You gain a feature from your Rogue subclass.',
        '',
        'Arcane Trickster — Versatile Trickster: As a Bonus Action, you can designate a creature within 5 feet of your Mage Hand. You have Advantage on attack rolls against that creature until the end of the turn.',
        '',
        'Assassin — Impostor: You gain the ability to unerringly mimic another person\'s speech, writing, and behavior. You must spend at least three hours studying these aspects. Your ruse is indiscernible to the casual observer.',
        '',
        'Soulknife — Psychic Veil: As a Bonus Action, you become Invisible for 1 hour or until you deal damage or force a saving throw. Once per Long Rest, or by expending a Psionic Energy die.',
        '',
        'Thief — Use Magic Device: You can use any magic item, even if it requires attunement or a specific class, race, or level. You ignore all class, race, and level requirements on the use of magic items.',
      ] },
      { index: 'rogue-subtle-strikes', name: 'Subtle Strikes', level: 13, description: [
        'When you attack, you know how to exploit a target\'s distraction. You don\'t need Advantage on the attack roll to use your Sneak Attack against a target if the target is within 5 feet of at least one of your allies who doesn\'t have the Incapacitated condition and if you don\'t have Disadvantage on the attack roll. All the other rules for Sneak Attack still apply.',
      ] },
      { index: 'rogue-devious-strikes', name: 'Devious Strikes', level: 14, description: [
        'You have practiced new ways to use your Sneak Attack deviously. The following effects are now among your Cunning Strike options.',
        'Daze (Cost: 2d6). The target must succeed on a Constitution saving throw, or it has the Dazed condition until the end of its next turn.',
        'Knock Out (Cost: 6d6). The target must succeed on a Constitution saving throw, or it has the Unconscious condition for 1 minute. The condition ends early if the Unconscious creature takes any damage.',
        'Obscure (Cost: 3d6). The target must succeed on a Dexterity saving throw, or it has the Blinded condition until the end of its next turn.',
      ] },
      { index: 'rogue-slippery-mind', name: 'Slippery Mind', level: 15, description: [
        'Your cunning mind is exceptionally difficult to control. You gain proficiency in Wisdom and Charisma saving throws.',
      ] },
      { index: 'rogue-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'rogue-subclass-feature-17', name: 'Subclass Feature', level: 17, description: [
        'You gain a feature from your Rogue subclass.',
        '',
        'Arcane Trickster — Spell Thief: When a creature casts a spell targeting you or including you in its area, you can use your Reaction to force the creature to make a saving throw against your spell save DC. On a fail, the spell\'s effect is negated against you and you steal the spell, gaining the ability to cast it once within 8 hours. Once per Long Rest.',
        '',
        'Assassin — Death Strike: When you hit a surprised creature, it must make a Constitution saving throw (DC 8 + your Dexterity modifier + your proficiency bonus). On a failure, double the damage of the attack.',
        '',
        'Soulknife — Rend Mind: When you deal Sneak Attack damage with your Psychic Blades, you can force the target to make a Wisdom saving throw (DC 8 + proficiency bonus + Dexterity modifier). On a failure, the target is Stunned for 1 minute (save at end of each turn). Once per Long Rest, or by expending three Psionic Energy dice.',
        '',
        'Thief — Thief\'s Reflexes: You can take two turns during the first round of combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10.',
      ] },
      { index: 'rogue-elusive', name: 'Elusive', level: 18, description: [
        'You are so evasive that attackers rarely gain the upper hand against you. No attack roll can have Advantage against you unless you have the Incapacitated condition.',
      ] },
      { index: 'rogue-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'rogue-stroke-of-luck', name: 'Stroke of Luck', level: 20, description: [
        'You have an uncanny knack for succeeding when you need to. If you fail a D20 Test, you can turn the roll into a 20.',
        'Once you use this feature, you can\'t use it again until you finish a Short or Long Rest.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SORCERER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sorcerer: {
    index: 'sorcerer',
    name: 'Sorcerer',
    hitDie: 6,
    primaryAbility: 'Charisma',
    savingThrows: ['Constitution', 'Charisma'],
    armorTraining: [],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'] },
    startingEquipment: "Choose A or B: (A) Spear, 2 Daggers, Arcane Focus (Crystal), Explorer's Pack, and 28 GP; or (B) 50 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Innate Sorcery', 'Spellcasting'], classSpecific: { sorceryPoints: 0, metamagicOptions: 0 } },
      { level: 2, profBonus: 2, features: ['Font of Magic', 'Metamagic'], classSpecific: { sorceryPoints: 2, metamagicOptions: 2 } },
      { level: 3, profBonus: 2, features: ['Sorcerer Subclass'], classSpecific: { sorceryPoints: 3, metamagicOptions: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { sorceryPoints: 4, metamagicOptions: 2 } },
      { level: 5, profBonus: 3, features: ['Sorcerous Restoration'], classSpecific: { sorceryPoints: 5, metamagicOptions: 2 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { sorceryPoints: 6, metamagicOptions: 2 } },
      { level: 7, profBonus: 3, features: ['Sorcery Incarnate'], classSpecific: { sorceryPoints: 7, metamagicOptions: 2 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { sorceryPoints: 8, metamagicOptions: 2 } },
      { level: 9, profBonus: 4, features: [], classSpecific: { sorceryPoints: 9, metamagicOptions: 2 } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { sorceryPoints: 10, metamagicOptions: 3 } },
      { level: 11, profBonus: 4, features: [], classSpecific: { sorceryPoints: 11, metamagicOptions: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { sorceryPoints: 12, metamagicOptions: 3 } },
      { level: 13, profBonus: 5, features: [], classSpecific: { sorceryPoints: 13, metamagicOptions: 3 } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { sorceryPoints: 14, metamagicOptions: 3 } },
      { level: 15, profBonus: 5, features: [], classSpecific: { sorceryPoints: 15, metamagicOptions: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { sorceryPoints: 16, metamagicOptions: 3 } },
      { level: 17, profBonus: 6, features: [], classSpecific: { sorceryPoints: 17, metamagicOptions: 4 } },
      { level: 18, profBonus: 6, features: [], classSpecific: { sorceryPoints: 18, metamagicOptions: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { sorceryPoints: 19, metamagicOptions: 4 } },
      { level: 20, profBonus: 6, features: ['Arcane Apotheosis'], classSpecific: { sorceryPoints: 20, metamagicOptions: 4 } },
    ],

    features: [
      { index: 'sorcerer-innate-sorcery', name: 'Innate Sorcery', level: 1, description: [
        'An event in your past left an indelible mark on you, infusing you with simmering magic. As a Bonus Action, you can unleash that magic for 1 minute, during which you gain the following benefits:',
        'The spell save DC of your Sorcerer spells increases by 1.',
        'You have Advantage on the attack rolls of Sorcerer spells you cast.',
        'You can use this feature twice, and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'sorcerer-spellcasting', name: 'Spellcasting', level: 1, description: [
        'An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with Arcane Magic. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Sorcerer spells.',
        'Cantrips. You know four cantrips of your choice from the Sorcerer spell list. Whenever you gain a Sorcerer level, you can replace one of your cantrips with another cantrip of your choice from the Sorcerer spell list.',
        'Spell Slots. The Sorcerer Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Sorcerer spells.',
        'Whenever you gain a Sorcerer level, you can replace one spell on your list with another Sorcerer spell for which you have spell slots.',
        'Spellcasting Ability. Charisma is your spellcasting ability for your Sorcerer spells.',
        'Spellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Sorcerer spells.',
      ] },
      { index: 'sorcerer-font-of-magic', name: 'Font of Magic', level: 2, description: [
        'You can tap into the wellspring of magic within yourself. This wellspring is represented by Sorcery Points, which allow you to create a variety of magical effects.',
        'Sorcery Points. You have a number of Sorcery Points equal to your Sorcerer level, as shown in the Sorcery Points column of the Sorcerer Features table. You can\'t have more Sorcery Points than the number shown on the table for your level. You regain all expended Sorcery Points when you finish a Long Rest.',
        'Converting Spell Slots to Sorcery Points. You can use a Bonus Action to expend a spell slot and gain a number of Sorcery Points equal to the slot\'s level.',
        'Creating Spell Slots. As a Bonus Action, you can transform unexpended Sorcery Points into one spell slot. The Sorcery Point cost of each spell slot level is shown in the table: Level 1 = 2 points, Level 2 = 3 points, Level 3 = 5 points, Level 4 = 6 points, Level 5 = 7 points. The created slot vanishes at the end of a Long Rest.',
      ] },
      { index: 'sorcerer-metamagic', name: 'Metamagic', level: 2, description: [
        'Because your magic flows from within, you can alter your spells to suit your needs; you gain two Metamagic options of your choice from the Metamagic Options list. You use the chosen options to temporarily modify spells you cast. To use an option, you must spend the number of Sorcery Points that it costs.',
        'You can use only one Metamagic option on a spell when you cast it unless otherwise noted.',
        'You gain additional Metamagic options at certain Sorcerer levels, as shown in the Metamagic column of the Sorcerer Features table.',
        'Whenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you don\'t know.',
        'Careful Spell (1 point). When you cast a spell that forces other creatures to make a saving throw, you can protect some of those creatures. Choose a number of those creatures up to your Charisma modifier (minimum of one). A chosen creature automatically succeeds on its saving throw.',
        'Distant Spell (1 point). When you cast a spell that has a range of at least 5 feet, you can spend 1 Sorcery Point to double the range. When you cast a spell that has a range of Touch, you can spend 1 Sorcery Point to make the range 30 feet.',
        'Empowered Spell (1 point). When you roll damage for a spell, you can reroll a number of the damage dice up to your Charisma modifier (minimum of one). You must use the new rolls. You can use Empowered Spell even if you\'ve already used another Metamagic option during the casting of the spell.',
        'Extended Spell (1 point). When you cast a spell that has a duration of 1 minute or longer, you can double its duration to a maximum duration of 24 hours.',
        'Heightened Spell (2 points). When you cast a spell that forces a creature to make a saving throw, you can spend 2 Sorcery Points to give one target of the spell Disadvantage on its first saving throw against the spell.',
        'Quickened Spell (2 points). When you cast a spell that has a casting time of an action, you can spend 2 Sorcery Points to change the casting time to a Bonus Action for this casting. You can\'t modify a spell in this way if you\'ve already cast a level 1+ spell on the current turn.',
        'Seeking Spell (1 point). If you make an attack roll for a spell and miss, you can spend 1 Sorcery Point to reroll the d20, and you must use the new roll.',
        'Subtle Spell (1 point). When you cast a spell, you can spend 1 Sorcery Point to cast it without any Verbal, Somatic, or Material components, except Material components that are consumed by the spell or that have a cost specified in the spell.',
        'Transmuted Spell (1 point). When you cast a spell that deals a type of damage from the following list, you can spend 1 Sorcery Point to change that damage type to one of the other listed types: Acid, Cold, Fire, Lightning, Poison, Thunder.',
        'Twinned Spell (varies). When you cast a spell, such as Charm Person, that can be cast with a higher-level spell slot to target an additional creature, you can spend a number of Sorcery Points equal to the spell\'s level to increase the spell\'s effective level by 1.',
      ], hasChoice: true },
      { index: 'sorcerer-subclass', name: 'Sorcerer Subclass', level: 3, description: ['You gain a Sorcerer subclass of your choice. A subclass is a specialization that grants you features at certain Sorcerer levels.'], hasChoice: true },
      { index: 'sorcerer-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16.'], hasChoice: true },
      { index: 'sorcerer-sorcerous-restoration', name: 'Sorcerous Restoration', level: 5, description: [
        'When you finish a Short Rest, you can regain expended Sorcery Points, but no more than a number equal to half your Sorcerer level (round down). Once you use this feature, you can\'t do so again until you finish a Long Rest.',
      ] },
      { index: 'sorcerer-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Sorcerer subclass.',
        '',
        'Aberrant — Psionic Sorcery: When you cast a Sorcerer spell of 1st level or higher, you can expend Sorcery Points equal to the spell\'s level instead of a spell slot. When you do so, the spell requires no Verbal or Somatic components and no Material components unless they are consumed.',
        '',
        'Clockwork — Bastion of Law: You can spend Sorcery Points (1-5) to create a ward on a creature you touch. The ward has hit points equal to the Sorcery Points spent x 5. When the warded creature takes damage, the ward absorbs it first.',
        '',
        'Draconic — Elemental Affinity: When you cast a spell that deals damage of your draconic ancestry\'s type, add your Charisma modifier to one damage roll. You can also spend 1 Sorcery Point to gain Resistance to that damage type for 1 hour.',
        '',
        'Wild Magic — Bend Luck: When a creature you can see makes an attack roll, ability check, or saving throw, you can use your Reaction and spend 2 Sorcery Points to roll 1d4 and apply it as a bonus or penalty to the creature\'s roll.',
      ] },
      { index: 'sorcerer-sorcery-incarnate', name: 'Sorcery Incarnate', level: 7, description: [
        'If you have no uses of Innate Sorcery left, you can use it if you spend 2 Sorcery Points when you take the Bonus Action to activate it.',
        'In addition, while your Innate Sorcery feature is active, you can use up to two of your Metamagic options on each spell you cast.',
      ] },
      { index: 'sorcerer-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'sorcerer-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Sorcerer subclass.',
        '',
        'Aberrant — Revelation in Flesh: You can spend Sorcery Points (varies) to transform for 10 minutes, gaining benefits: see invisible creatures (1 SP), gain flying speed (2 SP), gain swimming speed + water breathing (1 SP), or become slimy and squeeze through 1-inch spaces (1 SP).',
        '',
        'Clockwork — Trance of Order: As a Bonus Action, you enter a trance for 1 minute. During it, attack rolls against you can\'t benefit from Advantage, and you treat a d20 roll of 9 or lower as a 10 for attack rolls, ability checks, and saving throws. Once per Long Rest.',
        '',
        'Draconic — Dragon Wings: As a Bonus Action, you sprout spectral dragon wings, gaining a flying speed equal to your walking speed. The wings last until you dismiss them or are Incapacitated.',
        '',
        'Wild Magic — Controlled Chaos: When you roll on the Wild Magic Surge table, you can roll twice and use either result.',
      ] },
      { index: 'sorcerer-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'sorcerer-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Sorcerer subclass.',
        '',
        'Aberrant — Warping Implosion: As an action, you teleport up to 120 feet. Each creature within 30 feet of the space you left must make a Strength save. On a failure, they take 3d10 force damage and are pulled to the space you left. On success, half damage and not pulled. Once per Long Rest, or spend 5 Sorcery Points.',
        '',
        'Clockwork — Clockwork Cavalcade: As an action, you summon spirits of order in a 30-foot cube. Each creature of your choice in the cube gains 100 temporary hit points. Also, damaged objects in the cube are repaired, and each spell of 6th level or lower in the area ends. Once per Long Rest, or spend 7 Sorcery Points.',
        '',
        'Draconic — Draconic Presence: As a Bonus Action, you can spend 5 Sorcery Points to exude a draconic aura in a 60-foot radius for 1 minute (Concentration). Each hostile creature that starts its turn in the aura must make a Wisdom save or be Charmed (if you choose awe) or Frightened (if you choose fear) until the aura ends.',
        '',
        'Wild Magic — Spell Bombardment: When you roll damage for a spell, if any damage dice show the highest number possible on that die, you can roll one additional die of the same type and add it to the damage. You can use this once per turn.',
      ] },
      { index: 'sorcerer-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'sorcerer-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'sorcerer-arcane-apotheosis', name: 'Arcane Apotheosis', level: 20, description: [
        'While your Innate Sorcery feature is active, you can use one Metamagic option on each of your turns without spending Sorcery Points on it.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WARLOCK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  warlock: {
    index: 'warlock',
    name: 'Warlock',
    hitDie: 8,
    primaryAbility: 'Charisma',
    savingThrows: ['Wisdom', 'Charisma'],
    armorTraining: ['Light armor'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'] },
    startingEquipment: "Choose A or B: (A) Leather Armor, Sickle, 2 Daggers, Arcane Focus (Orb), Book (Occult Lore), Scholar's Pack, and 15 GP; or (B) 100 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Eldritch Invocations', 'Pact Magic'], classSpecific: { invocationsKnown: 1, pactSlotLevel: 1, pactSlots: 1 } },
      { level: 2, profBonus: 2, features: ['Magical Cunning'], classSpecific: { invocationsKnown: 3, pactSlotLevel: 1, pactSlots: 2 } },
      { level: 3, profBonus: 2, features: ['Warlock Subclass'], classSpecific: { invocationsKnown: 3, pactSlotLevel: 2, pactSlots: 2 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { invocationsKnown: 3, pactSlotLevel: 2, pactSlots: 2 } },
      { level: 5, profBonus: 3, features: [], classSpecific: { invocationsKnown: 5, pactSlotLevel: 3, pactSlots: 2 } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { invocationsKnown: 5, pactSlotLevel: 3, pactSlots: 2 } },
      { level: 7, profBonus: 3, features: [], classSpecific: { invocationsKnown: 6, pactSlotLevel: 4, pactSlots: 2 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { invocationsKnown: 6, pactSlotLevel: 4, pactSlots: 2 } },
      { level: 9, profBonus: 4, features: ['Contact Patron'], classSpecific: { invocationsKnown: 7, pactSlotLevel: 5, pactSlots: 2 } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { invocationsKnown: 7, pactSlotLevel: 5, pactSlots: 2 } },
      { level: 11, profBonus: 4, features: ['Mystic Arcanum'], classSpecific: { invocationsKnown: 7, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { invocationsKnown: 7, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 13, profBonus: 5, features: ['Mystic Arcanum'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 15, profBonus: 5, features: ['Mystic Arcanum'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 3 } },
      { level: 17, profBonus: 6, features: ['Mystic Arcanum'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 4 } },
      { level: 18, profBonus: 6, features: [], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 4 } },
      { level: 19, profBonus: 6, features: ['Epic Boon'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 4 } },
      { level: 20, profBonus: 6, features: ['Eldritch Master'], classSpecific: { invocationsKnown: 9, pactSlotLevel: 5, pactSlots: 4 } },
    ],

    features: [
      { index: 'warlock-eldritch-invocations', name: 'Eldritch Invocations', level: 1, description: [
        'In your study of occult lore, you have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice, such as Eldritch Blast. Invocations are described in the "Eldritch Invocation Options" section.',
        'Prerequisites. If an invocation has a prerequisite, you must meet it to learn that invocation. You can learn the invocation at the same time that you meet its prerequisite. A level prerequisite refers to your Warlock level.',
        'Replacing and Gaining Invocations. Whenever you gain a Warlock level, you can replace one of your invocations with another one for which you qualify. The number of invocations you know increases at certain Warlock levels, as shown in the Invocations column of the Warlock Features table.',
      ], hasChoice: true },
      { index: 'warlock-pact-magic', name: 'Pact Magic', level: 1, description: [
        'Through occult ceremonies, you have formed a pact with a mysterious entity to gain magical powers. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Warlock spells.',
        'Cantrips. You know two cantrips of your choice from the Warlock spell list. Whenever you gain a Warlock level, you can replace one of your cantrips with another cantrip of your choice from the Warlock spell list.',
        'Spell Slots. The Warlock Features table shows how many spell slots you have to cast your Warlock spells of levels 1-5. The table also shows the level of those slots, all of which are the same level. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Warlock spells.',
        'Whenever you gain a Warlock level, you can replace one spell on your list with another Warlock spell of an eligible level.',
        'Spellcasting Ability. Charisma is your spellcasting ability for your Warlock spells.',
        'Spellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Warlock spells.',
      ] },
      { index: 'warlock-magical-cunning', name: 'Magical Cunning', level: 2, description: [
        'You can perform an esoteric rite for 1 minute. At the end of it, you regain expended Pact Magic spell slots but no more than a number equal to half your maximum (round up). Once you use this feature, you can\'t do so again until you finish a Long Rest.',
      ] },
      { index: 'warlock-subclass', name: 'Warlock Subclass', level: 3, description: ['You gain a Warlock subclass of your choice. A subclass is a specialization that grants you features at certain Warlock levels.'], hasChoice: true },
      { index: 'warlock-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16.'], hasChoice: true },
      { index: 'warlock-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Warlock subclass.',
        '',
        'Archfey — Misty Escape: When you take damage, you can use your Reaction to turn Invisible and teleport up to 60 feet. You remain Invisible until the start of your next turn or until you attack or cast a spell. Once per Short or Long Rest.',
        '',
        'Celestial — Radiant Soul: You gain Resistance to Radiant damage. When you cast a spell that deals Radiant or Fire damage, you can add your Charisma modifier to one damage roll of that spell.',
        '',
        'Fiend — Dark One\'s Own Luck: When you make an ability check or saving throw, you can add a d10 to the roll. You can do this after seeing the roll but before effects are applied. Once per Short or Long Rest.',
        '',
        'Great Old One — Entropic Ward: When a creature makes an attack roll against you, you can use your Reaction to impose Disadvantage. If the attack misses, your next attack roll against that creature has Advantage. Once per Short or Long Rest.',
      ] },
      { index: 'warlock-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'warlock-contact-patron', name: 'Contact Patron', level: 9, description: [
        'In the past, you usually contacted your patron through intermediaries. Now you can communicate directly; you always have the Contact Other Plane spell prepared. With this feature, you can cast the spell without expending a spell slot to contact your patron, and you automatically succeed on the spell\'s saving throw.',
        'Once you cast the spell with this feature, you can\'t do so again until you finish a Long Rest.',
      ] },
      { index: 'warlock-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Warlock subclass.',
        '',
        'Archfey — Beguiling Defenses: You are immune to being Charmed. When a creature attempts to Charm you, you can use your Reaction to attempt to turn the charm back on that creature (Wisdom save against your spell save DC).',
        '',
        'Celestial — Celestial Resilience: You gain temporary hit points equal to your Warlock level + your Charisma modifier whenever you finish a Short or Long Rest. Up to 5 creatures of your choice also gain temp HP equal to half your Warlock level + your Charisma modifier.',
        '',
        'Fiend — Fiendish Resilience: Choose one damage type when you finish a Short or Long Rest. You gain Resistance to that damage type until you choose a different one. Damage from magical weapons or silver weapons ignores this Resistance.',
        '',
        'Great Old One — Thought Shield: Your thoughts can\'t be read by telepathy or other means unless you allow it. You also gain Resistance to Psychic damage, and whenever a creature deals Psychic damage to you, that creature takes the same amount.',
      ] },
      { index: 'warlock-mystic-arcanum-11', name: 'Mystic Arcanum', level: 11, description: [
        'Your patron bestows upon you a magical secret called an arcanum. Choose one level 6 spell from the Warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot, and you must finish a Long Rest before you can do so again.',
        'You gain another Warlock spell of a higher level as an arcanum at Warlock levels 13 (level 7), 15 (level 8), and 17 (level 9). You follow the same rules for each: choose a spell, and you can cast it once for free per Long Rest.',
        'Whenever you gain a Warlock level, you can replace one of your arcanum spells with another eligible Warlock spell of the same level.',
      ], hasChoice: true },
      { index: 'warlock-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'warlock-mystic-arcanum-13', name: 'Mystic Arcanum', level: 13, description: ['You gain a level 7 Warlock spell as a Mystic Arcanum.'], hasChoice: true },
      { index: 'warlock-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Warlock subclass.',
        '',
        'Archfey — Dark Delirium: As an action, choose a creature within 60 feet. It must make a Wisdom saving throw or be Charmed or Frightened by you (your choice) for 1 minute. The creature believes it is lost in a misty realm. It can repeat the save at end of each turn. Once per Short or Long Rest.',
        '',
        'Celestial — Searing Vengeance: When you make a death saving throw at the start of your turn, you can instead spring back. You regain HP equal to half your HP max, then stand up. Each creature of your choice within 30 feet takes 2d8 + Charisma modifier Radiant damage and is Blinded until end of your next turn. Once per Long Rest.',
        '',
        'Fiend — Hurl Through Hell: When you hit a creature with an attack, you can banish it through the lower planes. It disappears and hurtles through a nightmare landscape. At the end of your next turn, it returns and takes 10d10 Psychic damage (if not a Fiend). Once per Long Rest.',
        '',
        'Great Old One — Create Thrall: You can use your action to touch an Incapacitated Humanoid. That creature is Charmed by you until a Remove Curse is cast on it or you use this feature again. You can communicate telepathically with the Charmed creature as long as you\'re on the same plane.',
      ] },
      { index: 'warlock-mystic-arcanum-15', name: 'Mystic Arcanum', level: 15, description: ['You gain a level 8 Warlock spell as a Mystic Arcanum.'], hasChoice: true },
      { index: 'warlock-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'warlock-mystic-arcanum-17', name: 'Mystic Arcanum', level: 17, description: ['You gain a level 9 Warlock spell as a Mystic Arcanum.'], hasChoice: true },
      { index: 'warlock-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'warlock-eldritch-master', name: 'Eldritch Master', level: 20, description: [
        'When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WIZARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  wizard: {
    index: 'wizard',
    name: 'Wizard',
    hitDie: 6,
    primaryAbility: 'Intelligence',
    savingThrows: ['Intelligence', 'Wisdom'],
    armorTraining: [],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'] },
    startingEquipment: "Choose A or B: (A) 2 Daggers, Arcane Focus (Quarterstaff), Robe, Spellbook, Scholar's Pack, and 5 GP; or (B) 55 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Arcane Recovery', 'Spellcasting'] },
      { level: 2, profBonus: 2, features: ['Scholar'] },
      { level: 3, profBonus: 2, features: ['Wizard Subclass'] },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'] },
      { level: 5, profBonus: 3, features: ['Memorize Spell'] },
      { level: 6, profBonus: 3, features: ['Subclass Feature'] },
      { level: 7, profBonus: 3, features: [] },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'] },
      { level: 9, profBonus: 4, features: [] },
      { level: 10, profBonus: 4, features: ['Subclass Feature'] },
      { level: 11, profBonus: 4, features: [] },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'] },
      { level: 13, profBonus: 5, features: [] },
      { level: 14, profBonus: 5, features: ['Subclass Feature'] },
      { level: 15, profBonus: 5, features: [] },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'] },
      { level: 17, profBonus: 6, features: [] },
      { level: 18, profBonus: 6, features: ['Spell Mastery'] },
      { level: 19, profBonus: 6, features: ['Epic Boon'] },
      { level: 20, profBonus: 6, features: ['Signature Spells'] },
    ],

    features: [
      { index: 'wizard-arcane-recovery', name: 'Arcane Recovery', level: 1, description: [
        'You can regain some of your magical energy by studying your spellbook. When you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to no more than half your Wizard level (round up), and none of the slots can be level 6 or higher.',
        'Once you use this feature, you can\'t do so again until you finish a Long Rest.',
      ] },
      { index: 'wizard-spellcasting', name: 'Spellcasting', level: 1, description: [
        'As a student of Arcane Magic, you have learned to cast spells. See the Player\'s Handbook for the rules on spellcasting. The information below details how you use those rules with Wizard spells.',
        'Cantrips. You know three cantrips of your choice from the Wizard spell list. Whenever you gain a Wizard level, you can replace one of your cantrips with another cantrip of your choice from the Wizard spell list.',
        'Spellbook. Your wizardly research and the magic bestowed on you at your initiation have given you a spellbook with six level 1 Wizard spells of your choice.',
        'Whenever you gain a Wizard level after 1, add two Wizard spells of your choice to your Spellbook. Each of these spells must be of a level for which you have spell slots.',
        'Spell Slots. The Wizard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.',
        'Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from your spellbook.',
        'Whenever you finish a Long Rest, you can change your list of prepared spells. Each spell must be in your spellbook.',
        'Spellcasting Ability. Intelligence is your spellcasting ability for your Wizard spells.',
        'Spellcasting Focus. You can use an Arcane Focus or your Spellbook as a Spellcasting Focus for your Wizard spells.',
      ] },
      { index: 'wizard-scholar', name: 'Scholar', level: 2, description: [
        'While studying magic, you also specialized in another field of study. Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have Expertise in the chosen skill.',
      ], hasChoice: true },
      { index: 'wizard-subclass', name: 'Wizard Subclass', level: 3, description: [
        'You gain a Wizard subclass of your choice. A subclass is a specialization that grants you features at certain Wizard levels.',
        '',
        'Abjuration — Abjuration Savant: The gold and time you spend to copy an Abjuration spell into your spellbook is halved. Arcane Ward: When you cast an Abjuration spell of 1st level or higher, you can simultaneously create a magical ward on yourself that lasts until you finish a Long Rest. The ward has hit points equal to twice your Wizard level + your Intelligence modifier. Whenever you take damage, the ward takes the damage instead. If the ward is reduced to 0 HP, you take any remaining damage. When you cast an Abjuration spell of 1st level or higher, the ward regains HP equal to twice the spell\'s level.',
        '',
        'Divination — Divination Savant: The gold and time you spend to copy a Divination spell into your spellbook is halved. Portent: When you finish a Long Rest, roll two d20s and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these rolls. You must choose to do so before the roll. Each roll can be used only once. When you finish a Long Rest, you lose any unused rolls.',
        '',
        'Evocation — Evocation Savant: The gold and time you spend to copy an Evocation spell into your spellbook is halved. Sculpt Spells: When you cast an Evocation spell that forces other creatures you can see to make a saving throw, you can choose a number of them equal to 1 + the spell\'s level. The chosen creatures automatically succeed on their saving throws and take no damage if they would normally take half damage on a success.',
        '',
        'Illusion — Illusion Savant: The gold and time you spend to copy an Illusion spell into your spellbook is halved. Improved Illusions: You learn the Minor Illusion cantrip. When you cast it, you can create both a sound and an image with a single casting. You can also cast the spell as a Bonus Action.',
      ], hasChoice: true },
      { index: 'wizard-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16.'], hasChoice: true },
      { index: 'wizard-memorize-spell', name: 'Memorize Spell', level: 5, description: [
        'Whenever you finish a Short Rest, you can choose one spell in your spellbook that you don\'t have prepared and add it to your list of prepared spells. It remains prepared until you prepare spells after your next Long Rest.',
      ] },
      { index: 'wizard-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Wizard subclass.',
        '',
        'Abjuration — Projected Ward: When a creature you can see within 30 feet of you takes damage, you can use your Reaction to cause your Arcane Ward to absorb that damage. If the ward\'s HP is reduced to 0, the warded creature takes any remaining damage.',
        '',
        'Divination — Expert Divination: When you cast a Divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The slot you regain must be of a lower level than the spell you cast and can\'t be higher than 5th level.',
        '',
        'Evocation — Potent Cantrip: When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip\'s damage (if any) but suffers no additional effect from the cantrip.',
        '',
        'Illusion — Phantasmal Creatures: When you cast an Illusion spell of 1st level or higher that requires Concentration, you no longer need to maintain Concentration on the spell if the spell creates a creature (such as Phantasmal Force). The spell lasts for its full duration, and you can concentrate on another spell.',
      ] },
      { index: 'wizard-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'wizard-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Wizard subclass.',
        '',
        'Abjuration — Spell Breaker: You always have Counterspell and Dispel Magic prepared. In addition, you can add your proficiency bonus to ability checks you make to end spells with Dispel Magic.',
        '',
        'Divination — The Third Eye: You can use a Bonus Action to increase your powers of perception. Choose one of the following benefits, which lasts until you are Incapacitated or until you finish a Short or Long Rest: Darkvision (120 feet), Ethereal Sight (see 60 feet into the Ethereal Plane), Greater Comprehension (you can read any language), or See Invisibility (you can see invisible creatures and objects within 10 feet).',
        '',
        'Evocation — Empowered Evocation: You can add your Intelligence modifier to one damage roll of any Wizard Evocation spell you cast.',
        '',
        'Illusion — Illusory Self: When a creature makes an attack roll against you, you can use your Reaction to interpose an illusory duplicate between the attacker and yourself. The attack automatically misses you, then the illusion dissipates. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a Long Rest.',
      ] },
      { index: 'wizard-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'wizard-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Wizard subclass.',
        '',
        'Abjuration — Spell Resistance: You have Advantage on saving throws against spells. Furthermore, you have Resistance to the damage of spells.',
        '',
        'Divination — Greater Portent: Your Portent dice increase from two to three. You roll three d20s at the end of each Long Rest for your Portent feature.',
        '',
        'Evocation — Overchannel: When you cast a Wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you use this feature after a Long Rest, you take no penalty. Each subsequent time before a Long Rest, you take 2d12 Necrotic damage per spell level immediately after casting. This damage ignores Resistance and Immunity.',
        '',
        'Illusion — Illusory Reality: When you cast an Illusion spell of 1st level or higher, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. The object remains real for 1 minute, during which it can\'t deal damage or directly harm anyone.',
      ] },
      { index: 'wizard-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'wizard-spell-mastery', name: 'Spell Mastery', level: 18, description: [
        'You have achieved such mastery over certain spells that you can cast them at will. Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an action. You always have those spells prepared, and you can cast them at their lowest level without expending a spell slot. To cast either spell at a higher level, you must expend a spell slot.',
        'Whenever you finish a Long Rest, you can change which spells benefit from this feature.',
      ], hasChoice: true },
      { index: 'wizard-epic-boon', name: 'Epic Boon', level: 19, description: ['You gain an Epic Boon feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'wizard-signature-spells', name: 'Signature Spells', level: 20, description: [
        'You always have two level 3 spells prepared that are your signature spells. Choose two level 3 Wizard spells in your spellbook as your signature spells. You can cast each of them once at level 3 without expending a spell slot. When you do so, you can\'t cast that spell in this way again until you finish a Short or Long Rest.',
        'Whenever you finish a Long Rest, you can change your signature spells.',
      ], hasChoice: true },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BARRIOMANCER (Homebrew)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  barriomancer: {
    index: 'barriomancer',
    name: 'Barriomancer',
    hitDie: 10,
    primaryAbility: 'Charisma',
    savingThrows: ['Charisma', 'Intelligence'],
    armorTraining: ['Light armor', 'Medium armor', 'Heavy armor', 'Shields'],
    weaponProficiencies: ['Simple weapons'],
    toolProficiencies: [],
    skillChoices: { choose: 3, from: ['Acrobatics', 'Arcana', 'Athletics', 'Insight', 'Investigation', 'Medicine', 'Perception', 'Sleight of Hand'] },
    startingEquipment: "Simple Weapon and Shield or two Simple Weapons, Leather or Hide or Chain Mail, Dungeoneer's Pack or Explorer's Pack",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Barrier', 'Guard Link'], classSpecific: { barrierDiceMax: 1, barrierDieSize: 'd8' } },
      { level: 2, profBonus: 2, features: ['Spellcasting'], classSpecific: { barrierDiceMax: 2, barrierDieSize: 'd8' } },
      { level: 3, profBonus: 2, features: ['Barrier Force'], classSpecific: { barrierDiceMax: 3, barrierDieSize: 'd8' } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { barrierDiceMax: 4, barrierDieSize: 'd8' } },
      { level: 5, profBonus: 3, features: [], classSpecific: { barrierDiceMax: 5, barrierDieSize: 'd8' } },
      { level: 6, profBonus: 3, features: ['Subclass Feature'], classSpecific: { barrierDiceMax: 6, barrierDieSize: 'd8' } },
      { level: 7, profBonus: 3, features: [], classSpecific: { barrierDiceMax: 7, barrierDieSize: 'd10' } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { barrierDiceMax: 8, barrierDieSize: 'd10' } },
      { level: 9, profBonus: 4, features: [], classSpecific: { barrierDiceMax: 9, barrierDieSize: 'd10' } },
      { level: 10, profBonus: 4, features: ['Subclass Feature'], classSpecific: { barrierDiceMax: 10, barrierDieSize: 'd10' } },
      { level: 11, profBonus: 4, features: ['Soul Link'], classSpecific: { barrierDiceMax: 11, barrierDieSize: 'd10' } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { barrierDiceMax: 12, barrierDieSize: 'd10' } },
      { level: 13, profBonus: 5, features: [], classSpecific: { barrierDiceMax: 13, barrierDieSize: 'd10' } },
      { level: 14, profBonus: 5, features: ['Subclass Feature'], classSpecific: { barrierDiceMax: 14, barrierDieSize: 'd10' } },
      { level: 15, profBonus: 5, features: ['Stalwart'], classSpecific: { barrierDiceMax: 15, barrierDieSize: 'd10' } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { barrierDiceMax: 16, barrierDieSize: 'd10' } },
      { level: 17, profBonus: 6, features: [], classSpecific: { barrierDiceMax: 17, barrierDieSize: 'd10' } },
      { level: 18, profBonus: 6, features: [], classSpecific: { barrierDiceMax: 18, barrierDieSize: 'd12' } },
      { level: 19, profBonus: 6, features: ['Ability Score Improvement'], classSpecific: { barrierDiceMax: 19, barrierDieSize: 'd12' } },
      { level: 20, profBonus: 6, features: ['Eternal Barrier', 'Subclass Feature'], classSpecific: { barrierDiceMax: 20, barrierDieSize: 'd12' } },
    ],

    features: [
      { index: 'bm-barrier', name: 'Barrier', level: 1, description: [
        'You gain Barrier Dice equal to twice your Barriomancer level + your Charisma modifier (minimum 1). Your Barrier Die is a d8, increasing to d10 at level 7 and d12 at level 18.',
        'You know three base barriers:',
        'Guard\'s Pavise: As an action, grant a creature within 20 feet temporary HP equal to twice the Barrier Die rolled.',
        'Vanguard\'s Buckler: As an action, grant a creature within 20 feet temporary HP equal to the Barrier Die + a movement speed bonus (5x dice value in feet).',
        'Berserker\'s Ward: As an action, grant a creature within 20 feet temporary HP equal to the Barrier Die + a weapon damage bonus (equals dice value).',
        'Temporary HP from barriers last until depleted, you fall unconscious, or you finish a long rest. You regain half your Charisma modifier (rounded up, minimum 1) Barrier Dice per short rest, and all on a long rest. At level 11+, you regain your full Charisma modifier per short rest.',
      ] },
      { index: 'bm-guard-link', name: 'Guard Link', level: 1, description: [
        'Select one creature per long rest as your Ward. Barriers affecting your Ward work at double range (40 feet instead of 20). When applying barriers to your Ward, you also gain matching temporary HP.',
        'At level 11+, you gain the full barrier effects (not just temp HP) when applying barriers to your Ward.',
      ] },
      { index: 'bm-spellcasting', name: 'Spellcasting', level: 2, description: [
        'You can cast Barriomancer spells using Charisma as your spellcasting ability. You prepare spells equal to your Charisma modifier + half your Barriomancer level (rounded down, minimum 1).',
        'Spell Save DC = 8 + proficiency bonus + Charisma modifier.',
        'Spell Attack = proficiency bonus + Charisma modifier.',
      ] },
      { index: 'bm-barrier-force', name: 'Barrier Force', level: 3, description: [
        'You choose a Barrier Force subclass that defines how your barriers manifest. Choose from Guardian Force, Elemental Force, Blood Force, or Soul Force.',
        'Your Barrier Force grants features at levels 3, 6, 10, 14, and 20.',
      ], hasChoice: true },
      { index: 'bm-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bm-subclass-feature-6', name: 'Subclass Feature', level: 6, description: [
        'You gain a feature from your Barrier Force.',
        '',
        'Guardian — Unerring Guardian: As a reaction, grant a Guardian barrier to a creature without temporary HP within 20 feet (40 for Ward), using up to half your normal Barrier Dice maximum. At level 20, you can use your full maximum.',
        '',
        'Elemental — Flow of Energy: When you and a creature within 20 feet are both under the effects of one of your Elementalist Barriers, you can use your bonus action to swap the effects of your barriers, keeping temporary HP values unchanged.',
        '',
        'Blood — Blood Link: Mark your Ward within 5 feet with blood. Track them within 300 feet, sense direction and alive status beyond 300 feet. Mark is hidden on skin and wipeable by action.',
        '',
        'Soul — Spirit Channeling: When you give a creature the effects of a Spiritualist Barrier, you can set them as a Spirit Nexus. The Nexus adds 1d6 to rolls related to the spirit of the barrier. Uses equal to half Charisma modifier per long rest (full at level 20).',
      ] },
      { index: 'bm-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bm-subclass-feature-10', name: 'Subclass Feature', level: 10, description: [
        'You gain a feature from your Barrier Force.',
        '',
        'Guardian — Guardian\'s Armory: You learn three additional barriers: Fortress Wall (3x Die temp HP + AC bonus, 30 ft range), Magus\' Ward (2x Die temp HP + spell save bonus at 2x dice value, 30 ft range), and Steel Shell (4x Die temp HP).',
        '',
        'Elemental — Elementalist\'s Armory: You learn two additional barriers: Robe of Radiance (enhanced movement in bright light, radiant damage to fiends/undead) and Mantle of Shadow (enhanced movement in darkness, necrotic damage to celestials/humanoids).',
        '',
        'Blood — Sanguine Armory: You learn two additional barriers: Healing Field (1x Die temp HP + healing equal to half temp HP) and Vampire\'s Vest (1x Die temp HP + regain temp HP equal to half damage dealt).',
        '',
        'Soul — Spiritualist\'s Armory: You learn two additional barriers: Wolf\'s Tactics (1x Die temp HP + Strength save bonus, advantage on melee if ally within 5 ft) and Raven\'s Tactics (1x Die temp HP + Intelligence check/save bonus, advantage on ranged if ally within 5 ft).',
      ] },
      { index: 'bm-soul-link', name: 'Soul Link', level: 11, description: [
        'You can perform a 1-hour ritual with a willing creature to create a Soul Link. While Soul Linked and within 30 feet of each other, you are both immune to effects that would exile you to another plane or kill you instantly.',
        'Within 60 feet of your Soul Linked partner, you both add the higher of your partner\'s Charisma or Wisdom modifier to saving throws. Your Soul Linked creature is always treated as your Ward. Only one active Soul Link at a time.',
      ] },
      { index: 'bm-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bm-subclass-feature-14', name: 'Subclass Feature', level: 14, description: [
        'You gain a feature from your Barrier Force.',
        '',
        'Guardian — Guardian Step: When your Ward takes damage, you can teleport within 5 feet of them and redirect the attack to yourself. If the attack would miss you, take half damage. For saving throws, make the roll with advantage and auto-succeed your Ward\'s save. At level 20: immunity to missed attacks, guaranteed Ward save success.',
        '',
        'Elemental — Elemental Burst: A creature can use their action to explode their barrier, forcing all creatures in a 30-foot radius to make a DEX save (your spell save DC). Damage equals current temporary HP. Barrier ends; can\'t repeat until long rest. At level 20: damage doubles, half on success.',
        '',
        'Blood — Bleeding Heart: As a reaction when an ally within 10 feet takes damage, grant them a free Sanguine barrier using 2 Barrier Dice (3 at level 20). Two uses per long rest.',
        '',
        'Soul — Hand of the Dead: When a Spiritualist barrier hit connects, force a Constitution save (spell save DC). On failure, the target is restrained. Target remakes save at start of each turn.',
      ] },
      { index: 'bm-stalwart', name: 'Stalwart', level: 15, description: [
        'You gain proficiency in all saving throws.',
      ] },
      { index: 'bm-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bm-asi-19', name: 'Ability Score Improvement', level: 19, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'bm-eternal-barrier', name: 'Eternal Barrier', level: 20, description: [
        'Your barriers reach their ultimate form. Temporary HP from your barriers last indefinitely — they cannot be dispelled and have no time limit. You can also use any barrier you know at will as though spending 2 Barrier Dice.',
      ] },
      { index: 'bm-subclass-feature-20', name: 'Subclass Feature', level: 20, description: [
        'You gain a capstone feature from your Barrier Force.',
        '',
        'Guardian — Absolute Guardian: When a creature within 60 feet (or your Ward within 120 feet) would be reduced to 0 HP or killed outright, you can use your reaction to prevent the damage or effect. Once per long rest. You also learn three final barriers: Dreadnought Wall, Archmage\'s Ward, and Adamantine Shell.',
        '',
        'Elemental — Unleash Elements: Once per long rest, grant two Elementalist Barrier effects to the same creature (single temp HP pool, both effects active). You also learn six final enhanced elemental barriers.',
        '',
        'Blood — Leeching Barriers: Creatures under your Sanguine barriers regain HP equal to half damage dealt with attacks (minimum 1). You also learn two final barriers: Restorative Field and Master Vampire\'s Vest.',
        '',
        'Soul — Refuse the Call: When a creature within 20 feet (or Ward within 40 feet) would die, use your reaction to prevent that death. If from failed death saves, last failure is ignored. If from damage, negate the damage instance. Once per long rest. You also learn Snake\'s Agility and Fox\'s Cunning barriers.',
      ] },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DRAGON-RIDER (Homebrew)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'dragon-rider': {
    index: 'dragon-rider',
    name: 'Dragon-Rider',
    hitDie: 10,
    primaryAbility: 'Strength or Dexterity',
    savingThrows: ['Strength', 'Wisdom'],
    armorTraining: ['Light armor', 'Medium armor', 'Shields'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    toolProficiencies: ["Choose one from Cartographer's Tools, Herbalism Kit, or Navigator's Tools"],
    skillChoices: { choose: 3, from: ['Animal Handling', 'Athletics', 'Insight', 'Nature', 'Perception', 'Stealth', 'Survival'] },
    startingEquipment: "Choose A or B: (A) Scale Mail or Leather Armor, Martial Weapon and Shield or two Martial Weapons, Longbow with 20 arrows or 2 Handaxes, Explorer's Pack and Riding Harness; or (B) 100 GP",

    levelTable: [
      { level: 1, profBonus: 2, features: ['Draconic Bond', 'Bonded Companion', 'Fighting Style', 'Signature Weapon'], classSpecific: { wingStepUses: 0, syncUses: 0 } },
      { level: 2, profBonus: 2, features: ['Wing Step', "Hunter's Insight"], classSpecific: { wingStepUses: 2, syncUses: 0 } },
      { level: 3, profBonus: 2, features: ['Rider Path', 'Combat Drake'], classSpecific: { wingStepUses: 2, syncUses: 0 } },
      { level: 4, profBonus: 2, features: ['Ability Score Improvement'], classSpecific: { wingStepUses: 2, syncUses: 0 } },
      { level: 5, profBonus: 3, features: ['Extra Attack', 'Dragonstrike', "Patron's Gift (1st)", 'Signature Awakens'], classSpecific: { wingStepUses: 3, syncUses: 0 } },
      { level: 6, profBonus: 3, features: ['Draconic Speech', 'Path Feature'], classSpecific: { wingStepUses: 3, syncUses: 0 } },
      { level: 7, profBonus: 3, features: ['Draconic Sync'], classSpecific: { wingStepUses: 3, syncUses: 1 } },
      { level: 8, profBonus: 3, features: ['Ability Score Improvement'], classSpecific: { wingStepUses: 3, syncUses: 1 } },
      { level: 9, profBonus: 4, features: ['Aerial Assault', 'Path Feature'], classSpecific: { wingStepUses: 4, syncUses: 1 } },
      { level: 10, profBonus: 4, features: ['Wing Shield', 'Indomitable Bond', "Patron's Gift (2nd)"], classSpecific: { wingStepUses: 4, syncUses: 2 } },
      { level: 11, profBonus: 4, features: ["Drake's Breath", 'Signature Deepens'], classSpecific: { wingStepUses: 4, syncUses: 2 } },
      { level: 12, profBonus: 4, features: ['Ability Score Improvement'], classSpecific: { wingStepUses: 4, syncUses: 2 } },
      { level: 13, profBonus: 5, features: ['Ascendant Synergy', 'Path Feature'], classSpecific: { wingStepUses: 4, syncUses: 2 } },
      { level: 14, profBonus: 5, features: ['Skyborn Reflexes'], classSpecific: { wingStepUses: 5, syncUses: 2 } },
      { level: 15, profBonus: 5, features: ['Draconic Soulstrike', 'Shared Resistance', "Patron's Gift (3rd)"], classSpecific: { wingStepUses: 5, syncUses: 3 } },
      { level: 16, profBonus: 5, features: ['Ability Score Improvement'], classSpecific: { wingStepUses: 5, syncUses: 3 } },
      { level: 17, profBonus: 6, features: ['Path Feature', 'Class Scaling at 17', 'Signature Ascends'], classSpecific: { wingStepUses: 5, syncUses: 3 } },
      { level: 18, profBonus: 6, features: ['Apex Bond'], classSpecific: { wingStepUses: 5, syncUses: 3 } },
      { level: 19, profBonus: 6, features: ['Ability Score Improvement'], classSpecific: { wingStepUses: 5, syncUses: 3 } },
      { level: 20, profBonus: 6, features: ['Draconic Ascendance', "Patron's Gift (4th — Capstone)"], classSpecific: { wingStepUses: 5, syncUses: -1 } }, // -1 = unlimited
    ],

    features: [
      { index: 'dr-draconic-bond', name: 'Draconic Bond', level: 1, description: [
        'You are bonded to a dragon companion — a wyrmling whose life is intertwined with yours. Your dragon\'s full statistics are described in the Dragon Companion section. Both of you grow more powerful as you level.',
        'At character creation, choose your dragon\'s elemental affinity: Fire, Cold, Lightning, Acid, Poison, Thunder, Radiant, or Necrotic. This choice shapes their breath weapon, resistances, and the elemental damage of many of your features.',
        'You also decide your dragon\'s name, alignment, personality, and physical description.',
      ], hasChoice: true },
      { index: 'dr-bonded-companion', name: 'Bonded Companion', level: 1, description: [
        'Your dragon shares your initiative count and acts on your turn. They obey your verbal commands, but if you give no command, they act on instinct — usually defending you, attacking what you attack, or pursuing whatever interests them.',
        'Your dragon uses your proficiency bonus for AC, attack rolls, damage rolls, and all saving throws. If your dragon is reduced to 0 hit points, they fall unconscious rather than dying. They become stable after one hour, or you can spend one Hit Die as an action while in contact to stabilize them.',
        'Your dragon must remain within 100 feet of you. If separated by more than this for more than 1 minute, they become Confused until reunited.',
      ] },
      { index: 'dr-fighting-style', name: 'Fighting Style', level: 1, description: [
        'You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Mounted Combatant, or Two-Weapon Fighting.',
      ], hasChoice: true },
      { index: 'dr-signature-weapon', name: 'Signature Weapon', level: 1, description: [
        'You choose any weapon from the standard equipment list as your Signature. This weapon is mundane at first, but it will awaken as you grow into your power.',
        'Until 5th level, this weapon functions as a regular masterwork weapon — well-made, but not magical. It cannot be permanently broken or destroyed by mundane means.',
        'If you ever lose your Signature Weapon, you can recall it to your hand at the end of your next long rest.',
        'At 5th, 11th, and 17th level, your Signature Weapon awakens further with custom properties designed by you and your DM.',
      ], hasChoice: true },
      { index: 'dr-wing-step', name: 'Wing Step', level: 2, description: [
        'Your dragon\'s instincts sharpen your own footwork. As a bonus action, you can move up to 15 feet without provoking opportunity attacks. This movement does not count against your normal movement for the turn.',
        'You can use this feature a number of times equal to the value shown in the Wing Step Uses column of the Dragon-Rider table. You regain all expended uses on a long rest.',
      ] },
      { index: 'dr-hunters-insight', name: "Hunter's Insight", level: 2, description: [
        'As a bonus action, mark a creature you can see within 90 feet as your quarry for 1 minute or until you mark another creature. While a creature is your quarry:',
        '• You and your dragon deal an extra 1d4 damage to it on a successful weapon attack.',
        '• You have advantage on Wisdom (Survival) checks to track it and Wisdom (Perception) checks to find it.',
        'You can use this feature a number of times equal to your proficiency bonus, regaining all expended uses on a long rest. The bonus damage increases to 1d6 at 11th level and 1d8 at 17th level.',
      ] },
      { index: 'dr-rider-path', name: 'Rider Path', level: 3, description: [
        'You commit to a path that defines how you and your dragon fight together. Choose one of the three paths: Path of the Skylance, Path of the Wyrmbond, or Path of the Stormcaller. Your path grants features at 3rd, 6th, 9th, 13th, and 17th level.',
        '',
        'Skylance — Lance Mastery: You gain proficiency with heavy armor. While wielding a lance, pike, halberd, or glaive, you can use it one-handed while mounted (overriding the weapon\'s normal property). You also no longer have disadvantage on melee attacks against creatures within 5 feet of you while wielding a lance.',
        '',
        'Wyrmbond — Soulweave: Your bond runs deeper than most riders\'. You can use Draconic Sync once per short rest in addition to its normal long-rest uses. Your dragon can move up to 200 feet from you (instead of 100) before becoming Confused. Your dragon\'s bite damage increases by one die size while you are merged.',
        '',
        'Stormcaller — Skybound Shot: You gain proficiency with longbows and shortbows if you didn\'t already have it. While mounted on your dragon, you do not have disadvantage on ranged weapon attacks against creatures more than 30 feet away. In addition, your normal range with bows and crossbows is doubled (long range is unchanged).',
      ], hasChoice: true },
      { index: 'dr-combat-drake', name: 'Combat Drake', level: 3, description: [
        'Your dragon has grown enough to bear you in battle. You can ride your dragon in combat, including in flight. While mounted on your dragon, you can use your reaction to swap a successful hit against you to your dragon, or vice versa, once per round.',
        'Your dragon can also carry one additional Medium or smaller creature outside of combat.',
      ] },
      { index: 'dr-asi-4', name: 'Ability Score Improvement', level: 4, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'dr-extra-attack', name: 'Extra Attack', level: 5, description: ['You can attack twice, instead of once, whenever you take the Attack action on your turn.'] },
      { index: 'dr-dragonstrike', name: 'Dragonstrike', level: 5, description: [
        'When you take the Attack action, you can replace one of your attacks with a Dragonstrike — channeling your dragon\'s element through your weapon.',
        '• Make a weapon attack as normal. On a hit, the target takes an extra 1d8 damage of your dragon\'s elemental type.',
        '• On a hit, the target must succeed on a Strength saving throw (DC 8 + your proficiency bonus + your Strength or Dexterity modifier, whichever is higher) or be knocked prone.',
        'You can use this feature a number of times equal to your proficiency bonus, regaining all expended uses on a long rest. The extra damage increases to 2d8 at 11th level and 3d8 at 17th level.',
      ] },
      { index: 'dr-patrons-gift-1', name: "Patron's Gift (1st)", level: 5, description: [
        'By 5th level, cosmic forces, gods, ancestral spirits, or other powers have taken notice of you. You receive your first Patron\'s Gift — a unique ability designed by you and your DM that reflects your character\'s specific story, bond, or destiny.',
        'You will receive additional Patron\'s Gifts at levels 10, 15, and 20.',
      ], hasChoice: true },
      { index: 'dr-signature-awakens', name: 'Signature Awakens', level: 5, description: [
        'Your Signature Weapon awakens for the first time. Choose its 1st-tier property, designed by you and your DM. The awakened weapon counts as a magical weapon (Uncommon rarity) for the purposes of overcoming resistance and immunity.',
      ], hasChoice: true },
      { index: 'dr-draconic-speech', name: 'Draconic Speech', level: 6, description: [
        'You can speak, read, and write Draconic. Your dragon can now speak any language you speak.',
        'In addition, you have advantage on Charisma (Persuasion) checks made against dragons and dragonkin who can understand you.',
      ] },
      { index: 'dr-path-feature-6', name: 'Path Feature', level: 6, description: [
        'You gain a feature from your Rider Path.',
        '',
        'Skylance — Charging Strike: When you and your dragon move at least 20 feet in a straight line on your turn, your next melee weapon attack on that turn deals an extra weapon die of damage. If the attack hits, the target must succeed on a Strength save (DC 8 + PB + Str) or be knocked prone. This stacks with Aerial Assault when available.',
        '',
        'Wyrmbond — Echoed Form: While merged via Draconic Sync, you take on partial draconic features. Choose one to manifest each time you merge: Wings (flying speed equals your dragon\'s full flying speed), Scales (gain temp HP equal to your Dragon-Rider level + Wisdom modifier), or Claws (your weapon attacks deal an extra 1d6 of your dragon\'s elemental damage).',
        '',
        'Stormcaller — Elemental Quiver: As a bonus action, imbue your ammunition with your dragon\'s element for 1 minute. Your ranged attacks deal an extra 1d6 of your dragon\'s elemental damage. On a critical hit, the imbued ammunition explodes — each creature within 5 feet of the target makes a DEX save (DC 8 + PB + Wis) or takes 2d6 of the same type. Uses equal to your proficiency bonus per long rest.',
      ] },
      { index: 'dr-draconic-sync', name: 'Draconic Sync', level: 7, description: [
        'As a bonus action, you and your dragon merge into a single synchronized form until the end of your next turn. While merged:',
        '• Your speed increases by 10 feet, and you can take the Dash action as a bonus action.',
        '• You gain a flying speed equal to half your dragon\'s flying speed.',
        '• You can use your dragon\'s natural weapons (bite, claws) as melee attacks, using your proficiency bonus and your Strength or Dexterity modifier.',
        '• You gain Breath Echo: once during the merge, as an action, you can exhale a 15-foot cone of your dragon\'s elemental damage. Each creature in the cone makes a Dexterity save (DC 8 + PB + Wis mod) for half damage. Damage is 2d6, increasing as shown in the Breath Echo table.',
        'You can use Draconic Sync a number of times per long rest as shown in the Sync Uses column of the Dragon-Rider table.',
      ] },
      { index: 'dr-asi-8', name: 'Ability Score Improvement', level: 8, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'dr-aerial-assault', name: 'Aerial Assault', level: 9, description: [
        'When you are mounted on your dragon and move at least 20 feet in a straight line toward a target, your first successful weapon attack against that target on the same turn deals an extra 2d8 damage of your dragon\'s elemental type. The target must also succeed on a Strength saving throw (DC 8 + PB + Str/Dex) or be pushed up to 10 feet.',
        'Aerial Assault can only be used once per turn.',
      ] },
      { index: 'dr-path-feature-9', name: 'Path Feature', level: 9, description: [
        'You gain a feature from your Rider Path.',
        '',
        'Skylance — Skyfall Dive: As an action while mounted on your dragon in flight, you can dive at a target up to 60 feet below you. Make one melee weapon attack with advantage. On a hit, the target takes an extra 4d8 damage of your dragon\'s elemental type and is knocked prone. Your dragon ends the dive in any unoccupied space within 10 feet of the target. Uses equal to your proficiency bonus per long rest.',
        '',
        'Wyrmbond — Resonant Strike: While merged, when you hit a creature with a weapon attack, you can choose to make the attack also count as your dragon\'s bite for the purpose of triggering features (such as Guardian Instinct or Elemental Pulse). On a hit, the target takes an extra 2d6 damage of your dragon\'s elemental type. Once per merge, after you hit with this strike, your dragon can immediately make a free bite attack against the same target as part of the same action.',
        '',
        'Stormcaller — Coordinated Volley: When your dragon uses their breath weapon, you can use your reaction to make one ranged weapon attack against a creature in the breath area. If the attack hits, the target automatically fails the breath weapon\'s saving throw (no advantage to the dragon\'s damage, just guaranteed failure for that one creature).',
      ] },
      { index: 'dr-wing-shield', name: 'Wing Shield', level: 10, description: [
        'Once per short or long rest, when you or a creature within 5 feet of your dragon takes damage, your dragon can use their reaction to interpose their wing — halving the damage of one attack.',
      ] },
      { index: 'dr-indomitable-bond', name: 'Indomitable Bond', level: 10, description: [
        'Your bond with your dragon strengthens you both. When either you or your dragon would be Charmed or Frightened, you can choose to pass the effect to the other instead. The recipient must succeed on the original save or be affected.',
        'You can use this feature a number of times equal to your proficiency bonus per long rest.',
      ] },
      { index: 'dr-patrons-gift-2', name: "Patron's Gift (2nd)", level: 10, description: [
        'Your patron grants you a second gift. The 2nd gift is anchored to higher-tier class features and should feel correspondingly stronger than your 1st.',
      ], hasChoice: true },
      { index: 'dr-drakes-breath', name: "Drake's Breath", level: 11, description: [
        'Your dragon shares the full force of their breath with you. As an action, you can exhale a 30-foot cone of your dragon\'s elemental damage. Each creature in the cone must make a Dexterity saving throw (DC 8 + PB + your Wisdom modifier), taking 5d6 damage on a failed save, or half as much on a success.',
        'You can use this feature once per short or long rest. The damage increases to 6d6 at 17th level.',
      ] },
      { index: 'dr-signature-deepens', name: 'Signature Deepens', level: 11, description: [
        'Your Signature Weapon deepens its bond. Choose its 2nd-tier property. The weapon now counts as Rare rarity for the purposes of overcoming resistance and immunity.',
      ], hasChoice: true },
      { index: 'dr-asi-12', name: 'Ability Score Improvement', level: 12, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'dr-ascendant-synergy', name: 'Ascendant Synergy', level: 13, description: [
        'Your Draconic Sync deepens. While merged, you gain the following benefits:',
        '• The merge now lasts until the end of your second turn (instead of your next turn).',
        '• You have advantage on initiative rolls if you begin combat already merged.',
        '• All of your weapon attacks deal an extra 1d8 of your dragon\'s elemental damage.',
        '• Breath Echo can be used twice during the merge instead of once, and its damage becomes 3d6.',
      ] },
      { index: 'dr-path-feature-13', name: 'Path Feature', level: 13, description: [
        'You gain a feature from your Rider Path.',
        '',
        'Skylance — Sundering Lance: Your weapon attacks ignore resistance to non-magical bludgeoning, piercing, and slashing damage. In addition, when you score a critical hit with a melee weapon, the target\'s AC is reduced by 2 until the end of your next turn (no save).',
        '',
        'Wyrmbond — Twin Soul Surge: You can now begin a Draconic Sync as a free action (no action required) once per short or long rest. In addition, when you end a merge voluntarily, you can immediately move up to your speed and make one weapon attack as a reaction.',
        '',
        'Stormcaller — Stormcaller\'s Mark: Your Hunter\'s Insight is enhanced. While a creature is your quarry: your ranged attacks against them ignore half cover and three-quarters cover, your dragon also gains the Hunter\'s Insight bonus damage when attacking the quarry, and if the quarry is reduced to 0 HP, you regain one expended use of Hunter\'s Insight.',
      ] },
      { index: 'dr-skyborn-reflexes', name: 'Skyborn Reflexes', level: 14, description: [
        'Your aerial training is second nature. You have advantage on Dexterity saving throws while flying or while mounted on your dragon.',
        'In addition, when you fall while within 100 feet of your dragon, your dragon can use its reaction to dive and catch you, ending the fall (no damage taken).',
      ] },
      { index: 'dr-draconic-soulstrike', name: 'Draconic Soulstrike', level: 15, description: [
        'Once per turn, when you hit a creature with a weapon attack, you can deal an extra 1d8 elemental damage of your dragon\'s type. On a successful hit, the target also suffers an elemental affliction until the end of your next turn:',
        '• Fire / Lightning: target sheds dim light in a 10-ft radius and has disadvantage on Stealth checks.',
        '• Cold: target\'s speed is reduced by 10 feet.',
        '• Acid / Poison: target has disadvantage on the next attack roll it makes.',
        '• Thunder: target cannot take reactions.',
        '• Radiant: target sheds dim light and cannot benefit from invisibility.',
        '• Necrotic: target cannot regain hit points.',
      ] },
      { index: 'dr-shared-resistance', name: 'Shared Resistance', level: 15, description: [
        'You gain resistance to your dragon\'s elemental damage type.',
      ] },
      { index: 'dr-patrons-gift-3', name: "Patron's Gift (3rd)", level: 15, description: [
        'Your patron grants you a third gift. The 3rd gift is anchored to high-tier features and should feel correspondingly more impactful than your 2nd.',
      ], hasChoice: true },
      { index: 'dr-asi-16', name: 'Ability Score Improvement', level: 16, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'dr-path-feature-17', name: 'Path Feature', level: 17, description: [
        'You gain a feature from your Rider Path.',
        '',
        'Skylance — Heaven\'s Hammer: Once per long rest, when you and your dragon dive from at least 30 feet in the air, you can call down a devastating impact. All creatures within 20 feet of your landing point must make a DEX save (DC 8 + PB + Str). On a fail: 8d10 damage of your dragon\'s elemental type plus 4d10 bludgeoning, and the target is knocked prone. On a success: half damage, not knocked prone. You and your dragon take no fall damage from this descent.',
        '',
        'Wyrmbond — One Mind, Two Bodies: Your bond transcends the boundary of bodies. You and your dragon share senses constantly — what one sees and hears, the other sees and hears, regardless of distance. You can communicate telepathically across any distance on the same plane. In addition, you can now extend a Draconic Sync indefinitely while out of combat (it ends as normal when combat begins, unless you have Draconic Ascendance).',
        '',
        'Stormcaller — Apex Predator: Once per long rest, you can enter a hyper-focused state for 1 minute. While in this state: you and your dragon\'s attacks against your quarry are made with advantage, you can mark a new quarry as a free action on each of your turns, and critical hits against your quarry deal an extra 4d6 damage of your dragon\'s elemental type.',
      ] },
      { index: 'dr-class-scaling-17', name: 'Class Scaling at 17', level: 17, description: [
        'Several of your existing features improve at this level:',
        "• Hunter's Insight bonus damage becomes 1d8.",
        "• Drake's Breath damage becomes 6d6.",
        '• Dragonstrike extra elemental damage becomes 3d8.',
      ] },
      { index: 'dr-signature-ascends', name: 'Signature Ascends', level: 17, description: [
        'Your Signature Weapon achieves its final form. Choose its 3rd-tier property. The weapon now counts as Very Rare rarity for the purposes of overcoming resistance and immunity.',
      ], hasChoice: true },
      { index: 'dr-apex-bond', name: 'Apex Bond', level: 18, description: [
        'The bond between you and your dragon is unshakable. While you and your dragon are within 60 feet of each other:',
        '• You both have advantage on saving throws against being Charmed, Frightened, Paralyzed, or Stunned.',
        '• When one of you takes damage, the other can choose to take half of that damage instead (no action required, but only once per round).',
        '• You both regain 10 hit points whenever the other rolls initiative (once per encounter).',
      ] },
      { index: 'dr-asi-19', name: 'Ability Score Improvement', level: 19, description: ['You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.'], hasChoice: true },
      { index: 'dr-draconic-ascendance', name: 'Draconic Ascendance', level: 20, description: [
        'Your bond reaches its final form. While in combat, you and your dragon can enter a permanent merged state — beginning combat already in Draconic Sync, with no action required, and the merge does not end until combat ends. You may choose to unmerge at any point.',
        'While merged in Draconic Ascendance:',
        '• Your walking speed becomes 60 feet, and you have a flying speed of 60 feet.',
        '• Your weapon attacks deal an extra 1d12 elemental damage of your dragon\'s type.',
        '• When you take the Attack action, you can make one additional attack as part of that action, once per turn.',
        '• You have advantage on Dexterity and Wisdom saving throws.',
        '• You can use any of your dragon\'s attacks and abilities (bite, claws, tail swipe, breath weapon) as if they were your own.',
        '• Breath Echo functions as a full breath attack — 30-ft cone, 6d6 damage, no charge limit.',
        'You can enter Draconic Ascendance an unlimited number of times per day, but only one merge at a time, and only during combat.',
      ] },
      { index: 'dr-patrons-gift-4', name: "Patron's Gift (4th — Capstone)", level: 20, description: [
        'Your patron grants you a final, mythic gift. The 4th gift is anchored to Draconic Ascendance and may, with DM permission, bend some standard balance rules — your character has reached the apex of what mortals can become.',
      ], hasChoice: true },
    ],
  },
}
