import { useState, useEffect } from 'react'
import { ArrowUp, Heart, Sparkles, Star, Loader2, Dices, ChevronRight, Search, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Divider } from '@/components/ui/Divider'
import { ABILITY_SCORES, ABILITY_ABBREVIATIONS, type AbilityScore } from '@/lib/constants'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/calculations'
import { computeHpBonusPerLevel } from '@/lib/featuresEngine'
import {
  getClassLevel,
  getFeatureDetail,
  getNewSpellSlots,
  getSpellsByClass,
  getSpellDetail,
  formatSpellComponents,
  formatSpellDescription,
  CLASS_HIT_DICE,
  type SRDClassLevel,
  type SRDFeatureDetail,
  type SRDSpellSummary,
} from '@/lib/dnd5e'
import { getSpellSelectionRules } from '@/lib/spellcastingRules'
import { getFeatsAvailableAtLevel, meetsPrerequisites, FEAT_FIXED_SPELLS, FEAT_PROFICIENCY_GRANTS, FEAT_RESOURCES, FEAT_FLAT_HP, type FeatData } from '@/lib/featData'
import { SKILLS } from '@/lib/constants'
import { getClassChoiceData } from '@/lib/phbData'
import { getClassLevels, isMulticlassed, updateMulticlassData, formatClassDisplay, buildHitDiceTotal, MULTICLASS_PROFICIENCIES, type ClassLevel } from '@/lib/multiclass'
import { CLASSES } from '@/lib/constants'
import { WeaponMasteryStep } from '@/components/create/WeaponMasteryStep'
import { FeatExtrasUI } from '@/components/create/FeatExtrasUI'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { Character, CharacterUpdate, Feature, SpellSlot } from '@/lib/types/database'

interface LevelUpWizardProps {
  open: boolean
  onClose: () => void
  character: Character
  currentSpellSlots: SpellSlot[]
  existingSpells?: { name: string; level: number }[]
  onLevelUp: (characterUpdates: CharacterUpdate, newSpellSlots: { level: number; total: number }[], newSpells?: { name: string; level: number; school: string; casting_time: string; range: string; components: string; duration: string; is_concentration: boolean; is_ritual: boolean; description: string; higher_levels: string; source: string }[]) => Promise<void> | void
}

type Step = 'overview' | 'class-choice' | 'hp' | 'features' | 'subclass' | 'asi' | 'weapon-mastery' | 'dragon-rider' | 'new-spells' | 'spells' | 'confirm'

