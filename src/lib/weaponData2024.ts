/**
 * 2024 PHB weapon data with mastery properties.
 * All weapons include their mastery property, damage, weight, cost, and properties.
 */

// ─── Mastery Properties ───

export type WeaponMastery = 'Cleave' | 'Graze' | 'Nick' | 'Push' | 'Sap' | 'Slow' | 'Topple' | 'Vex'

export const MASTERY_DESCRIPTIONS: Record<WeaponMastery, string> = {
  Cleave: 'If you hit a creature with a melee attack roll using this weapon, you can make a melee attack roll with this weapon against a second creature within 5 feet of the first that is also within your reach. On a hit, the second creature takes the weapon\'s damage, but don\'t add your ability modifier to that damage unless that modifier is negative. You can make this extra attack only once per turn.',
  Graze: 'If your attack roll with this weapon misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the weapon, and the damage can be increased only by increasing the ability modifier.',
  Nick: 'When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.',
  Push: 'If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from you if it is Large or smaller.',
  Sap: 'If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.',
  Slow: 'If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn\'t exceed 10 feet.',
  Topple: 'If you hit a creature with this weapon, you can force the creature to make a Constitution saving throw (DC 8 + the ability modifier used for the attack roll + your Proficiency Bonus). On a failed save, the creature has the Prone condition.',
  Vex: 'If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.',
}

// ─── Weapon Properties ───

export type WeaponProperty =
  | 'Ammunition'
  | 'Finesse'
  | 'Heavy'
  | 'Light'
  | 'Loading'
  | 'Range'
  | 'Reach'
  | 'Thrown'
  | 'Two-Handed'
  | 'Versatile'

// ─── Weapon Data ───

export interface Weapon2024 {
  name: string
  category: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged'
  damage: string
  damageType: 'Bludgeoning' | 'Piercing' | 'Slashing'
  weight: number
  cost: string
  properties: string[]
  mastery: WeaponMastery
  range?: { normal: number; long: number }
  versatileDamage?: string
}

