import jsPDF from 'jspdf'
import { abilityModifier, proficiencyBonus } from '@/lib/calculations'
import { SKILLS } from '@/lib/constants'
import type { Character, Spell, SpellSlot, InventoryItem } from '@/lib/types/database'

// ─── Color palette ───
const GOLD: [number, number, number] = [180, 140, 60]
const LIGHT_GOLD: [number, number, number] = [250, 245, 230]
const DARK_TEXT: [number, number, number] = [30, 20, 10]
const MEDIUM_TEXT: [number, number, number] = [100, 85, 60]
const WHITE: [number, number, number] = [255, 255, 255]

function signedMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// ─── Helper: rounded rectangle ───
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'S' | 'F' | 'FD' = 'FD',
) {
  // jsPDF has roundedRect built in
  doc.roundedRect(x, y, w, h, r, r, style)
}

// ─── Helper: draw a styled box ───
function drawBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    fill?: [number, number, number]
    border?: [number, number, number]
    radius?: number
    borderWidth?: number
  } = {},
) {
  const {
    fill = LIGHT_GOLD,
    border = GOLD,
    radius = 2,
    borderWidth = 0.4,
  } = options

  doc.setFillColor(...fill)
  doc.setDrawColor(...border)
  doc.setLineWidth(borderWidth)
  roundedRect(doc, x, y, w, h, radius, fill ? 'FD' : 'S')
}

// ─── Helper: stat box with large value + small label ───
function drawStatBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  options: { goldBg?: boolean } = {},
) {
  if (options.goldBg) {
    drawBox(doc, x, y, w, h, { fill: GOLD, border: GOLD })
    doc.setTextColor(...WHITE)
  } else {
    drawBox(doc, x, y, w, h)
    doc.setTextColor(...DARK_TEXT)
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(value, x + w / 2, y + h / 2 - 1, { align: 'center' })

  if (options.goldBg) {
    doc.setTextColor(255, 255, 230)
  } else {
    doc.setTextColor(...MEDIUM_TEXT)
  }
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(label, x + w / 2, y + h - 3, { align: 'center' })

  // Reset
  doc.setTextColor(...DARK_TEXT)
}

// ─── Helper: section header with gold underline ───
function drawSectionHeader(doc: jsPDF, y: number, title: string, pageWidth: number, margin: number): number {
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD)
  doc.text(title, margin, y)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.6)
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5)
  doc.setTextColor(...DARK_TEXT)
  return y + 7
}

// ─── Helper: proficiency dot ───
function drawProfDot(doc: jsPDF, x: number, y: number, filled: boolean) {
  const r = 1.2
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  if (filled) {
    doc.setFillColor(...GOLD)
    doc.circle(x, y, r, 'FD')
  } else {
    doc.setFillColor(...WHITE)
    doc.circle(x, y, r, 'FD')
  }
}