export function LevelUpWizard({ open, onClose, character, currentSpellSlots, existingSpells = [], onLevelUp }: LevelUpWizardProps) {
  const newLevel = character.level + 1
  const existingClassLevels = getClassLevels(character)
  const isAlreadyMulticlassed = isMulticlassed(character)

  // Which class is gaining the level — defaults to current/primary class
  const [levelUpClass, setLevelUpClass] = useState<string>(character.class)
  const [showMulticlassOption, setShowMulticlassOption] = useState(false)
  const [newMulticlass, setNewMulticlass] = useState<string | null>(null)

  const effectiveClass = newMulticlass ?? levelUpClass
  const classIndex = effectiveClass.toLowerCase()
  const hitDie = CLASS_HIT_DICE[classIndex] || 8

  const [step, setStep] = useState<Step>('overview')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [levelData, setLevelData] = useState<SRDClassLevel | null>(null)
  const [prevLevelData, setPrevLevelData] = useState<SRDClassLevel | null>(null)
  const [featureDetails, setFeatureDetails] = useState<SRDFeatureDetail[]>([])

  // Choices
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average')
  const [hpRoll, setHpRoll] = useState<number | null>(null)
  const [asiChoices, setAsiChoices] = useState<Record<string, number>>({})
  const [asiMode, setAsiMode] = useState<'asi' | 'feat'>('asi')
  const [selectedFeat, setSelectedFeat] = useState<FeatData | null>(null)
  const [featAbility, setFeatAbility] = useState<string | null>(null)
  const [featSearch, setFeatSearch] = useState('')
  const [featExtras, setFeatExtras] = useState<Record<string, unknown>>({})
  const [weaponMasteries, setWeaponMasteries] = useState<string[]>(character.proficiencies.weaponMasteries ?? [])

  // Subclass selection (for classes that gain subclass at this level)
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(character.subclass)

  // Spell selection on level-up
  const [newSpellPicks, setNewSpellPicks] = useState<string[]>([])
  const [availableSpellList, setAvailableSpellList] = useState<SRDSpellSummary[]>([])
  const [spellSearchQuery, setSpellSearchQuery] = useState('')

  // Dragon-Rider custom features
  const [drPatronsGiftName, setDrPatronsGiftName] = useState('')
  const [drPatronsGiftDesc, setDrPatronsGiftDesc] = useState('')
  const [drSignatureName, setDrSignatureName] = useState('')
  const [drSignatureDesc, setDrSignatureDesc] = useState('')

  // Fetch level data
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setStep('overview')
    setHpRoll(null)
    setAsiChoices({})
    setAsiMode('asi')
    setSelectedFeat(null)
    setFeatAbility(null)
    setFeatSearch('')
    setFeatExtras({})
    setNewSpellPicks([])
    setSpellSearchQuery('')
    setLevelUpClass(character.class)
    setNewMulticlass(null)
    setShowMulticlassOption(false)
    setDrPatronsGiftName('')
    setDrPatronsGiftDesc('')
    setDrSignatureName('')
    setDrSignatureDesc('')

    Promise.all([
      getClassLevel(classIndex, newLevel).catch(() => null),
      getClassLevel(classIndex, character.level).catch(() => null),
    ])
      .then(async ([newData, prevData]) => {
        if (!newData) {
          console.warn(`No class level data found for ${classIndex} level ${newLevel}`)
          setLoading(false)
          return
        }
        setLevelData(newData)
        setPrevLevelData(prevData)

        // Fetch feature details
        if (newData.features.length > 0) {
          const details = await Promise.all(
            newData.features.map((f) => getFeatureDetail(f.index).catch(() => null))
          )
          setFeatureDetails(details.filter((d): d is SRDFeatureDetail => d !== null))
        } else {
          setFeatureDetails([])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Load class spell list for spell selection
    if (character.spellcasting_ability) {
      getSpellsByClass(classIndex).then(setAvailableSpellList).catch(() => {})
    }
  }, [open, classIndex, newLevel, character.level])

  const conMod = abilityModifier(character.constitution)
  const avgHp = Math.floor(hitDie / 2) + 1
  const featureHpPerLevel = computeHpBonusPerLevel(character.features ?? [])
  const hpGain = (hpMethod === 'average' ? avgHp + conMod : (hpRoll || avgHp) + conMod) + featureHpPerLevel

  const hasASI = levelData?.features.some((f) => f.name.includes('Ability Score Improvement')) ?? false
  const hasSubclassFeature = levelData?.features.some((f) => f.name.toLowerCase().includes('subclass feature')) ?? false
  const nonASIFeatures = featureDetails.filter((f) =>
    !f.name.includes('Ability Score Improvement') && !f.name.toLowerCase().includes('subclass feature')
  )

  const newSlots = getNewSpellSlots(prevLevelData?.spellcasting, levelData?.spellcasting)
  const hasSpellChanges = newSlots.some((s) => s.gained > 0)

  // Determine how many new spells the player gains at this level
  const scAbility = character.spellcasting_ability as AbilityScore | null
  const scMod = scAbility ? abilityModifier(character[scAbility] as number) : 0
  const prevSpellRules = scAbility ? getSpellSelectionRules(character.class, undefined, scMod, character.level) : null
  const newSpellRules = scAbility ? getSpellSelectionRules(character.class, undefined, scMod, newLevel) : null

  const isKnownCaster = newSpellRules && newSpellRules.spellsToSelect > 0 && !newSpellRules.isPreparedCaster
  const prevSpellCount = prevSpellRules?.spellsToSelect ?? 0
  const newSpellCount = newSpellRules?.spellsToSelect ?? 0
  const spellsToGain = Math.max(0, newSpellCount - prevSpellCount)
  const newMaxSpellLevel = newSpellRules?.maxSpellLevel ?? 0
  const hasNewSpellPicks = isKnownCaster && spellsToGain > 0

  // Filter spell list: only show spells at accessible levels that the character doesn't already know
  const existingSpellNames = new Set(existingSpells.map(s => s.name.toLowerCase()))
  const pickableSpells = availableSpellList
    .filter(s => s.level > 0 && s.level <= newMaxSpellLevel)
    .filter(s => !existingSpellNames.has(s.name.toLowerCase()))
    .filter(s => !spellSearchQuery || s.name.toLowerCase().includes(spellSearchQuery.toLowerCase()))

  const totalASIPoints = Object.values(asiChoices).reduce((a, b) => a + b, 0)

  function rollHitDie() {
    const roll = Math.floor(Math.random() * hitDie) + 1
    setHpRoll(roll)
  }

  function adjustASI(ability: string, delta: number) {
    setAsiChoices((prev) => {
      const current = prev[ability] || 0
      const newVal = current + delta
      if (newVal < 0) return prev
      if (newVal > 2) return prev
      const newChoices = { ...prev, [ability]: newVal }
      const total = Object.values(newChoices).reduce((a, b) => a + b, 0)
      if (total > 2) return prev
      return newChoices
    })
  }

  async function handleConfirm() {
    const pendingFeatSpells: { slug: string; source: string }[] = []
    // Build updated class levels
    const isNewMulticlass = !!newMulticlass
    let updatedClassLevels: ClassLevel[]

    if (isNewMulticlass) {
      updatedClassLevels = [
        ...existingClassLevels,
        { class: newMulticlass, level: 1, subclass: null },
      ]
    } else if (isAlreadyMulticlassed) {
      updatedClassLevels = existingClassLevels.map(cl =>
        cl.class === effectiveClass ? { ...cl, level: cl.level + 1 } : cl
      )
    } else {
      // Single class, just increment
      updatedClassLevels = [{ class: character.class, level: newLevel, subclass: character.subclass }]
    }

    const updates: CharacterUpdate = {
      level: newLevel,
      max_hp: character.max_hp + Math.max(1, hpGain),
      current_hp: character.current_hp + Math.max(1, hpGain),
      hit_dice_total: (isNewMulticlass || isAlreadyMulticlassed) ? buildHitDiceTotal(updatedClassLevels) : `${newLevel}d${hitDie}`,
      hit_dice_remaining: newLevel,
    }

    // Update class display and multiclass data
    if (isNewMulticlass || isAlreadyMulticlassed) {
      updates.class = formatClassDisplay(updatedClassLevels)
      updates.appearance = updateMulticlassData(character.appearance, { classLevels: updatedClassLevels })

      // Add multiclass proficiencies for new class
      if (isNewMulticlass) {
        const mcProfs = MULTICLASS_PROFICIENCIES[newMulticlass.toLowerCase()]
        if (mcProfs) {
          const currentProfs = character.proficiencies
          updates.proficiencies = {
            ...currentProfs,
            armor: [...new Set([...currentProfs.armor, ...mcProfs.armor])],
            weapons: [...new Set([...currentProfs.weapons, ...mcProfs.weapons])],
          }
        }
      }
    }

    // Apply subclass selection
    if (needsSubclassChoice && selectedSubclass) {
      if (isNewMulticlass || isAlreadyMulticlassed) {
        // Update subclass in the classLevels array
        updatedClassLevels = updatedClassLevels.map(cl =>
          cl.class === effectiveClass ? { ...cl, subclass: selectedSubclass } : cl
        )
        updates.appearance = updateMulticlassData(character.appearance, { classLevels: updatedClassLevels })
      } else {
        updates.subclass = selectedSubclass
      }
    }

    // Apply ASI
    if (hasASI && asiMode === 'asi') {
      for (const [ability, bonus] of Object.entries(asiChoices)) {
        if (bonus > 0) {
          const currentScore = character[ability as keyof Character] as number
          (updates as Record<string, unknown>)[ability] = Math.min(20, currentScore + bonus)
        }
      }
    }

    // Update spell save DC and attack bonus if proficiency bonus changed
    const profDiff = proficiencyBonus(newLevel) - proficiencyBonus(character.level)
    if (profDiff !== 0 && character.spell_save_dc) {
      updates.spell_save_dc = character.spell_save_dc + profDiff
      updates.spell_attack_bonus = (character.spell_attack_bonus ?? 0) + profDiff
    }

    // Add new features
    const newFeatures: Feature[] = nonASIFeatures.map((f) => ({
      name: f.name,
      description: f.desc.join('\n\n'),
      source: character.class,
    }))

    // Add selected feat and apply its ability score increase
    if (hasASI && asiMode === 'feat' && selectedFeat) {
      let featDesc = selectedFeat.description
      // Append chosen extras to description
      const extras = featExtras as Record<string, unknown>
      const notes: string[] = []
      if (extras.skill) notes.push(`Chosen skill: ${extras.skill}`)
      if (extras.expertise) notes.push(`Expertise: ${extras.expertise}`)
      if ((extras.skills as string[] | undefined)?.length) notes.push(`Chosen: ${(extras.skills as string[]).join(', ')}`)
      if (extras.savingThrow) notes.push(`Saving throw: ${extras.savingThrow}`)
      if (extras.damageType) notes.push(`Chosen damage type: ${extras.damageType}`)
      if ((extras.damageTypes as string[] | undefined)?.length) notes.push(`Resistances: ${(extras.damageTypes as string[]).join(', ')}`)
      if (extras.spellPick) notes.push(`Chosen spell: ${extras.spellPick}`)
      if ((extras.spellPicks as string[] | undefined)?.length) notes.push(`Ritual spells: ${(extras.spellPicks as string[]).join(', ')}`)
      if ((extras.tools as string[] | undefined)?.length) notes.push(`Tools: ${(extras.tools as string[]).join(', ')}`)
      if ((extras.instruments as string[] | undefined)?.length) notes.push(`Instruments: ${(extras.instruments as string[]).join(', ')}`)
      if (extras.miAbility) notes.push(`Spellcasting ability: ${extras.miAbility}`)
      if (notes.length > 0) featDesc += '\n\n' + notes.join('. ') + '.'

      // Resource tracking for feats
      const resource = FEAT_RESOURCES[selectedFeat.name]
      const featFeature: Feature = { name: selectedFeat.name, description: featDesc, source: 'Feat' }
      if (resource) {
        const maxUses = resource.usesMax === 'proficiency' ? proficiencyBonus(newLevel) : resource.usesMax
        featFeature.usesMax = maxUses
        featFeature.usesRemaining = maxUses
        featFeature.rechargeOn = resource.rechargeOn
      }
      newFeatures.push(featFeature)

      // Apply feat's +1 ability score increase
      // Resilient: the ability score increase is linked to the saving throw choice
      const effectiveFeatAbility = selectedFeat.name === 'Resilient' && extras.savingThrow
        ? extras.savingThrow as string
        : featAbility
      if (selectedFeat.abilityScoreIncrease && effectiveFeatAbility) {
        const currentScore = character[effectiveFeatAbility as keyof Character] as number
        const maxScore = selectedFeat.maxAbilityScore ?? 20
        ;(updates as Record<string, unknown>)[effectiveFeatAbility] = Math.min(maxScore, currentScore + 1)
      }

      // Apply feat proficiency changes
      const currentProfs = updates.proficiencies ?? { ...character.proficiencies }
      let profsChanged = false
      // Skill from feats — Keen Mind/Observant upgrade to expertise if already proficient
      if (extras.skill) {
        const skillLower = (extras.skill as string).toLowerCase()
        const isKeenMindOrObservant = selectedFeat.name === 'Keen Mind' || selectedFeat.name === 'Observant'
        if (isKeenMindOrObservant && currentProfs.skills.includes(skillLower)) {
          if (!currentProfs.expertise) currentProfs.expertise = []
          if (!currentProfs.expertise.includes(skillLower)) { currentProfs.expertise = [...currentProfs.expertise, skillLower]; profsChanged = true }
        } else if (!currentProfs.skills.includes(skillLower)) {
          currentProfs.skills = [...currentProfs.skills, skillLower]; profsChanged = true
        }
      }
      if (extras.expertise) {
        if (!currentProfs.expertise) currentProfs.expertise = []
        const expLower = (extras.expertise as string).toLowerCase()
        if (!currentProfs.expertise.includes(expLower)) { currentProfs.expertise = [...currentProfs.expertise, expLower]; profsChanged = true }
      }
      // Skilled feat: 3 skills/tools
      if ((extras.skills as string[] | undefined)?.length) {
        for (const pick of extras.skills as string[]) {
          const isSkill = SKILLS.some(s => s.name === pick)
          if (isSkill) {
            const lower = pick.toLowerCase()
            if (!currentProfs.skills.includes(lower)) { currentProfs.skills = [...currentProfs.skills, lower]; profsChanged = true }
          } else {
            if (!currentProfs.tools.includes(pick)) { currentProfs.tools = [...currentProfs.tools, pick]; profsChanged = true }
          }
        }
      }
      if (extras.savingThrow) {
        const stLower = (extras.savingThrow as string).toLowerCase()
        if (!currentProfs.savingThrows.includes(stLower)) { currentProfs.savingThrows = [...currentProfs.savingThrows, stLower]; profsChanged = true }
      }
      if ((extras.tools as string[] | undefined)?.length) {
        for (const t of extras.tools as string[]) {
          if (!currentProfs.tools.includes(t)) { currentProfs.tools = [...currentProfs.tools, t]; profsChanged = true }
        }
      }
      if ((extras.instruments as string[] | undefined)?.length) {
        for (const t of extras.instruments as string[]) {
          if (!currentProfs.tools.includes(t)) { currentProfs.tools = [...currentProfs.tools, t]; profsChanged = true }
        }
      }
      // Proficiency grants from feat name
      const grants = FEAT_PROFICIENCY_GRANTS[selectedFeat.name]
      if (grants) {
        if (grants.tools) grants.tools.forEach(t => { if (!currentProfs.tools.includes(t)) { currentProfs.tools = [...currentProfs.tools, t]; profsChanged = true } })
        if (grants.armor) grants.armor.forEach(a => { if (!currentProfs.armor.includes(a)) { currentProfs.armor = [...currentProfs.armor, a]; profsChanged = true } })
        if (grants.weapons) grants.weapons.forEach(w => { if (!currentProfs.weapons.includes(w)) { currentProfs.weapons = [...currentProfs.weapons, w]; profsChanged = true } })
        if (grants.allSkills) { SKILLS.forEach(s => { const lower = s.name.toLowerCase(); if (!currentProfs.skills.includes(lower)) { currentProfs.skills = [...currentProfs.skills, lower]; profsChanged = true } }) }
      }
      if (profsChanged) updates.proficiencies = currentProfs

      // Flat HP bonus from feats (e.g. Boon of Fortitude +40)
      const flatHp = FEAT_FLAT_HP[selectedFeat.name]
      if (flatHp) {
        updates.max_hp = (updates.max_hp ?? character.max_hp) + flatHp
        updates.current_hp = (updates.current_hp ?? character.current_hp) + flatHp
      }

      // Feat-granted spells
      const featSpellSlugs: { slug: string; source: string }[] = []
      if (FEAT_FIXED_SPELLS[selectedFeat.name]) {
        for (const slug of FEAT_FIXED_SPELLS[selectedFeat.name]) {
          featSpellSlugs.push({ slug, source: `Feat (${selectedFeat.name})` })
        }
      }
      if (extras.spellPick) featSpellSlugs.push({ slug: extras.spellPick as string, source: `Feat (${selectedFeat.name})` })
      if ((extras.spellPicks as string[] | undefined)?.length) {
        for (const slug of extras.spellPicks as string[]) {
          featSpellSlugs.push({ slug, source: `Feat (${selectedFeat.name})` })
        }
      }
      // Magic Initiate cantrips + spell
      if ((extras.miCantrips as string[] | undefined)?.length) {
        for (const slug of extras.miCantrips as string[]) {
          featSpellSlugs.push({ slug, source: `Feat (${selectedFeat.name})` })
        }
      }
      if (extras.miSpell) featSpellSlugs.push({ slug: extras.miSpell as string, source: `Feat (${selectedFeat.name})` })
      // Feat spell slugs will be resolved below alongside class spells
      for (const fss of featSpellSlugs) {
        pendingFeatSpells.push(fss)
      }
    }

    // Dragon-Rider: save Patron's Gift and Signature Weapon tier choices
    if (isDragonRider) {
      if (getsSignatureTier && (drSignatureName.trim() || drSignatureDesc.trim())) {
        newFeatures.push({
          name: drSignatureName.trim() || signatureFeatureKey,
          description: drSignatureDesc.trim(),
          source: 'Signature Weapon',
        })
      }
      if (getsPatronGift && (drPatronsGiftName.trim() || drPatronsGiftDesc.trim())) {
        newFeatures.push({
          name: drPatronsGiftName.trim() || patronGiftLabel,
          description: drPatronsGiftDesc.trim(),
          source: "Patron's Gift",
        })
      }

      // Update Dragon-Rider resource trackers max values
      const drFeatureNames = ['Wing Step Uses', "Hunter's Insight Uses", 'Dragonstrike Uses', 'Draconic Sync Uses']
      const base = updates.features ?? character.features
      const updatedBase = base.map(f => {
        if (drFeatureNames.includes(f.name) && f.usesMax != null) {
          // Resources reset to new max on level up
          return { ...f, usesRemaining: f.usesMax }
        }
        return f
      })
      if (updatedBase.some((f, i) => f !== (updates.features ?? character.features)[i])) {
        updates.features = updatedBase
      }
    }

    // Scale Monk Focus Points with level
    if (classIndex === 'monk') {
      // Support both old "Ki Points" name and new "Focus Points" name for existing characters
      const focusFeatureIdx = character.features.findIndex(f => f.name === 'Focus Points' || f.name === 'Ki Points')
      if (focusFeatureIdx >= 0) {
        const updatedFeatures = [...character.features]
        updatedFeatures[focusFeatureIdx] = {
          ...updatedFeatures[focusFeatureIdx],
          name: 'Focus Points',
          description: `You have ${newLevel} Focus Points. You can spend these to fuel features like Flurry of Blows, Patient Defense, and Step of the Wind. You regain all Focus Points on a Short or Long Rest.`,
          usesMax: newLevel,
          usesRemaining: newLevel,
        }
        updates.features = updatedFeatures
      } else if (newLevel >= 2) {
        newFeatures.push({
          name: 'Focus Points',
          description: `You have ${newLevel} Focus Points. You can spend these to fuel features like Flurry of Blows, Patient Defense, and Step of the Wind. You regain all Focus Points on a Short or Long Rest.`,
          source: 'Monk',
          usesMax: newLevel,
          usesRemaining: newLevel,
          rechargeOn: 'short_rest',
        })
      }
    }

    if (newFeatures.length > 0) {
      // Overwrite existing features with the same name (e.g., upgraded Wildshape)
      const base = updates.features ?? character.features
      const existingFiltered = base.filter(
        ef => !newFeatures.some(nf => nf.name === ef.name && nf.source === ef.source)
      )
      updates.features = [...existingFiltered, ...newFeatures]
    }

    // Update weapon masteries if changed
    if (weaponMasteries.length > 0) {
      updates.proficiencies = {
        ...character.proficiencies,
        weaponMasteries,
      }
    }

    // Spell slot updates
    const slotUpdates = newSlots
      .filter((s) => s.total > 0)
      .map((s) => ({ level: s.level, total: s.total }))

    // Fetch details for newly selected spells and feat-granted spells
    const allSpellRows: { name: string; level: number; school: string; casting_time: string; range: string; components: string; duration: string; is_concentration: boolean; is_ritual: boolean; description: string; higher_levels: string; source: string }[] = []

    // Class spells from level-up picks
    if (newSpellPicks.length > 0) {
      const spellDetails = await Promise.all(
        newSpellPicks.map(slug => getSpellDetail(slug).catch(() => null))
      )
      for (const spell of spellDetails) {
        if (!spell) continue
        allSpellRows.push({
          name: spell.name,
          level: spell.level,
          school: spell.school?.name ?? '',
          casting_time: spell.casting_time ?? '',
          range: spell.range ?? '',
          components: formatSpellComponents(spell.components, spell.material),
          duration: spell.duration ?? '',
          is_concentration: spell.concentration ?? false,
          is_ritual: spell.ritual ?? false,
          description: formatSpellDescription(spell.desc),
          higher_levels: spell.higher_level?.join('\n\n') ?? '',
          source: character.class,
        })
      }
    }

    // Feat-granted spells
    if (pendingFeatSpells.length > 0) {
      const featDetails = await Promise.all(
        pendingFeatSpells.map(({ slug, source }) =>
          getSpellDetail(slug).then(spell => ({ spell, source })).catch(() => null)
        )
      )
      for (const d of featDetails) {
        if (!d) continue
        allSpellRows.push({
          name: d.spell.name,
          level: d.spell.level,
          school: d.spell.school?.name ?? '',
          casting_time: d.spell.casting_time ?? '',
          range: d.spell.range ?? '',
          components: formatSpellComponents(d.spell.components, d.spell.material),
          duration: d.spell.duration ?? '',
          is_concentration: d.spell.concentration ?? false,
          is_ritual: d.spell.ritual ?? false,
          description: formatSpellDescription(d.spell.desc),
          higher_levels: d.spell.higher_level?.join('\n\n') ?? '',
          source: d.source,
        })
      }
    }

    setSaving(true)
    try {
      if (allSpellRows.length > 0) {
        await onLevelUp(updates, slotUpdates, allSpellRows)
      } else {
        await onLevelUp(updates, slotUpdates)
      }
      onClose()
    } catch (err) {
      console.error('Level-up failed:', err)
      setSaving(false)
    }
  }

  // Check if weapon mastery slots increased at this level
  const prevMasterySlots = typeof prevLevelData?.class_specific?.weaponMasteries === 'number' ? prevLevelData.class_specific.weaponMasteries : 0
  const newMasterySlots = typeof levelData?.class_specific?.weaponMasteries === 'number' ? levelData.class_specific.weaponMasteries : 0
  const gainedMasterySlots = newMasterySlots - prevMasterySlots

  // Dragon-Rider: check if this level grants Patron's Gift or Signature Weapon tier
  const isDragonRider = classIndex === 'dragon-rider'
  const patronGiftLevels = [5, 10, 15, 20]
  const signatureTierLevels = [5, 11, 17]
  const getsPatronGift = isDragonRider && patronGiftLevels.includes(newLevel)
  const getsSignatureTier = isDragonRider && signatureTierLevels.includes(newLevel)
  const hasDragonRiderStep = getsPatronGift || getsSignatureTier

  const patronGiftLabel = getsPatronGift
    ? newLevel === 20 ? "Patron's Gift (4th — Capstone)" : `Patron's Gift (${patronGiftLevels.indexOf(newLevel) + 1}${['st', 'nd', 'rd', 'th'][patronGiftLevels.indexOf(newLevel)]})`
    : ''
  const signatureTierLabel = getsSignatureTier
    ? newLevel === 5 ? 'Signature Awakens (1st Tier)' : newLevel === 11 ? 'Signature Deepens (2nd Tier)' : 'Signature Ascends (3rd Tier)'
    : ''
  const signatureFeatureKey = getsSignatureTier
    ? newLevel === 5 ? 'Signature Weapon — 1st Tier' : newLevel === 11 ? 'Signature Weapon — 2nd Tier' : 'Signature Weapon — 3rd Tier'
    : ''

  // Check if this level grants a subclass and the character doesn't have one yet
  const classChoiceData = getClassChoiceData(classIndex)
  const needsSubclassChoice = classChoiceData
    && newLevel >= classChoiceData.subclassLevel
    && !character.subclass

  const steps: Step[] = ['overview']
  if (showMulticlassOption || isAlreadyMulticlassed) steps.push('class-choice')
  steps.push('hp')
  if (nonASIFeatures.length > 0 || hasSubclassFeature) steps.push('features')
  if (needsSubclassChoice) steps.push('subclass')
  if (hasASI) steps.push('asi')
  if (gainedMasterySlots > 0) steps.push('weapon-mastery')
  if (hasDragonRiderStep) steps.push('dragon-rider')
  if (hasNewSpellPicks) steps.push('new-spells')
  if (hasSpellChanges) steps.push('spells')
  steps.push('confirm')

  const currentStepIndex = steps.indexOf(step)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoBack = currentStepIndex > 0

  function nextStep() {
    if (canGoNext) setStep(steps[currentStepIndex + 1])
  }
  function prevStep() {
    if (canGoBack) setStep(steps[currentStepIndex - 1])
  }

  if (newLevel > 20) {
    return (
      <Modal open={open} onClose={onClose} title="Level Up" size="md">
        <div className="text-center py-8">
          <p className="text-ink-700">Your character is already at the maximum level (20).</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={`Level Up to ${newLevel}`} size="md">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-gold-400" />
          <span className="ml-3 text-ink-500">Loading class data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i <= currentStepIndex ? 'bg-gold-400' : 'bg-parchment-300'
                  }`}
                />
                {i < steps.length - 1 && (
                  <div className={`w-6 h-0.5 ${i < currentStepIndex ? 'bg-gold-400' : 'bg-parchment-300'}`} />
                )}
              </div>
            ))}
          </div>

          {/* ─── Overview Step ─── */}
          {step === 'overview' && (
            <div className="space-y-4">
              <div className="text-center">
                <ArrowUp size={40} className="text-gold-400 mx-auto mb-2" />
                <h3 className="font-display text-xl text-ink-900">
                  {character.name} reaches Level {newLevel}!
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  {character.class}{character.subclass ? ` (${character.subclass})` : ''}
                </p>
              </div>

              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Hit Points Increase</span>
                    <span className="font-mono text-ink-900">1d{hitDie} + {conMod} CON</span>
                  </div>
                  {nonASIFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">New Features</span>
                      <span className="text-ink-900">{nonASIFeatures.map(f => f.name).join(', ')}</span>
                    </div>
                  )}
                  {needsSubclassChoice && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">{classChoiceData?.subclassLabel ?? 'Subclass'}</span>
                      <span className="text-ink-900">Choose at this level!</span>
                    </div>
                  )}
                  {hasSubclassFeature && character.subclass && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Subclass Feature</span>
                      <span className="text-ink-900">{character.subclass}</span>
                    </div>
                  )}
                  {hasASI && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Ability Score Improvement</span>
                      <span className="text-ink-900">+2 points or a Feat</span>
                    </div>
                  )}
                  {hasSpellChanges && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Spell Slot Changes</span>
                      <span className="text-ink-900">
                        {newSlots.filter(s => s.gained > 0).map(s => `+${s.gained} Lvl ${s.level}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {!showMulticlassOption && !isAlreadyMulticlassed && newLevel >= 2 && (
                <button
                  onClick={() => setShowMulticlassOption(true)}
                  className="w-full text-center text-xs text-ink-400 hover:text-gold-600 transition-colors cursor-pointer py-2"
                >
                  Want to multiclass? Take a level in a different class instead
                </button>
              )}
            </div>
          )}

          {/* ─── Class Choice Step (Multiclass) ─── */}
          {step === 'class-choice' && (
            <div className="space-y-4">
              <SectionHeader>Choose Class for Level {newLevel}</SectionHeader>
              <p className="text-sm text-ink-500">
                Which class do you want to take this level in?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Existing classes */}
                {existingClassLevels.map(cl => (
                  <button
                    key={cl.class}
                    onClick={() => { setLevelUpClass(cl.class); setNewMulticlass(null) }}
                    className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      effectiveClass === cl.class && !newMulticlass
                        ? 'border-gold-400 bg-gold-100/50'
                        : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900">{cl.class}</div>
                    <div className="text-xs text-ink-400">Level {cl.level} → {cl.level + 1}</div>
                  </button>
                ))}
                {/* New class option */}
                {CLASSES.filter(c => !existingClassLevels.some(cl => cl.class === c)).map(c => (
                  <button
                    key={c}
                    onClick={() => { setNewMulticlass(c); setLevelUpClass(c) }}
                    className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      newMulticlass === c
                        ? 'border-arcane-500 bg-arcane-400/10'
                        : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900">{c}</div>
                    <div className="text-xs text-ink-400">New class (Level 1)</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── HP Step ─── */}
          {step === 'hp' && (
            <div className="space-y-4">
              <SectionHeader>Hit Points</SectionHeader>

              <div className="flex gap-3">
                <button
                  onClick={() => setHpMethod('average')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    hpMethod === 'average' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <Heart size={20} className="mx-auto mb-1 text-heal" />
                  <div className="font-display text-sm uppercase">Average</div>
                  <div className="font-mono text-2xl text-ink-900 mt-1">{avgHp}</div>
                  <div className="text-xs text-ink-500">(½ d{hitDie} + 1)</div>
                </button>

                <button
                  onClick={() => { setHpMethod('roll'); if (!hpRoll) rollHitDie() }}
                  className={`flex-1 p-4 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    hpMethod === 'roll' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <Dices size={20} className="mx-auto mb-1 text-arcane-500" />
                  <div className="font-display text-sm uppercase">Roll</div>
                  {hpRoll !== null ? (
                    <div className="font-mono text-2xl text-ink-900 mt-1">{hpRoll}</div>
                  ) : (
                    <div className="font-mono text-2xl text-ink-300 mt-1">?</div>
                  )}
                  <div className="text-xs text-ink-500">(1d{hitDie})</div>
                </button>
              </div>

              {hpMethod === 'roll' && (
                <Button variant="secondary" size="sm" onClick={rollHitDie} className="w-full">
                  <Dices size={14} className="mr-1" /> Re-roll
                </Button>
              )}

              <Card>
                <div className="text-center">
                  <div className="text-xs font-display uppercase text-ink-500">Total HP Gain</div>
                  <div className="font-mono text-3xl text-heal">
                    +{Math.max(1, hpGain)}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">
                    ({hpMethod === 'average' ? avgHp : (hpRoll || '?')} + {conMod} CON mod{hpGain < 1 ? ', minimum 1' : ''})
                  </div>
                  <div className="text-sm text-ink-700 mt-2">
                    {character.max_hp} → <span className="font-bold">{character.max_hp + Math.max(1, hpGain)}</span> max HP
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ─── Features Step ─── */}
          {step === 'features' && (
            <div className="space-y-4">
              <SectionHeader>New Features</SectionHeader>
              {hasSubclassFeature && character.subclass && (
                <Card className="bg-arcane-400/5 border-arcane-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-arcane-500" />
                    <h4 className="font-display text-base text-ink-900">Subclass Feature</h4>
                    <Badge variant="arcane">{character.subclass}</Badge>
                  </div>
                  <p className="text-sm text-ink-600">
                    Your {character.subclass} subclass grants new abilities at this level. Check your subclass description on the Features & Feats tab for details.
                  </p>
                </Card>
              )}
              {nonASIFeatures.map((feature) => (
                <Card key={feature.index}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-gold-400" />
                    <h4 className="font-display text-base text-ink-900">{feature.name}</h4>
                    <Badge variant="gold">{character.class}</Badge>
                  </div>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">{feature.desc.join('\n\n')}</p>
                </Card>
              ))}
            </div>
          )}

          {/* ─── Subclass Step ─── */}
          {step === 'subclass' && classChoiceData && (
            <div className="space-y-4">
              <SectionHeader>Choose Your {classChoiceData.subclassLabel}</SectionHeader>
              <p className="text-sm text-ink-500">
                At level {classChoiceData.subclassLevel}, you choose your {classChoiceData.subclassLabel.toLowerCase()}. This defines how you and your abilities develop.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classChoiceData.subclasses.map(sub => (
                  <button
                    key={sub.index}
                    onClick={() => setSelectedSubclass(sub.name)}
                    className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      selectedSubclass === sub.name
                        ? 'border-arcane-500 bg-arcane-400/10 shadow-md'
                        : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900 mb-1">{sub.name}</div>
                    <p className="text-xs text-ink-500">{sub.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── ASI Step ─── */}
          {step === 'asi' && (
            <div className="space-y-4">
              <SectionHeader>Ability Score Improvement</SectionHeader>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => { setAsiMode('asi'); setAsiChoices({}) }}
                  className={`flex-1 p-3 rounded-lg border-2 text-center text-sm cursor-pointer transition-colors ${
                    asiMode === 'asi' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <Star size={18} className="mx-auto mb-1 text-gold-500" />
                  <div className="font-display uppercase">Ability Scores</div>
                  <div className="text-xs text-ink-500">+2 to one or +1 to two</div>
                </button>
                <button
                  onClick={() => { setAsiMode('feat'); setAsiChoices({}) }}
                  className={`flex-1 p-3 rounded-lg border-2 text-center text-sm cursor-pointer transition-colors ${
                    asiMode === 'feat' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <Sparkles size={18} className="mx-auto mb-1 text-arcane-500" />
                  <div className="font-display uppercase">Feat</div>
                  <div className="text-xs text-ink-500">Choose a feat (add manually)</div>
                </button>
              </div>

              {asiMode === 'asi' && (
                <>
                  <div className="text-sm text-ink-500 text-center">
                    Points remaining: <span className="font-mono font-bold text-gold-500">{2 - totalASIPoints}</span> / 2
                  </div>
                  <div className="space-y-2">
                    {ABILITY_SCORES.map((ability) => {
                      const currentScore = character[ability] as number
                      const bonus = asiChoices[ability] || 0
                      const newScore = currentScore + bonus
                      return (
                        <div key={ability} className="flex items-center gap-3 p-2 rounded hover:bg-parchment-200/50">
                          <span className="font-display text-sm w-10 uppercase text-ink-500">
                            {ABILITY_ABBREVIATIONS[ability]}
                          </span>
                          <span className="font-mono text-sm w-6 text-center text-ink-700">{currentScore}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => adjustASI(ability, -1)}
                              disabled={bonus <= 0}
                              className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center text-sm cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                            >
                              -
                            </button>
                            <span className={`font-mono text-sm w-6 text-center ${bonus > 0 ? 'text-gold-500 font-bold' : 'text-ink-300'}`}>
                              {bonus > 0 ? `+${bonus}` : '—'}
                            </span>
                            <button
                              onClick={() => adjustASI(ability, 1)}
                              disabled={totalASIPoints >= 2 || bonus >= 2 || newScore >= 20}
                              className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center text-sm cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                            >
                              +
                            </button>
                          </div>
                          {bonus > 0 && (
                            <span className="text-sm text-ink-700">
                              → <span className="font-bold">{newScore}</span>{' '}
                              <span className="text-xs text-ink-500">({formatModifier(abilityModifier(newScore))})</span>
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {asiMode === 'feat' && (
                <div className="space-y-3">
                  {/* Feat search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input
                      value={featSearch}
                      onChange={(e) => setFeatSearch(e.target.value)}
                      placeholder="Search feats..."
                      className="w-full pl-9 pr-4 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  {/* Selected feat detail */}
                  {selectedFeat && (
                    <Card>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-arcane-500" />
                        <h4 className="font-display text-base text-ink-900">{selectedFeat.name}</h4>
                        <Badge variant="arcane">{selectedFeat.category}</Badge>
                      </div>
                      {selectedFeat.prerequisite && (
                        <p className="text-xs text-ink-400 mb-2">Prerequisite: {selectedFeat.prerequisite}</p>
                      )}
                      <p className="text-sm text-ink-700 whitespace-pre-wrap">{selectedFeat.description}</p>
                      {selectedFeat.abilityScoreIncrease && (
                        <div className="mt-3">
                          <label className="block text-xs font-display uppercase text-ink-500 mb-1">
                            +1 Ability Score
                          </label>
                          <select
                            value={featAbility ?? ''}
                            onChange={e => setFeatAbility(e.target.value || null)}
                            className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                          >
                            <option value="">Choose ability...</option>
                            {ABILITY_SCORES.map(ab => (
                              <option key={ab} value={ab}>{ABILITY_ABBREVIATIONS[ab]}: {character[ab as keyof Character] as number} → {Math.min(selectedFeat.maxAbilityScore ?? 20, (character[ab as keyof Character] as number) + 1)}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {/* Feat extras (skill/spell/tool choices) */}
                      <FeatExtrasUI
                        featName={selectedFeat.name}
                        extras={featExtras}
                        onExtrasChange={setFeatExtras}
                        existingSkills={character.proficiencies.skills}
                        proficiencyBonus={proficiencyBonus(newLevel)}
                      />
                    </Card>
                  )}

                  {/* Feat list */}
                  <div className="max-h-[300px] overflow-y-auto border border-parchment-300 rounded-lg">
                    {getFeatsAvailableAtLevel(newLevel).filter(f => {
                      // Hide ASI — it's the other toggle option
                      if (f.name === 'Ability Score Improvement') return false
                      // Hide feats character already has (unless repeatable)
                      if (!f.repeatable && character.features.some(cf => cf.name === f.name)) return false
                      // Prerequisite check
                      if (!meetsPrerequisites(f, {
                        strength: character.strength,
                        dexterity: character.dexterity,
                        constitution: character.constitution,
                        intelligence: character.intelligence,
                        wisdom: character.wisdom,
                        charisma: character.charisma,
                        armorProficiencies: character.proficiencies?.armor ?? [],
                        hasSpellcasting: !!character.spellcasting_ability,
                        hasFightingStyle: character.features.some(cf => cf.name.toLowerCase().includes('fighting style')),
                      })) return false
                      // Search filter
                      if (featSearch && !f.name.toLowerCase().includes(featSearch.toLowerCase())) return false
                      return true
                    }).map((feat) => {
                      const isSelected = selectedFeat?.name === feat.name
                      return (
                        <button
                          key={feat.name}
                          onClick={() => setSelectedFeat(isSelected ? null : feat)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer ${
                            isSelected ? 'bg-arcane-400/10' : 'hover:bg-gold-100/50'
                          }`}
                        >
                          <div>
                            <span className="font-body text-sm text-ink-900">{feat.name}</span>
                            {feat.prerequisite && (
                              <span className="text-xs text-ink-400 ml-2">({feat.prerequisite})</span>
                            )}
                          </div>
                          <Badge variant={feat.category === 'origin' ? 'gold' : feat.category === 'epic-boon' ? 'arcane' : 'default'}>
                            {feat.category === 'fighting-style' ? 'Fighting' : feat.category === 'epic-boon' ? 'Epic' : feat.category}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Weapon Mastery Step ─── */}
          {step === 'weapon-mastery' && (
            <div className="space-y-4">
              <SectionHeader>Weapon Mastery</SectionHeader>
              <p className="text-xs text-ink-500">
                You gained {gainedMasterySlots} new weapon mastery slot{gainedMasterySlots !== 1 ? 's' : ''}!
                You can now use mastery properties on {newMasterySlots} weapon{newMasterySlots !== 1 ? 's' : ''} total.
                You can also swap existing choices.
              </p>
              <WeaponMasteryStep
                maxChoices={newMasterySlots}
                selected={weaponMasteries}
                weaponProficiencies={character.proficiencies.weapons}
                onChange={setWeaponMasteries}
                className={character.class}
              />
            </div>
          )}

          {/* ─── Dragon-Rider Step ─── */}
          {step === 'dragon-rider' && (
            <div className="space-y-4">
              <SectionHeader>Dragon-Rider Abilities</SectionHeader>

              {getsSignatureTier && (
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-gold-500" />
                    <span className="font-display text-sm uppercase text-ink-500">{signatureTierLabel}</span>
                  </div>
                  <p className="text-xs text-ink-400 mb-3">
                    Design this property with your DM. It should feel about as powerful as a{' '}
                    {newLevel === 5 ? 'Uncommon' : newLevel === 11 ? 'Rare' : 'Very Rare'} magic weapon's signature ability.
                  </p>
                  <div className="space-y-2">
                    <Input
                      label="Property Name"
                      value={drSignatureName}
                      onChange={e => setDrSignatureName(e.target.value)}
                      placeholder="e.g. Stormforged Edge, Thornwhisper Shot..."
                    />
                    <Textarea
                      label="Property Description"
                      value={drSignatureDesc}
                      onChange={e => setDrSignatureDesc(e.target.value)}
                      rows={3}
                      placeholder="Describe the trigger, effect, frequency, and limitations..."
                    />
                  </div>
                </Card>
              )}

              {getsPatronGift && (
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-arcane-400" />
                    <span className="font-display text-sm uppercase text-ink-500">{patronGiftLabel}</span>
                  </div>
                  <p className="text-xs text-ink-400 mb-3">
                    A unique ability designed by you and your DM that reflects your character's story, bond, or destiny.
                  </p>
                  <div className="space-y-2">
                    <Input
                      label="Gift Name"
                      value={drPatronsGiftName}
                      onChange={e => setDrPatronsGiftName(e.target.value)}
                      placeholder="e.g. Stormtouched Aim, Soulguard's Shield..."
                    />
                    <Textarea
                      label="Gift Description"
                      value={drPatronsGiftDesc}
                      onChange={e => setDrPatronsGiftDesc(e.target.value)}
                      rows={3}
                      placeholder="Describe the mechanics (trigger, effect, frequency, limitations...)"
                    />
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ─── New Spells Step ─── */}
          {step === 'new-spells' && (
            <div className="space-y-4">
              <SectionHeader>Learn New Spells</SectionHeader>
              <p className="text-sm text-ink-500">
                You gain {spellsToGain} new {classIndex === 'wizard' ? 'spellbook' : ''} spell{spellsToGain !== 1 ? 's' : ''} at this level.
                Choose from the {character.class} spell list (up to {newMaxSpellLevel}{newMaxSpellLevel === 1 ? 'st' : newMaxSpellLevel === 2 ? 'nd' : newMaxSpellLevel === 3 ? 'rd' : 'th'}-level spells).
              </p>

              <Badge variant={newSpellPicks.length === spellsToGain ? 'gold' : 'default'}>
                {newSpellPicks.length} / {spellsToGain} selected
              </Badge>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={spellSearchQuery}
                  onChange={(e) => setSpellSearchQuery(e.target.value)}
                  placeholder="Search spells..."
                  className="w-full pl-9 pr-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg text-sm font-body focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto border border-parchment-300 rounded-lg">
                {Array.from({ length: newMaxSpellLevel }, (_, i) => i + 1).map(spellLevel => {
                  const spellsAtLevel = pickableSpells.filter(s => s.level === spellLevel)
                  if (spellsAtLevel.length === 0) return null
                  const levelLabel = spellLevel === 1 ? '1st' : spellLevel === 2 ? '2nd' : spellLevel === 3 ? '3rd' : `${spellLevel}th`
                  return (
                    <div key={spellLevel}>
                      <div className="sticky top-0 bg-parchment-200 px-3 py-1 text-xs font-display uppercase text-ink-500 border-b border-parchment-300">
                        {levelLabel}-Level Spells
                      </div>
                      {spellsAtLevel.map(spell => {
                        const isSelected = newSpellPicks.includes(spell.index)
                        const atMax = newSpellPicks.length >= spellsToGain
                        return (
                          <button
                            key={spell.index}
                            onClick={() => {
                              if (isSelected) {
                                setNewSpellPicks(prev => prev.filter(s => s !== spell.index))
                              } else if (!atMax) {
                                setNewSpellPicks(prev => [...prev, spell.index])
                              }
                            }}
                            disabled={!isSelected && atMax}
                            className={`w-full flex items-center justify-between px-4 py-2 text-left border-b border-parchment-200 last:border-b-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default ${
                              isSelected ? 'bg-arcane-400/10' : 'hover:bg-parchment-100'
                            }`}
                          >
                            <span className="font-display text-xs text-ink-900">{spell.name}</span>
                            {isSelected && <Check size={14} className="text-arcane-500" />}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Spells Step ─── */}
          {step === 'spells' && (
            <div className="space-y-4">
              <SectionHeader>Spell Slot Changes</SectionHeader>
              <div className="space-y-2">
                {newSlots.map((slot) => (
                  <div key={slot.level} className="flex items-center justify-between p-3 bg-parchment-50 border border-parchment-300 rounded">
                    <span className="font-display text-sm text-ink-700">
                      Level {slot.level} Slots
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-ink-500">
                        {(currentSpellSlots.find(s => s.slot_level === slot.level)?.total || 0)}
                      </span>
                      <ChevronRight size={14} className="text-gold-400" />
                      <span className="font-mono text-sm font-bold text-ink-900">{slot.total}</span>
                      {slot.gained > 0 && (
                        <Badge variant="arcane">+{slot.gained}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-500">
                Spell slots will be updated automatically. You can add new spells from the Spells tab.
              </p>
            </div>
          )}

          {/* ─── Confirm Step ─── */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <SectionHeader>Summary</SectionHeader>
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Level</span>
                    <span className="font-mono">{character.level} → <span className="font-bold text-gold-500">{newLevel}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Max HP</span>
                    <span className="font-mono">{character.max_hp} → <span className="font-bold text-heal">{character.max_hp + Math.max(1, hpGain)}</span></span>
                  </div>
                  {nonASIFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">New Features</span>
                      <span className="text-ink-900">{nonASIFeatures.map(f => f.name).join(', ')}</span>
                    </div>
                  )}
                  {hasASI && asiMode === 'asi' && totalASIPoints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">ASI</span>
                      <span className="text-ink-900">
                        {Object.entries(asiChoices)
                          .filter(([, v]) => v > 0)
                          .map(([k, v]) => `${ABILITY_ABBREVIATIONS[k as keyof typeof ABILITY_ABBREVIATIONS]} +${v}`)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {hasASI && asiMode === 'feat' && selectedFeat && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Feat</span>
                      <span className="text-ink-900">{selectedFeat.name}</span>
                    </div>
                  )}
                  {hasSpellChanges && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Spell Slots</span>
                      <span className="text-ink-900">
                        {newSlots.filter(s => s.gained > 0).map(s => `Lvl ${s.level}: ${s.total}`).join(', ')}
                      </span>
                    </div>
                  )}
                  {needsSubclassChoice && selectedSubclass && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">{classChoiceData?.subclassLabel ?? 'Subclass'}</span>
                      <span className="text-ink-900">{selectedSubclass}</span>
                    </div>
                  )}
                  {newSpellPicks.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">New Spells</span>
                      <span className="text-ink-900">{newSpellPicks.length} selected</span>
                    </div>
                  )}
                  {getsSignatureTier && drSignatureName.trim() && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">{signatureTierLabel}</span>
                      <span className="text-ink-900">{drSignatureName}</span>
                    </div>
                  )}
                  {getsPatronGift && drPatronsGiftName.trim() && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">{patronGiftLabel}</span>
                      <span className="text-ink-900">{drPatronsGiftName}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          <Divider />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={canGoBack ? prevStep : onClose}
            >
              {canGoBack ? 'Back' : 'Cancel'}
            </Button>
            {step === 'confirm' ? (
              <Button onClick={handleConfirm} disabled={saving}>
                <ArrowUp size={14} className="mr-1" /> {saving ? 'Saving...' : 'Confirm Level Up'}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