export const WEAPONS_2024: Weapon2024[] = [
  // ── Simple Melee Weapons ──
  { name: 'Club', category: 'Simple Melee', damage: '1d4', damageType: 'Bludgeoning', weight: 2, cost: '1 SP', properties: ['Light'], mastery: 'Slow' },
  { name: 'Dagger', category: 'Simple Melee', damage: '1d4', damageType: 'Piercing', weight: 1, cost: '2 GP', properties: ['Finesse', 'Light', 'Thrown'], mastery: 'Nick', range: { normal: 20, long: 60 } },
  { name: 'Greatclub', category: 'Simple Melee', damage: '1d8', damageType: 'Bludgeoning', weight: 10, cost: '2 SP', properties: ['Two-Handed'], mastery: 'Push' },
  { name: 'Handaxe', category: 'Simple Melee', damage: '1d6', damageType: 'Slashing', weight: 2, cost: '5 GP', properties: ['Light', 'Thrown'], mastery: 'Vex', range: { normal: 20, long: 60 } },
  { name: 'Javelin', category: 'Simple Melee', damage: '1d6', damageType: 'Piercing', weight: 2, cost: '5 SP', properties: ['Thrown'], mastery: 'Slow', range: { normal: 30, long: 120 } },
  { name: 'Light Hammer', category: 'Simple Melee', damage: '1d4', damageType: 'Bludgeoning', weight: 2, cost: '2 GP', properties: ['Light', 'Thrown'], mastery: 'Nick', range: { normal: 20, long: 60 } },
  { name: 'Mace', category: 'Simple Melee', damage: '1d6', damageType: 'Bludgeoning', weight: 4, cost: '5 GP', properties: [], mastery: 'Sap' },
  { name: 'Quarterstaff', category: 'Simple Melee', damage: '1d6', damageType: 'Bludgeoning', weight: 4, cost: '2 SP', properties: ['Versatile'], mastery: 'Topple', versatileDamage: '1d8' },
  { name: 'Sickle', category: 'Simple Melee', damage: '1d4', damageType: 'Slashing', weight: 2, cost: '1 GP', properties: ['Light'], mastery: 'Nick' },
  { name: 'Spear', category: 'Simple Melee', damage: '1d6', damageType: 'Piercing', weight: 3, cost: '1 GP', properties: ['Thrown', 'Versatile'], mastery: 'Sap', range: { normal: 20, long: 60 }, versatileDamage: '1d8' },

  // ── Simple Ranged Weapons ──
  { name: 'Light Crossbow', category: 'Simple Ranged', damage: '1d8', damageType: 'Piercing', weight: 5, cost: '25 GP', properties: ['Ammunition', 'Loading', 'Two-Handed'], mastery: 'Slow', range: { normal: 80, long: 320 } },
  { name: 'Dart', category: 'Simple Ranged', damage: '1d4', damageType: 'Piercing', weight: 0.25, cost: '5 CP', properties: ['Finesse', 'Thrown'], mastery: 'Vex', range: { normal: 20, long: 60 } },
  { name: 'Shortbow', category: 'Simple Ranged', damage: '1d6', damageType: 'Piercing', weight: 2, cost: '25 GP', properties: ['Ammunition', 'Two-Handed'], mastery: 'Vex', range: { normal: 80, long: 320 } },
  { name: 'Sling', category: 'Simple Ranged', damage: '1d4', damageType: 'Bludgeoning', weight: 0, cost: '1 SP', properties: ['Ammunition'], mastery: 'Slow', range: { normal: 30, long: 120 } },

  // ── Martial Melee Weapons ──
  { name: 'Battleaxe', category: 'Martial Melee', damage: '1d8', damageType: 'Slashing', weight: 4, cost: '10 GP', properties: ['Versatile'], mastery: 'Topple', versatileDamage: '1d10' },
  { name: 'Flail', category: 'Martial Melee', damage: '1d8', damageType: 'Bludgeoning', weight: 2, cost: '10 GP', properties: [], mastery: 'Sap' },
  { name: 'Glaive', category: 'Martial Melee', damage: '1d10', damageType: 'Slashing', weight: 6, cost: '20 GP', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Graze' },
  { name: 'Greataxe', category: 'Martial Melee', damage: '1d12', damageType: 'Slashing', weight: 7, cost: '30 GP', properties: ['Heavy', 'Two-Handed'], mastery: 'Cleave' },
  { name: 'Greatsword', category: 'Martial Melee', damage: '2d6', damageType: 'Slashing', weight: 6, cost: '50 GP', properties: ['Heavy', 'Two-Handed'], mastery: 'Graze' },
  { name: 'Halberd', category: 'Martial Melee', damage: '1d10', damageType: 'Slashing', weight: 6, cost: '20 GP', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Cleave' },
  { name: 'Lance', category: 'Martial Melee', damage: '1d10', damageType: 'Piercing', weight: 6, cost: '10 GP', properties: ['Heavy', 'Reach'], mastery: 'Topple' },
  { name: 'Longsword', category: 'Martial Melee', damage: '1d8', damageType: 'Slashing', weight: 3, cost: '15 GP', properties: ['Versatile'], mastery: 'Sap', versatileDamage: '1d10' },
  { name: 'Maul', category: 'Martial Melee', damage: '2d6', damageType: 'Bludgeoning', weight: 10, cost: '10 GP', properties: ['Heavy', 'Two-Handed'], mastery: 'Topple' },
  { name: 'Morningstar', category: 'Martial Melee', damage: '1d8', damageType: 'Piercing', weight: 4, cost: '15 GP', properties: [], mastery: 'Sap' },
  { name: 'Pike', category: 'Martial Melee', damage: '1d10', damageType: 'Piercing', weight: 18, cost: '5 GP', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Push' },
  { name: 'Rapier', category: 'Martial Melee', damage: '1d8', damageType: 'Piercing', weight: 2, cost: '25 GP', properties: ['Finesse'], mastery: 'Vex' },
  { name: 'Scimitar', category: 'Martial Melee', damage: '1d6', damageType: 'Slashing', weight: 3, cost: '25 GP', properties: ['Finesse', 'Light'], mastery: 'Nick' },
  { name: 'Shortsword', category: 'Martial Melee', damage: '1d6', damageType: 'Piercing', weight: 2, cost: '10 GP', properties: ['Finesse', 'Light'], mastery: 'Vex' },
  { name: 'Trident', category: 'Martial Melee', damage: '1d8', damageType: 'Piercing', weight: 4, cost: '5 GP', properties: ['Thrown', 'Versatile'], mastery: 'Topple', range: { normal: 20, long: 60 }, versatileDamage: '1d10' },
  { name: 'War Pick', category: 'Martial Melee', damage: '1d8', damageType: 'Piercing', weight: 2, cost: '5 GP', properties: [], mastery: 'Sap' },
  { name: 'Warhammer', category: 'Martial Melee', damage: '1d8', damageType: 'Bludgeoning', weight: 2, cost: '15 GP', properties: ['Versatile'], mastery: 'Push', versatileDamage: '1d10' },
  { name: 'Whip', category: 'Martial Melee', damage: '1d4', damageType: 'Slashing', weight: 3, cost: '2 GP', properties: ['Finesse', 'Reach'], mastery: 'Slow' },

  // ── Martial Ranged Weapons ──
  { name: 'Blowgun', category: 'Martial Ranged', damage: '1', damageType: 'Piercing', weight: 1, cost: '10 GP', properties: ['Ammunition', 'Loading'], mastery: 'Vex', range: { normal: 25, long: 100 } },
  { name: 'Hand Crossbow', category: 'Martial Ranged', damage: '1d6', damageType: 'Piercing', weight: 3, cost: '75 GP', properties: ['Ammunition', 'Light', 'Loading'], mastery: 'Vex', range: { normal: 30, long: 120 } },
  { name: 'Heavy Crossbow', category: 'Martial Ranged', damage: '1d10', damageType: 'Piercing', weight: 18, cost: '50 GP', properties: ['Ammunition', 'Heavy', 'Loading', 'Two-Handed'], mastery: 'Push', range: { normal: 100, long: 400 } },
  { name: 'Longbow', category: 'Martial Ranged', damage: '1d8', damageType: 'Piercing', weight: 2, cost: '50 GP', properties: ['Ammunition', 'Heavy', 'Two-Handed'], mastery: 'Slow', range: { normal: 150, long: 600 } },
  { name: 'Musket', category: 'Martial Ranged', damage: '1d12', damageType: 'Piercing', weight: 10, cost: '500 GP', properties: ['Ammunition', 'Loading', 'Two-Handed'], mastery: 'Slow', range: { normal: 40, long: 120 } },
  { name: 'Pistol', category: 'Martial Ranged', damage: '1d10', damageType: 'Piercing', weight: 3, cost: '250 GP', properties: ['Ammunition', 'Loading'], mastery: 'Vex', range: { normal: 30, long: 90 } },
]

// ─── Armor Data ───

export interface Armor2024 {
  name: string
  category: 'Light' | 'Medium' | 'Heavy' | 'Shield'
  ac: number
  dexBonus: boolean
  maxDexBonus?: number
  strMinimum?: number
  stealthDisadvantage: boolean
  weight: number
  cost: string
}

export const ARMOR_2024: Armor2024[] = [
  // Light Armor
  { name: 'Padded', category: 'Light', ac: 11, dexBonus: true, stealthDisadvantage: true, weight: 8, cost: '5 GP' },
  { name: 'Leather', category: 'Light', ac: 11, dexBonus: true, stealthDisadvantage: false, weight: 10, cost: '10 GP' },
  { name: 'Studded Leather', category: 'Light', ac: 12, dexBonus: true, stealthDisadvantage: false, weight: 13, cost: '45 GP' },

  // Medium Armor
  { name: 'Hide', category: 'Medium', ac: 12, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 12, cost: '10 GP' },
  { name: 'Chain Shirt', category: 'Medium', ac: 13, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 20, cost: '50 GP' },
  { name: 'Scale Mail', category: 'Medium', ac: 14, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: true, weight: 45, cost: '50 GP' },
  { name: 'Breastplate', category: 'Medium', ac: 14, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: false, weight: 20, cost: '400 GP' },
  { name: 'Half Plate', category: 'Medium', ac: 15, dexBonus: true, maxDexBonus: 2, stealthDisadvantage: true, weight: 40, cost: '750 GP' },

  // Heavy Armor
  { name: 'Ring Mail', category: 'Heavy', ac: 14, dexBonus: false, stealthDisadvantage: true, weight: 40, cost: '30 GP' },
  { name: 'Chain Mail', category: 'Heavy', ac: 16, dexBonus: false, strMinimum: 13, stealthDisadvantage: true, weight: 55, cost: '75 GP' },
  { name: 'Splint', category: 'Heavy', ac: 17, dexBonus: false, strMinimum: 15, stealthDisadvantage: true, weight: 60, cost: '200 GP' },
  { name: 'Plate', category: 'Heavy', ac: 18, dexBonus: false, strMinimum: 15, stealthDisadvantage: true, weight: 65, cost: '1,500 GP' },

  // Shield
  { name: 'Shield', category: 'Shield', ac: 2, dexBonus: false, stealthDisadvantage: false, weight: 6, cost: '10 GP' },
]

// ─── Lookup helpers ───

/** Find a weapon by name (case-insensitive) */
export function getWeapon(name: string): Weapon2024 | undefined {
  return WEAPONS_2024.find(w => w.name.toLowerCase() === name.toLowerCase())
}

/** Find armor by name (case-insensitive) */
export function getArmor(name: string): Armor2024 | undefined {
  return ARMOR_2024.find(a => a.name.toLowerCase() === name.toLowerCase())
}

/** Get all weapons that have a specific mastery property */
export function getWeaponsByMastery(mastery: WeaponMastery): Weapon2024[] {
  return WEAPONS_2024.filter(w => w.mastery === mastery)
}

/** Get weapons by category */
export function getWeaponsByCategory(category: Weapon2024['category']): Weapon2024[] {
  return WEAPONS_2024.filter(w => w.category === category)
}

/** Check if a weapon is simple or martial */
export function isSimpleWeapon(name: string): boolean {
  const w = getWeapon(name)
  return w ? w.category.startsWith('Simple') : false
}

export function isMartialWeapon(name: string): boolean {
  const w = getWeapon(name)
  return w ? w.category.startsWith('Martial') : false
}

// ─── Adventuring Gear ───

export interface GearItem {
  name: string
  category: 'Adventuring Gear' | 'Tool' | 'Ammunition' | 'Arcane Focus' | 'Druidic Focus' | 'Holy Symbol' | 'Pack' | 'Gaming Set' | 'Musical Instrument'
  weight: number
  cost: string
  description?: string
}

export const GEAR_2024: GearItem[] = [
  // Ammunition
  { name: 'Arrows (20)', category: 'Ammunition', weight: 1, cost: '1 GP' },
  { name: 'Bolts (20)', category: 'Ammunition', weight: 1.5, cost: '1 GP' },
  { name: 'Bullets, Sling (20)', category: 'Ammunition', weight: 1.5, cost: '4 CP' },
  { name: 'Needles, Blowgun (50)', category: 'Ammunition', weight: 1, cost: '1 GP' },

  // Arcane Focuses
  { name: 'Arcane Focus (Crystal)', category: 'Arcane Focus', weight: 1, cost: '10 GP' },
  { name: 'Arcane Focus (Orb)', category: 'Arcane Focus', weight: 3, cost: '20 GP' },
  { name: 'Arcane Focus (Rod)', category: 'Arcane Focus', weight: 2, cost: '10 GP' },
  { name: 'Arcane Focus (Staff)', category: 'Arcane Focus', weight: 4, cost: '5 GP' },
  { name: 'Arcane Focus (Wand)', category: 'Arcane Focus', weight: 1, cost: '10 GP' },

  // Druidic Focuses
  { name: 'Druidic Focus (Sprig of Mistletoe)', category: 'Druidic Focus', weight: 0, cost: '1 GP' },
  { name: 'Druidic Focus (Totem)', category: 'Druidic Focus', weight: 0, cost: '1 GP' },
  { name: 'Druidic Focus (Wooden Staff)', category: 'Druidic Focus', weight: 4, cost: '5 GP' },
  { name: 'Druidic Focus (Yew Wand)', category: 'Druidic Focus', weight: 1, cost: '10 GP' },

  // Holy Symbols
  { name: 'Holy Symbol (Amulet)', category: 'Holy Symbol', weight: 1, cost: '5 GP' },
  { name: 'Holy Symbol (Emblem)', category: 'Holy Symbol', weight: 0, cost: '5 GP' },
  { name: 'Holy Symbol (Reliquary)', category: 'Holy Symbol', weight: 2, cost: '5 GP' },

  // Adventuring Gear
  { name: 'Abacus', category: 'Adventuring Gear', weight: 2, cost: '2 GP' },
  { name: 'Acid (Vial)', category: 'Adventuring Gear', weight: 1, cost: '25 GP', description: 'As a Utilize action, you can splash the contents onto a creature within 5 feet or throw the vial up to 20 feet, shattering on impact. Make a ranged attack against a creature or object, treating the acid as a Simple weapon. On a hit, the target takes 2d6 Acid damage.' },
  { name: 'Alchemist\'s Fire (Flask)', category: 'Adventuring Gear', weight: 1, cost: '50 GP', description: 'As a Utilize action, you can throw this flask up to 20 feet, shattering on impact. Make a ranged attack against a creature or object, treating the fire as a Simple weapon. On a hit, the target takes 1d4 Fire damage at the start of each of its turns. A creature can end this damage by using its action to make a DC 10 Dexterity check to extinguish the flames.' },
  { name: 'Antitoxin (Vial)', category: 'Adventuring Gear', weight: 0, cost: '50 GP', description: 'A creature that drinks this gains Advantage on saving throws against the Poisoned condition for 1 hour.' },
  { name: 'Backpack', category: 'Adventuring Gear', weight: 5, cost: '2 GP' },
  { name: 'Ball Bearings (Bag of 1,000)', category: 'Adventuring Gear', weight: 2, cost: '1 GP' },
  { name: 'Barrel', category: 'Adventuring Gear', weight: 70, cost: '2 GP' },
  { name: 'Basket', category: 'Adventuring Gear', weight: 2, cost: '4 SP' },
  { name: 'Bedroll', category: 'Adventuring Gear', weight: 7, cost: '1 GP' },
  { name: 'Bell', category: 'Adventuring Gear', weight: 0, cost: '1 GP' },
  { name: 'Blanket', category: 'Adventuring Gear', weight: 3, cost: '5 SP' },
  { name: 'Block and Tackle', category: 'Adventuring Gear', weight: 5, cost: '1 GP' },
  { name: 'Book', category: 'Adventuring Gear', weight: 5, cost: '25 GP' },
  { name: 'Bottle, Glass', category: 'Adventuring Gear', weight: 2, cost: '2 GP' },
  { name: 'Bucket', category: 'Adventuring Gear', weight: 2, cost: '5 CP' },
  { name: 'Burglar\'s Pack', category: 'Pack', weight: 42, cost: '16 GP', description: 'Includes a Backpack, Ball Bearings, Bell, 10 Candles, Crowbar, Hooded Lantern, 7 flasks of Oil, 5 days Rations, Rope, Tinderbox, and Waterskin.' },
  { name: 'Caltrops (Bag of 20)', category: 'Adventuring Gear', weight: 2, cost: '1 GP' },
  { name: 'Candle', category: 'Adventuring Gear', weight: 0, cost: '1 CP' },
  { name: 'Case, Crossbow Bolt', category: 'Adventuring Gear', weight: 1, cost: '1 GP' },
  { name: 'Case, Map or Scroll', category: 'Adventuring Gear', weight: 1, cost: '1 GP' },
  { name: 'Chain (10 feet)', category: 'Adventuring Gear', weight: 10, cost: '5 GP' },
  { name: 'Chest', category: 'Adventuring Gear', weight: 25, cost: '5 GP' },
  { name: 'Climber\'s Kit', category: 'Adventuring Gear', weight: 12, cost: '25 GP' },
  { name: 'Component Pouch', category: 'Adventuring Gear', weight: 2, cost: '25 GP' },
  { name: 'Costume', category: 'Adventuring Gear', weight: 4, cost: '5 GP' },
  { name: 'Crowbar', category: 'Adventuring Gear', weight: 5, cost: '2 GP' },
  { name: 'Diplomat\'s Pack', category: 'Pack', weight: 39, cost: '39 GP', description: 'Includes a Chest, 2 Cases (Map or Scroll), Fine Clothes, Ink, 5 Ink Pens, Lamp, 2 flasks of Oil, 5 sheets of Paper, Perfume, Sealing Wax, and Soap.' },
  { name: 'Dungeoneer\'s Pack', category: 'Pack', weight: 55, cost: '12 GP', description: 'Includes a Backpack, Crowbar, Hammer, 10 Pitons, 10 Torches, Tinderbox, 10 days Rations, Waterskin, and 50 feet of Rope.' },
  { name: 'Entertainment Pack', category: 'Pack', weight: 0, cost: '3 GP', description: 'Includes a Musical Instrument or Gaming Set of your choice.' },
  { name: 'Explorer\'s Pack', category: 'Pack', weight: 55, cost: '10 GP', description: 'Includes a Backpack, Bedroll, 2 days Rations, Rope, Tinderbox, 10 Torches, and Waterskin.' },
  { name: 'Fine Clothes', category: 'Adventuring Gear', weight: 6, cost: '15 GP' },
  { name: 'Fishing Tackle', category: 'Adventuring Gear', weight: 4, cost: '1 GP' },
  { name: 'Flask', category: 'Adventuring Gear', weight: 1, cost: '2 CP' },
  { name: 'Grappling Hook', category: 'Adventuring Gear', weight: 4, cost: '2 GP' },
  { name: 'Hammer', category: 'Adventuring Gear', weight: 3, cost: '1 GP' },
  { name: 'Healer\'s Kit', category: 'Adventuring Gear', weight: 3, cost: '5 GP', description: 'This kit has 10 uses. As a Utilize action, you can expend one use of the kit to stabilize a creature that has 0 Hit Points, without needing to make a Wisdom (Medicine) check.' },
  { name: 'Holy Water (Flask)', category: 'Adventuring Gear', weight: 1, cost: '25 GP' },
  { name: 'Hooded Lantern', category: 'Adventuring Gear', weight: 2, cost: '5 GP' },
  { name: 'Hunting Trap', category: 'Adventuring Gear', weight: 25, cost: '5 GP' },
  { name: 'Ink (1 ounce bottle)', category: 'Adventuring Gear', weight: 0, cost: '10 GP' },
  { name: 'Ink Pen', category: 'Adventuring Gear', weight: 0, cost: '2 CP' },
  { name: 'Iron Pot', category: 'Adventuring Gear', weight: 10, cost: '2 GP' },
  { name: 'Jug', category: 'Adventuring Gear', weight: 4, cost: '2 CP' },
  { name: 'Ladder (10-foot)', category: 'Adventuring Gear', weight: 25, cost: '1 SP' },
  { name: 'Lamp', category: 'Adventuring Gear', weight: 1, cost: '5 SP' },
  { name: 'Lantern, Bullseye', category: 'Adventuring Gear', weight: 2, cost: '10 GP' },
  { name: 'Lock', category: 'Adventuring Gear', weight: 1, cost: '10 GP' },
  { name: 'Magnifying Glass', category: 'Adventuring Gear', weight: 0, cost: '100 GP' },
  { name: 'Manacles', category: 'Adventuring Gear', weight: 6, cost: '2 GP' },
  { name: 'Map', category: 'Adventuring Gear', weight: 0, cost: '1 GP' },
  { name: 'Mirror, Steel', category: 'Adventuring Gear', weight: 0.5, cost: '5 GP' },
  { name: 'Net', category: 'Adventuring Gear', weight: 3, cost: '1 GP' },
  { name: 'Oil (Flask)', category: 'Adventuring Gear', weight: 1, cost: '1 SP' },
  { name: 'Paper (one sheet)', category: 'Adventuring Gear', weight: 0, cost: '2 SP' },
  { name: 'Parchment (one sheet)', category: 'Adventuring Gear', weight: 0, cost: '1 SP' },
  { name: 'Perfume (Vial)', category: 'Adventuring Gear', weight: 0, cost: '5 GP' },
  { name: 'Piton', category: 'Adventuring Gear', weight: 0.25, cost: '5 CP' },
  { name: 'Poison, Basic (Vial)', category: 'Adventuring Gear', weight: 0, cost: '100 GP' },
  { name: 'Pole (10-foot)', category: 'Adventuring Gear', weight: 7, cost: '5 CP' },
  { name: 'Potion of Healing', category: 'Adventuring Gear', weight: 0.5, cost: '50 GP', description: 'You regain 2d4 + 2 Hit Points when you drink this potion.' },
  { name: 'Pouch', category: 'Adventuring Gear', weight: 1, cost: '5 SP' },
  { name: 'Priest\'s Pack', category: 'Pack', weight: 29, cost: '33 GP', description: 'Includes a Backpack, Blanket, Holy Water, 2 days Rations, Tinderbox, and Waterskin. Also includes 10 Candles, an Alms Box, 2 blocks of Incense, a Censer, Vestments, and a Prayer Book.' },
  { name: 'Quiver', category: 'Adventuring Gear', weight: 1, cost: '1 GP' },
  { name: 'Ram, Portable', category: 'Adventuring Gear', weight: 35, cost: '4 GP' },
  { name: 'Rations (1 day)', category: 'Adventuring Gear', weight: 2, cost: '5 SP' },
  { name: 'Robe', category: 'Adventuring Gear', weight: 4, cost: '1 GP' },
  { name: 'Rope (50 feet)', category: 'Adventuring Gear', weight: 10, cost: '1 GP' },
  { name: 'Sack', category: 'Adventuring Gear', weight: 0.5, cost: '1 CP' },
  { name: 'Scholar\'s Pack', category: 'Pack', weight: 22, cost: '40 GP', description: 'Includes a Backpack, Book, Ink, Ink Pen, 10 sheets of Parchment, a Little Bag of Sand, and a Small Knife.' },
  { name: 'Sealing Wax', category: 'Adventuring Gear', weight: 0, cost: '5 SP' },
  { name: 'Shovel', category: 'Adventuring Gear', weight: 5, cost: '2 GP' },
  { name: 'Signal Whistle', category: 'Adventuring Gear', weight: 0, cost: '5 CP' },
  { name: 'Soap', category: 'Adventuring Gear', weight: 0, cost: '2 CP' },
  { name: 'Spikes, Iron (10)', category: 'Adventuring Gear', weight: 5, cost: '1 GP' },
  { name: 'Spyglass', category: 'Adventuring Gear', weight: 1, cost: '1000 GP' },
  { name: 'String (10 feet)', category: 'Adventuring Gear', weight: 0, cost: '1 SP' },
  { name: 'Tent, Two-Person', category: 'Adventuring Gear', weight: 20, cost: '2 GP' },
  { name: 'Tinderbox', category: 'Adventuring Gear', weight: 1, cost: '5 SP' },
  { name: 'Torch', category: 'Adventuring Gear', weight: 1, cost: '1 CP' },
  { name: 'Traveler\'s Clothes', category: 'Adventuring Gear', weight: 4, cost: '2 GP' },
  { name: 'Vial', category: 'Adventuring Gear', weight: 0, cost: '1 GP' },
  { name: 'Waterskin', category: 'Adventuring Gear', weight: 5, cost: '2 SP' },

  // Tools
  { name: "Alchemist's Supplies", category: 'Tool', weight: 8, cost: '50 GP' },
  { name: "Brewer's Supplies", category: 'Tool', weight: 9, cost: '20 GP' },
  { name: "Calligrapher's Supplies", category: 'Tool', weight: 5, cost: '10 GP' },
  { name: "Carpenter's Tools", category: 'Tool', weight: 6, cost: '8 GP' },
  { name: "Cartographer's Tools", category: 'Tool', weight: 6, cost: '15 GP' },
  { name: "Cobbler's Tools", category: 'Tool', weight: 5, cost: '5 GP' },
  { name: "Cook's Utensils", category: 'Tool', weight: 8, cost: '1 GP' },
  { name: "Forgery Kit", category: 'Tool', weight: 5, cost: '15 GP' },
  { name: "Glassblower's Tools", category: 'Tool', weight: 5, cost: '30 GP' },
  { name: 'Herbalism Kit', category: 'Tool', weight: 3, cost: '5 GP' },
  { name: "Jeweler's Tools", category: 'Tool', weight: 2, cost: '25 GP' },
  { name: "Leatherworker's Tools", category: 'Tool', weight: 5, cost: '5 GP' },
  { name: "Mason's Tools", category: 'Tool', weight: 8, cost: '10 GP' },
  { name: "Navigator's Tools", category: 'Tool', weight: 2, cost: '25 GP' },
  { name: "Painter's Supplies", category: 'Tool', weight: 5, cost: '10 GP' },
  { name: "Poisoner's Kit", category: 'Tool', weight: 2, cost: '50 GP' },
  { name: "Potter's Tools", category: 'Tool', weight: 3, cost: '10 GP' },
  { name: "Smith's Tools", category: 'Tool', weight: 8, cost: '20 GP' },
  { name: "Thieves' Tools", category: 'Tool', weight: 1, cost: '25 GP' },
  { name: "Tinker's Tools", category: 'Tool', weight: 10, cost: '50 GP' },
  { name: "Weaver's Tools", category: 'Tool', weight: 5, cost: '1 GP' },
  { name: "Woodcarver's Tools", category: 'Tool', weight: 5, cost: '1 GP' },

  // Gaming Sets
  { name: 'Dice Set', category: 'Gaming Set', weight: 0, cost: '1 SP' },
  { name: 'Dragonchess Set', category: 'Gaming Set', weight: 0.5, cost: '1 GP' },
  { name: 'Playing Card Set', category: 'Gaming Set', weight: 0, cost: '5 SP' },
  { name: 'Three-Dragon Ante Set', category: 'Gaming Set', weight: 0, cost: '1 GP' },

  // Musical Instruments
  { name: 'Bagpipes', category: 'Musical Instrument', weight: 6, cost: '30 GP' },
  { name: 'Drum', category: 'Musical Instrument', weight: 3, cost: '6 GP' },
  { name: 'Dulcimer', category: 'Musical Instrument', weight: 10, cost: '25 GP' },
  { name: 'Flute', category: 'Musical Instrument', weight: 1, cost: '2 GP' },
  { name: 'Horn', category: 'Musical Instrument', weight: 2, cost: '3 GP' },
  { name: 'Lute', category: 'Musical Instrument', weight: 2, cost: '35 GP' },
  { name: 'Lyre', category: 'Musical Instrument', weight: 2, cost: '30 GP' },
  { name: 'Pan Flute', category: 'Musical Instrument', weight: 2, cost: '12 GP' },
  { name: 'Shawm', category: 'Musical Instrument', weight: 1, cost: '2 GP' },
  { name: 'Viol', category: 'Musical Instrument', weight: 1, cost: '30 GP' },
]

/** Find gear by name (case-insensitive) */
export function getGear(name: string): GearItem | undefined {
  return GEAR_2024.find(g => g.name.toLowerCase() === name.toLowerCase())
}

/** Get all local equipment items as a unified list for browsing */
export interface LocalEquipmentItem {
  name: string
  type: 'weapon' | 'armor' | 'gear'
  weight: number
  cost: string
  description: string
}

export function getAllLocalEquipment(): LocalEquipmentItem[] {
  const items: LocalEquipmentItem[] = []
  for (const w of WEAPONS_2024) {
    items.push({
      name: w.name,
      type: 'weapon',
      weight: w.weight,
      cost: w.cost,
      description: `${w.damage} ${w.damageType}. ${w.category}. ${formatWeaponProperties(w)}`,
    })
  }
  for (const a of ARMOR_2024) {
    let desc = `${a.category} armor. AC ${a.ac}`
    if (a.dexBonus) desc += a.maxDexBonus ? ` + DEX (max ${a.maxDexBonus})` : ' + DEX'
    if (a.strMinimum) desc += `. Requires STR ${a.strMinimum}`
    if (a.stealthDisadvantage) desc += '. Stealth Disadvantage'
    items.push({ name: a.name, type: 'armor', weight: a.weight, cost: a.cost, description: desc })
  }
  for (const g of GEAR_2024) {
    items.push({ name: g.name, type: 'gear', weight: g.weight, cost: g.cost, description: g.description ?? g.category })
  }
  return items
}

/** Format weapon properties as a readable string including mastery */
export function formatWeaponProperties(weapon: Weapon2024): string {
  const parts = [...weapon.properties]
  if (weapon.range) {
    const rangeIdx = parts.indexOf('Range')
    if (rangeIdx >= 0) parts[rangeIdx] = `Range (${weapon.range.normal}/${weapon.range.long})`
    else if (parts.includes('Thrown')) {
      const thrownIdx = parts.indexOf('Thrown')
      parts[thrownIdx] = `Thrown (${weapon.range.normal}/${weapon.range.long})`
    } else if (parts.includes('Ammunition')) {
      const ammoIdx = parts.indexOf('Ammunition')
      parts[ammoIdx] = `Ammunition (${weapon.range.normal}/${weapon.range.long})`
    }
  }
  if (weapon.versatileDamage) {
    const versIdx = parts.indexOf('Versatile')
    if (versIdx >= 0) parts[versIdx] = `Versatile (${weapon.versatileDamage})`
  }
  parts.push(`Mastery: ${weapon.mastery}`)
  return parts.join(', ')
}