// ─── Helper: fetch portrait image ───
async function fetchPortraitBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─── Main export function ───
export async function generateCharacterPDF(
  character: Character,
  spells: Spell[],
  spellSlots: SpellSlot[],
  items: InventoryItem[],
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  let y = 14

  function addPage() {
    doc.addPage()
    y = 14
  }

  function checkPageBreak(needed: number): boolean {
    if (y + needed > pageHeight - 14) {
      addPage()
      return true
    }
    return false
  }

  const pb = proficiencyBonus(character.level)

  // ─────────────────────────────────────
  // PAGE 1: Character Overview
  // ─────────────────────────────────────

  // Top decorative line
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.2)
  doc.line(margin, 10, pageWidth - margin, 10)
  doc.setLineWidth(0.3)
  doc.line(margin, 11.5, pageWidth - margin, 11.5)

  y = 16

  // ─── Header section with portrait ───
  const portraitSize = 36
  let portraitBase64: string | null = null
  if (character.portrait_url) {
    portraitBase64 = await fetchPortraitBase64(character.portrait_url)
  }

  const textX = portraitBase64 ? margin + portraitSize + 6 : margin

  if (portraitBase64) {
    // Draw portrait border
    drawBox(doc, margin, y - 2, portraitSize + 2, portraitSize + 2, {
      fill: LIGHT_GOLD,
      border: GOLD,
      radius: 3,
      borderWidth: 0.6,
    })
    doc.addImage(portraitBase64, 'JPEG', margin + 1, y - 1, portraitSize, portraitSize)
  } else {
    // Placeholder with initials
    const initials = character.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    drawBox(doc, margin, y - 2, portraitSize + 2, portraitSize + 2, {
      fill: LIGHT_GOLD,
      border: GOLD,
      radius: 3,
      borderWidth: 0.6,
    })
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GOLD)
    doc.text(initials, margin + (portraitSize + 2) / 2, y + portraitSize / 2 + 2, { align: 'center' })
    doc.setTextColor(...DARK_TEXT)
  }

  // Character name
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK_TEXT)
  doc.text(character.name, textX, y + 6)

  // Race + Class + Level
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MEDIUM_TEXT)
  const classLine = `Level ${character.level} ${character.race} ${character.class}${character.subclass ? ` (${character.subclass})` : ''}`
  doc.text(classLine, textX, y + 13)

  // Background + Alignment
  if (character.background || character.alignment) {
    doc.setFontSize(9)
    doc.setTextColor(...MEDIUM_TEXT)
    doc.text(
      [character.background, character.alignment].filter(Boolean).join('  |  '),
      textX,
      y + 19,
    )
  }

  // Proficiency bonus badge
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD)
  doc.text(`Proficiency Bonus: ${signedMod(pb)}`, textX, y + 26)

  doc.setTextColor(...DARK_TEXT)
  y += portraitSize + 6

  // ─── Ability Scores Row ───
  y = drawSectionHeader(doc, y, 'Ability Scores', pageWidth, margin)

  const abilityBoxW = 28
  const abilityBoxH = 25
  const abilityGap = (contentWidth - 6 * abilityBoxW) / 5
  const abilities: [string, number][] = [
    ['STR', character.strength],
    ['DEX', character.dexterity],
    ['CON', character.constitution],
    ['INT', character.intelligence],
    ['WIS', character.wisdom],
    ['CHA', character.charisma],
  ]

  abilities.forEach(([label, score], i) => {
    const bx = margin + i * (abilityBoxW + abilityGap)
    drawBox(doc, bx, y, abilityBoxW, abilityBoxH)

    // Ability abbreviation
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GOLD)
    doc.text(label, bx + abilityBoxW / 2, y + 5, { align: 'center' })

    // Score
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.text(`${score}`, bx + abilityBoxW / 2, y + 14, { align: 'center' })

    // Modifier
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MEDIUM_TEXT)
    const mod = abilityModifier(score)
    doc.text(`(${signedMod(mod)})`, bx + abilityBoxW / 2, y + 20, { align: 'center' })
  })

  doc.setTextColor(...DARK_TEXT)
  y += abilityBoxH + 6

  // ─── Combat Stats Row ───
  y = drawSectionHeader(doc, y, 'Combat', pageWidth, margin)

  const combatBoxW = 33
  const combatBoxH = 22
  const combatGap = (contentWidth - 5 * combatBoxW) / 4
  const combatStats: [string, string][] = [
    [String(character.armor_class), 'ARMOR CLASS'],
    [`${character.current_hp}/${character.max_hp}`, 'HIT POINTS'],
    [`${character.speed} ft`, 'SPEED'],
    [signedMod(character.initiative_bonus), 'INITIATIVE'],
    [`${character.hit_dice_remaining}/${character.hit_dice_total}`, 'HIT DICE'],
  ]

  combatStats.forEach(([value, label], i) => {
    const bx = margin + i * (combatBoxW + combatGap)
    drawStatBox(doc, bx, y, combatBoxW, combatBoxH, value, label, { goldBg: i === 0 })
  })

  y += combatBoxH + 6

  // ─── Saving Throws ───
  y = drawSectionHeader(doc, y, 'Saving Throws', pageWidth, margin)

  const saveAbilities: [string, string, number][] = [
    ['STR', 'strength', character.strength],
    ['DEX', 'dexterity', character.dexterity],
    ['CON', 'constitution', character.constitution],
    ['INT', 'intelligence', character.intelligence],
    ['WIS', 'wisdom', character.wisdom],
    ['CHA', 'charisma', character.charisma],
  ]

  const saveColW = contentWidth / 6
  saveAbilities.forEach(([label, key, score], i) => {
    const sx = margin + i * saveColW
    const isProficient = character.proficiencies.savingThrows.includes(key)
    const mod = abilityModifier(score) + (isProficient ? pb : 0)

    drawProfDot(doc, sx + 2, y + 0.5, isProficient)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.text(label, sx + 5.5, y + 1.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MEDIUM_TEXT)
    doc.text(signedMod(mod), sx + 16, y + 1.5)
  })

  y += 8

  // ─── Skills ───
  y = drawSectionHeader(doc, y, 'Skills', pageWidth, margin)

  const halfCount = Math.ceil(SKILLS.length / 2)
  const skillColW = contentWidth / 2
  const skillLineH = 4.2

  SKILLS.forEach((skill, i) => {
    const col = i < halfCount ? 0 : 1
    const row = i < halfCount ? i : i - halfCount
    const sx = margin + col * skillColW
    const sy = y + row * skillLineH

    const abilityScore = character[skill.ability as keyof Character] as number
    const isProficient = character.proficiencies.skills.some(
      (s) => s.toLowerCase() === skill.name.toLowerCase(),
    )
    const mod = abilityModifier(abilityScore) + (isProficient ? pb : 0)

    drawProfDot(doc, sx + 2, sy + 0.5, isProficient)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_TEXT)
    doc.text(skill.name, sx + 5.5, sy + 1.5)

    doc.setTextColor(...MEDIUM_TEXT)
    doc.text(signedMod(mod), sx + skillColW - 8, sy + 1.5, { align: 'right' })
  })

  y += halfCount * skillLineH + 4

  // ─── Proficiencies ───
  checkPageBreak(30)
  y = drawSectionHeader(doc, y, 'Proficiencies', pageWidth, margin)

  const profSections = [
    { label: 'Languages', items: character.proficiencies.languages },
    { label: 'Armor', items: character.proficiencies.armor },
    { label: 'Weapons', items: character.proficiencies.weapons },
    { label: 'Tools', items: character.proficiencies.tools },
  ]

  for (const section of profSections) {
    if (section.items.length > 0) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GOLD)
      doc.text(`${section.label}: `, margin, y)
      const labelW = doc.getTextWidth(`${section.label}: `)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_TEXT)
      const text = section.items.join(', ')
      const lines = doc.splitTextToSize(text, contentWidth - labelW)
      doc.text(lines[0], margin + labelW, y)
      if (lines.length > 1) {
        for (let li = 1; li < lines.length; li++) {
          y += 3.5
          doc.text(lines[li], margin + 2, y)
        }
      }
      y += 4.5
    }
  }

  // Bottom decorative line
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
  doc.setFontSize(6)
  doc.setTextColor(...MEDIUM_TEXT)
  doc.text('Squire Character Sheet', pageWidth / 2, pageHeight - 7, { align: 'center' })

  // ─────────────────────────────────────
  // PAGE 2: Features & Personality
  // ─────────────────────────────────────
  addPage()

  // Top decorative line
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.2)
  doc.line(margin, 10, pageWidth - margin, 10)
  doc.setLineWidth(0.3)
  doc.line(margin, 11.5, pageWidth - margin, 11.5)
  y = 16

  // ─── Features ───
  y = drawSectionHeader(doc, y, 'Features & Traits', pageWidth, margin)

  if (character.features.length > 0) {
    for (const feat of character.features) {
      const descLines = doc.splitTextToSize(feat.description, contentWidth - 8)
      const cardH = 10 + descLines.length * 3.5
      checkPageBreak(cardH + 4)

      drawBox(doc, margin, y, contentWidth, cardH, { radius: 2.5 })

      // Feature name
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK_TEXT)
      doc.text(feat.name, margin + 4, y + 5)

      // Source badge
      if (feat.source) {
        const nameW = doc.getTextWidth(feat.name)
        const badgeX = margin + 4 + nameW + 3
        const badgeW = doc.getTextWidth(feat.source) + 4
        doc.setFillColor(230, 220, 195)
        doc.setDrawColor(210, 195, 160)
        doc.setLineWidth(0.2)
        roundedRect(doc, badgeX, y + 1.5, badgeW + 2, 5, 1.5, 'FD')
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MEDIUM_TEXT)
        doc.text(feat.source, badgeX + 2, y + 5)
      }

      // Uses badge
      if (feat.usesMax != null) {
        const usesText = `${feat.usesRemaining ?? feat.usesMax}/${feat.usesMax}`
        const usesW = doc.getTextWidth(usesText) + 4
        doc.setFillColor(...GOLD)
        roundedRect(doc, margin + contentWidth - usesW - 6, y + 1.5, usesW + 2, 5, 1.5, 'F')
        doc.setFontSize(6)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...WHITE)
        doc.text(usesText, margin + contentWidth - 5 - usesW / 2, y + 5, { align: 'center' })
      }

      // Description
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_TEXT)
      doc.text(descLines, margin + 4, y + 10)

      y += cardH + 3
    }
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MEDIUM_TEXT)
    doc.text('No features or traits.', margin, y)
    y += 8
  }

  // ─── Personality 2x2 grid ───
  checkPageBreak(50)
  y = drawSectionHeader(doc, y, 'Personality', pageWidth, margin)

  const personalityFields = [
    { label: 'Traits', value: character.personality_traits },
    { label: 'Ideals', value: character.ideals },
    { label: 'Bonds', value: character.bonds },
    { label: 'Flaws', value: character.flaws },
  ]

  const pBoxW = (contentWidth - 4) / 2
  const pBoxH = 28

  personalityFields.forEach((field, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const bx = margin + col * (pBoxW + 4)
    const by = y + row * (pBoxH + 3)

    drawBox(doc, bx, by, pBoxW, pBoxH, { radius: 2.5 })

    // Header
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GOLD)
    doc.text(field.label.toUpperCase(), bx + 4, by + 5)

    // Content
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_TEXT)
    if (field.value) {
      const lines = doc.splitTextToSize(field.value, pBoxW - 8)
      doc.text(lines.slice(0, 5), bx + 4, by + 10)
    }
  })

  y += 2 * (pBoxH + 3) + 4

  // ─── Backstory ───
  if (character.backstory) {
    checkPageBreak(20)
    y = drawSectionHeader(doc, y, 'Backstory', pageWidth, margin)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const bsLines = doc.splitTextToSize(character.backstory, contentWidth - 8)
    const bsH = Math.min(bsLines.length, 20) * 3.5 + 6
    drawBox(doc, margin, y, contentWidth, bsH, { radius: 2.5 })
    doc.setTextColor(...DARK_TEXT)
    doc.text(bsLines.slice(0, 20), margin + 4, y + 5)
    y += bsH + 4
  }

  // ─── Currency Row ───
  checkPageBreak(16)
  y = drawSectionHeader(doc, y, 'Currency', pageWidth, margin)

  const coins: [string, number][] = [
    ['CP', character.copper],
    ['SP', character.silver],
    ['EP', character.electrum],
    ['GP', character.gold],
    ['PP', character.platinum],
  ]

  const coinBoxW = 28
  const coinBoxH = 16
  const coinGap = (contentWidth - 5 * coinBoxW) / 4

  coins.forEach(([label, amount], i) => {
    const cx = margin + i * (coinBoxW + coinGap)

    // Coin-like styling
    drawBox(doc, cx, y, coinBoxW, coinBoxH, {
      fill: label === 'GP' ? [255, 248, 220] : LIGHT_GOLD,
      border: GOLD,
      radius: 3,
    })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.text(`${amount}`, cx + coinBoxW / 2, y + 8, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GOLD)
    doc.text(label, cx + coinBoxW / 2, y + 13, { align: 'center' })
  })

  // Page 2 footer
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
  doc.setFontSize(6)
  doc.setTextColor(...MEDIUM_TEXT)
  doc.text('Squire Character Sheet', pageWidth / 2, pageHeight - 7, { align: 'center' })

  // ─────────────────────────────────────
  // PAGE 3: Spellcasting
  // ─────────────────────────────────────
  if (spells.length > 0 || spellSlots.length > 0) {
    addPage()

    // Top decorative line
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(1.2)
    doc.line(margin, 10, pageWidth - margin, 10)
    doc.setLineWidth(0.3)
    doc.line(margin, 11.5, pageWidth - margin, 11.5)
    y = 16

    // Spell header bar
    drawBox(doc, margin, y, contentWidth, 12, { fill: GOLD, border: GOLD, radius: 2.5 })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)

    const spellHeaderItems: string[] = []
    if (character.spellcasting_ability) spellHeaderItems.push(`Ability: ${character.spellcasting_ability}`)
    if (character.spell_save_dc != null) spellHeaderItems.push(`Save DC: ${character.spell_save_dc}`)
    if (character.spell_attack_bonus != null) spellHeaderItems.push(`Attack Bonus: ${signedMod(character.spell_attack_bonus)}`)

    if (spellHeaderItems.length > 0) {
      const headerText = spellHeaderItems.join('     ')
      doc.text(headerText, margin + contentWidth / 2, y + 7.5, { align: 'center' })
    } else {
      doc.text('SPELLCASTING', margin + contentWidth / 2, y + 7.5, { align: 'center' })
    }

    y += 16

    // Spell slots
    if (spellSlots.length > 0) {
      y = drawSectionHeader(doc, y, 'Spell Slots', pageWidth, margin)

      const sortedSlots = [...spellSlots].sort((a, b) => a.slot_level - b.slot_level)

      for (const slot of sortedSlots) {
        const slotX = margin
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK_TEXT)
        doc.text(`Level ${slot.slot_level}:`, slotX, y + 1.5)

        const circleStartX = slotX + 22
        const circleR = 2.5
        const circleGap = 7

        const available = slot.total - slot.expended
        for (let ci = 0; ci < slot.total; ci++) {
          const cx = circleStartX + ci * circleGap
          doc.setDrawColor(...GOLD)
          doc.setLineWidth(0.4)
          if (ci < available) {
            doc.setFillColor(...GOLD)
            doc.circle(cx, y + 0.5, circleR, 'FD')
          } else {
            doc.setFillColor(...WHITE)
            doc.circle(cx, y + 0.5, circleR, 'FD')
          }
        }

        y += 7
      }

      y += 3
    }

    // Spell list by level
    const spellsByLevel = new Map<number, Spell[]>()
    for (const spell of spells) {
      const list = spellsByLevel.get(spell.level) ?? []
      list.push(spell)
      spellsByLevel.set(spell.level, list)
    }

    for (const [level, levelSpells] of [...spellsByLevel.entries()].sort((a, b) => a[0] - b[0])) {
      checkPageBreak(12)

      // Level header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GOLD)
      doc.text(level === 0 ? 'Cantrips' : `Level ${level}`, margin, y)
      y += 5

      for (const spell of levelSpells) {
        checkPageBreak(6)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK_TEXT)
        doc.text(spell.name, margin + 3, y)

        // School tag
        const nameW = doc.getTextWidth(spell.name)
        const tagX = margin + 3 + nameW + 3
        if (spell.school) {
          doc.setFontSize(6)
          doc.setFillColor(230, 220, 195)
          doc.setDrawColor(210, 195, 160)
          doc.setLineWidth(0.2)
          const tagW = doc.getTextWidth(spell.school) + 4
          roundedRect(doc, tagX, y - 3, tagW, 4, 1, 'FD')
          doc.setTextColor(...MEDIUM_TEXT)
          doc.text(spell.school, tagX + 2, y - 0.3)
        }

        // Inline badges for C, R, Prepared
        let badgeX = tagX + (spell.school ? doc.getTextWidth(spell.school) + 8 : 0)
        doc.setFontSize(6)

        if (spell.is_concentration) {
          doc.setFillColor(200, 170, 100)
          roundedRect(doc, badgeX, y - 3, 6, 4, 1, 'F')
          doc.setTextColor(...WHITE)
          doc.setFont('helvetica', 'bold')
          doc.text('C', badgeX + 3, y - 0.3, { align: 'center' })
          badgeX += 8
        }

        if (spell.is_ritual) {
          doc.setFillColor(160, 140, 100)
          roundedRect(doc, badgeX, y - 3, 6, 4, 1, 'F')
          doc.setTextColor(...WHITE)
          doc.setFont('helvetica', 'bold')
          doc.text('R', badgeX + 3, y - 0.3, { align: 'center' })
          badgeX += 8
        }

        if (spell.is_prepared) {
          drawProfDot(doc, badgeX + 2, y - 1, true)
        }

        y += 4.5
      }

      y += 3
    }

    // Page 3 footer
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
    doc.setFontSize(6)
    doc.setTextColor(...MEDIUM_TEXT)
    doc.text('Squire Character Sheet', pageWidth / 2, pageHeight - 7, { align: 'center' })
  }

  // ─────────────────────────────────────
  // PAGE 4: Inventory
  // ─────────────────────────────────────
  if (items.length > 0) {
    addPage()

    // Top decorative line
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(1.2)
    doc.line(margin, 10, pageWidth - margin, 10)
    doc.setLineWidth(0.3)
    doc.line(margin, 11.5, pageWidth - margin, 11.5)
    y = 16

    y = drawSectionHeader(doc, y, 'Inventory', pageWidth, margin)

    // Currency row at top
    const invCoins: [string, number][] = [
      ['CP', character.copper],
      ['SP', character.silver],
      ['EP', character.electrum],
      ['GP', character.gold],
      ['PP', character.platinum],
    ]

    const invCoinW = 20
    const invCoinH = 12
    const invCoinGap = 4

    invCoins.forEach(([label, amount], i) => {
      const cx = margin + i * (invCoinW + invCoinGap)
      drawBox(doc, cx, y, invCoinW, invCoinH, { radius: 2 })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK_TEXT)
      doc.text(`${amount}`, cx + invCoinW / 2, y + 6, { align: 'center' })

      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GOLD)
      doc.text(label, cx + invCoinW / 2, y + 10, { align: 'center' })
    })

    y += invCoinH + 6

    // Equipment table header
    const colName = margin
    const colQty = margin + 100
    const colWt = margin + 118
    const colStatus = margin + 136

    // Header row
    drawBox(doc, margin, y, contentWidth, 7, { fill: GOLD, border: GOLD, radius: 1.5 })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text('NAME', colName + 3, y + 5)
    doc.text('QTY', colQty, y + 5)
    doc.text('WEIGHT', colWt, y + 5)
    doc.text('STATUS', colStatus, y + 5)
    y += 8

    // Item rows
    items.forEach((item, i) => {
      checkPageBreak(6)

      // Alternating row colors
      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT_GOLD)
        doc.rect(margin, y - 3.5, contentWidth, 5.5, 'F')
      }

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_TEXT)

      const name = item.name.length > 40 ? item.name.slice(0, 38) + '...' : item.name
      doc.text(name, colName + 3, y)

      doc.setTextColor(...MEDIUM_TEXT)
      doc.text(`${item.quantity}`, colQty, y)
      doc.text(`${item.weight} lb`, colWt, y)

      const statusParts: string[] = []
      if (item.is_equipped) statusParts.push('Equipped')
      if (item.is_attuned) statusParts.push('Attuned')
      const status = statusParts.length > 0 ? statusParts.join(', ') : '-'
      doc.text(status, colStatus, y)

      y += 5.5
    })

    // Total weight
    const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0)
    y += 3
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.4)
    doc.line(margin, y - 2, pageWidth - margin, y - 2)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.text(`Total Weight: ${totalWeight} lb`, margin + 3, y + 2)

    // Page 4 footer
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
    doc.setFontSize(6)
    doc.setTextColor(...MEDIUM_TEXT)
    doc.text('Squire Character Sheet', pageWidth / 2, pageHeight - 7, { align: 'center' })
  }

  // Save
  const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_character_sheet.pdf`
  doc.save(filename)
}
