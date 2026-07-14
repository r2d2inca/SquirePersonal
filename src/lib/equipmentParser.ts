import { getWeapon, getArmor, formatWeaponProperties } from './weaponData2024'

export interface ParsedEquipmentItem {
  name: string
  quantity: number
  category: 'gear' | 'weapon' | 'armor' | 'consumable'
  weight: number
  description: string
  damage?: string
  weaponProperties?: string
  mastery?: string
}

function categorizeItem(name: string): ParsedEquipmentItem['category'] {
  const lower = name.toLowerCase()
  // Check 2024 weapon data first
  if (getWeapon(lower)) return 'weapon'
  // Check 2024 armor data
  if (getArmor(lower)) return 'armor'
  // Fallback heuristics
  if (lower.includes('arrow') || lower.includes('bolt') || lower.includes('needle')) return 'consumable'
  if (lower.includes('shield') || lower.includes('armor') || lower.includes('chain mail') || lower.includes('plate')) return 'armor'
  return 'gear'
}

function enrichItem(item: ParsedEquipmentItem): ParsedEquipmentItem {
  const weapon = getWeapon(item.name)
  if (weapon) {
    return {
      ...item,
      category: 'weapon',
      weight: weapon.weight,
      damage: `${weapon.damage} ${weapon.damageType}`,
      weaponProperties: formatWeaponProperties(weapon),
      mastery: weapon.mastery,
      description: item.description || `${weapon.category} weapon. ${weapon.damage} ${weapon.damageType} damage.`,
    }
  }
  const armor = getArmor(item.name)
  if (armor) {
    let desc = `${armor.category} armor. AC ${armor.ac}`
    if (armor.dexBonus) desc += armor.maxDexBonus ? ` + DEX (max ${armor.maxDexBonus})` : ' + DEX'
    if (armor.strMinimum) desc += `. Requires STR ${armor.strMinimum}`
    if (armor.stealthDisadvantage) desc += '. Stealth Disadvantage'
    return {
      ...item,
      category: 'armor',
      weight: armor.weight,
      description: item.description || desc,
    }
  }
  return item
}

export function parseBackgroundEquipment(equipmentString: string): {
  items: ParsedEquipmentItem[]
  gold: number
} {
  if (!equipmentString) return { items: [], gold: 0 }

  const tokens = equipmentString.split(', ')
  let gold = 0
  const items: ParsedEquipmentItem[] = []

  for (const token of tokens) {
    const trimmed = token.trim()
    if (!trimmed) continue

    // Gold at end: "16 GP"
    const goldMatch = trimmed.match(/^(\d+)\s*GP$/i)
    if (goldMatch) {
      gold = parseInt(goldMatch[1])
      continue
    }

    // Quantity pattern: "Dagger (2)" or "Arrows (20)"
    const qtyMatch = trimmed.match(/^(.+?)\s*\((\d+)(?:\s+\w+)?\)$/)
    if (qtyMatch) {
      const name = qtyMatch[1].trim()
      const qty = parseInt(qtyMatch[2])
      items.push(enrichItem({
        name,
        quantity: qty,
        category: categorizeItem(name),
        weight: 0,
        description: '',
      }))
      continue
    }

    // Plain item or descriptive parenthetical: "Book (prayers)", "Robe"
    items.push(enrichItem({
      name: trimmed,
      quantity: 1,
      category: categorizeItem(trimmed),
      weight: 0,
      description: '',
    }))
  }

  return { items, gold }
}
