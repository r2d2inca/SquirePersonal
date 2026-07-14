import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { useCharacter } from '@/hooks/useCharacter'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  CLASSES, RACES, ALIGNMENTS, ABILITY_SCORES, ABILITY_ABBREVIATIONS, ABILITY_LABELS, SKILLS,
  STANDARD_LANGUAGES, RARE_LANGUAGES, BACKGROUNDS, STANDARD_ARRAY, POINT_BUY_COSTS, POINT_BUY_BUDGET,
} from '@/lib/constants'
import type { AbilityScore } from '@/lib/constants'
import { getRaceData, applySubrace, formatRaceWithSubrace } from '@/lib/raceData'
import { getBackgroundData } from '@/lib/backgroundData'
import { getClassProfileData } from '@/lib/classProfileData'
import { getClassChoiceData, getSubclassSpells } from '@/lib/phbData'
import {
  getMulticlassCasterLevel, getMulticlassSpellSlots, MULTICLASS_PROFICIENCIES,
  formatClassDisplay, buildHitDiceTotal, collectClassFeaturesForLevel, type ClassLevel,
} from '@/lib/multiclass'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/calculations'
import { CLASS_HIT_DICE, getSpellsByClass, getClassLevel, getClassLevels, getSpellSlotsByLevel, formatSpellComponents, formatSpellDescription, getSpellDetail, getFeatureDetail } from '@/lib/dnd5e'
import type { SRDSpellSummary, SRDSpellDetail, SRDClassLevel } from '@/lib/dnd5e'
import { parseBackgroundEquipment, type ParsedEquipmentItem } from '@/lib/equipmentParser'
import { getSpellSelectionRules } from '@/lib/spellcastingRules'
import { XP_THRESHOLDS, getStartingGoldByLevel, getASILevels, computeTotalHp, collectFeatures } from '@/lib/levelProgression'
import { computeHpBonus } from '@/lib/featuresEngine'
import { FeatSelectionStep, type FeatLevelChoice } from '@/components/create/FeatSelectionStep'
import { getFeatByName, ORIGIN_FEATS, FEAT_FIXED_SPELLS, FEAT_PROFICIENCY_GRANTS, FEAT_RESOURCES, FEAT_FLAT_HP } from '@/lib/featData'
import { FeatExtrasUI } from '@/components/create/FeatExtrasUI'
import { FeatureChoicesStep } from '@/components/create/FeatureChoicesStep'
import { WeaponMasteryStep } from '@/components/create/WeaponMasteryStep'
import { EchoGuide } from '@/components/create/EchoGuide'
import {
  Swords, ChevronRight, ChevronLeft, Sparkles, Shield, BookOpen,
  User, Brain, Scroll, Heart, Check, X, Dices, Minus, Plus,
  Backpack, Wand2, Search, Loader2, Info, FileText, Upload,
} from 'lucide-react'
import { ImportCharacterModal } from '@/components/character/ImportCharacterModal'
import { DRAGON_ELEMENTS, getCompanionStats, type DragonElement } from '@/lib/dragonCompanion'
import type { Proficiencies, Feature } from '@/lib/types/database'

type CreationMode = 'choose' | 'wizard' | 'import-pdf' | 'import-json'
type Step = 'species' | 'class' | 'background' | 'abilities' | 'skills' | 'asi' | 'feature-choices' | 'weapon-mastery' | 'equipment' | 'spells' | 'details' | 'review'

type AbilityMethod = 'standard' | 'pointbuy' | 'manual'

export function CharacterCreatePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { createCharacter, isCreating } = useCharacter(user?.id)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  // Creation mode
  const [creationMode, setCreationMode] = useState<CreationMode>('choose')
  const [showImportModal, setShowImportModal] = useState(false)

  // Step state
  const [step, setStep] = useState<Step>('species')
  const [maxCompletedStep, setMaxCompletedStep] = useState(0)

  // Character choices
  const [selectedRace, setSelectedRace] = useState<string>('Human')
  const [selectedSubrace, setSelectedSubrace] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('Fighter')
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null)
  // Multiclass at creation: additional classes beyond the primary (each with its own level +
  // subclass). Only relevant when the character starts above level 1. Primary stays selectedClass.
  const [additionalClasses, setAdditionalClasses] = useState<ClassLevel[]>([])
  const [selectedBackground, setSelectedBackground] = useState<string>('Soldier')

  // Ability scores
  const [abilityMethod, setAbilityMethod] = useState<AbilityMethod>('standard')
  const [standardAssignment, setStandardAssignment] = useState<Record<AbilityScore, number>>({
    strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8,
  })
  const [pointBuyScores, setPointBuyScores] = useState<Record<AbilityScore, number>>({
    strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8,
  })
  const [manualScores, setManualScores] = useState<Record<AbilityScore, number>>({
    strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
  })
  const [manualInputStrings, setManualInputStrings] = useState<Record<AbilityScore, string>>({
    strength: '10', dexterity: '10', constitution: '10', intelligence: '10', wisdom: '10', charisma: '10',
  })

  // Background ability bonuses
  const [bonusMode, setBonusMode] = useState<'split' | 'even'>('split')
  const [primaryBonus, setPrimaryBonus] = useState<AbilityScore>('strength')
  const [secondaryBonus, setSecondaryBonus] = useState<AbilityScore>('constitution')
  const [tertiaryBonus, setTertiaryBonus] = useState<AbilityScore>('dexterity')

  // Skills
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([])
  const [selectedRaceSkills, setSelectedRaceSkills] = useState<string[]>([])
  const [skilledFeatPicks, setSkilledFeatPicks] = useState<string[]>([])

  // Languages
  const [extraLanguages, setExtraLanguages] = useState<string[]>([])
  const [dmLanguageOverride, setDmLanguageOverride] = useState(false)

  // Equipment
  const [equipmentItems, setEquipmentItems] = useState<ParsedEquipmentItem[]>([])
  const [customItems, setCustomItems] = useState<ParsedEquipmentItem[]>([])
  const [startingGold, setStartingGold] = useState(0)
  const [newItemName, setNewItemName] = useState('')
  const [bgEquipChoice, setBgEquipChoice] = useState<'A' | 'B'>('A')
  const [classEquipChoice, setClassEquipChoice] = useState<'A' | 'B'>('A')

  // Higher level start
  const [startingLevel, setStartingLevel] = useState(1)
  const [featSelections, setFeatSelections] = useState<Record<number, FeatLevelChoice>>({})
  const [featureChoiceSelections, setFeatureChoiceSelections] = useState<Record<string, string[]>>({})
  const [selectedWeaponMasteries, setSelectedWeaponMasteries] = useState<string[]>([])
  const [useGoldByLevel, setUseGoldByLevel] = useState(false)

  // Spells
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([])
  const [selectedSpells, setSelectedSpells] = useState<string[]>([])
  const [spellSearch, setSpellSearch] = useState('')
  const [previewSpell, setPreviewSpell] = useState<SRDSpellDetail | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Magic Initiate spells
  const [miCantrips, setMiCantrips] = useState<string[]>([])
  const [miSpell, setMiSpell] = useState<string | null>(null)

  // Details
  const [name, setName] = useState('')
  const [alignment, setAlignment] = useState('')
  const [personalityTraits, setPersonalityTraits] = useState('')
  const [ideals, setIdeals] = useState('')
  const [bonds, setBonds] = useState('')
  const [flaws, setFlaws] = useState('')
  const [backstory, setBackstory] = useState('')

  // Physical description
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [hairColor, setHairColor] = useState('')
  const [eyeColor, setEyeColor] = useState('')
  const [skinColor, setSkinColor] = useState('')
  const [age, setAge] = useState('')

  // Human Versatile origin feat
  const [humanOriginFeat, setHumanOriginFeat] = useState<string | null>(null)
  const [humanOriginExtras, setHumanOriginExtras] = useState<NonNullable<FeatLevelChoice['featExtras']>>({})

  // Dragon-Rider specific
  const [dragonName, setDragonName] = useState('')
  const [dragonElement, setDragonElement] = useState<DragonElement>('Fire')
  const [signatureWeaponName, setSignatureWeaponName] = useState('')
  const isDragonRider = selectedClass === 'Dragon-Rider'

  // Derived data
  const raceData = getRaceData(selectedRace)
  const backgroundData = getBackgroundData(selectedBackground)
  const classData = getClassProfileData(selectedClass)
  const classChoiceData = getClassChoiceData(selectedClass)
  const needsSubclass = startingLevel >= (classChoiceData?.subclassLevel ?? 99)
  const isCaster = !!classData?.spellcastingAbility

  // Multiclass derived values (primary class is selectedClass @ startingLevel)
  const isMulticlass = additionalClasses.length > 0
  const totalCharLevel = Math.min(20, startingLevel + additionalClasses.reduce((s, c) => s + c.level, 0))
  const classLevels: ClassLevel[] = [
    { class: selectedClass, level: startingLevel, subclass: selectedSubclass },
    ...additionalClasses,
  ]

  // Detect Magic Initiate spell list from background feat
  const magicInitiateClass = useMemo(() => {
    const featName = backgroundData?.originFeat?.name ?? ''
    const match = featName.match(/Magic Initiate \((\w+)\)/i)
    return match ? match[1].toLowerCase() : null
  }, [backgroundData])

  // Fetch Magic Initiate spell list
  const { data: miSpellList = [] } = useQuery({
    queryKey: ['mi-spells', magicInitiateClass],
    queryFn: () => getSpellsByClass(magicInitiateClass!),
    enabled: !!magicInitiateClass,
    staleTime: 10 * 60 * 1000,
  })

  // Class levels query — always fetch to get level 1 features
  const { data: allClassLevels = [] } = useQuery({
    queryKey: ['class-levels', selectedClass.toLowerCase()],
    queryFn: () => getClassLevels(selectedClass.toLowerCase()),
    enabled: !!selectedClass,
    staleTime: Infinity,
  })

  const asiLevels = useMemo(() => {
    if (startingLevel <= 1) return []
    if (allClassLevels.length === 0) return []
    return getASILevels(allClassLevels, startingLevel)
  }, [allClassLevels, startingLevel])

  const availableFeatureChoices = useMemo(() => {
    if (!classChoiceData) return []
    return classChoiceData.featureChoices.filter(fc => fc.minLevel <= startingLevel && fc.options.length > 0)
  }, [classChoiceData, startingLevel])

  // Weapon mastery slots from class level data
  const weaponMasterySlots = useMemo(() => {
    if (allClassLevels.length === 0) return 0
    const levelData = allClassLevels.find(l => l.level === startingLevel)
    const slots = levelData?.class_specific?.weaponMasteries
    return typeof slots === 'number' ? slots : 0
  }, [allClassLevels, startingLevel])

  const steps = useMemo(() => {
    const base: { id: Step; label: string; icon: React.ReactNode }[] = [
      { id: 'species', label: 'Species', icon: <Sparkles size={16} /> },
      { id: 'class', label: 'Class', icon: <Shield size={16} /> },
      { id: 'background', label: 'Background', icon: <BookOpen size={16} /> },
      { id: 'abilities', label: 'Abilities', icon: <Brain size={16} /> },
      { id: 'skills', label: 'Skills', icon: <Scroll size={16} /> },
    ]
    if (asiLevels.length > 0) {
      base.push({ id: 'asi', label: 'Feats', icon: <Sparkles size={16} /> })
    }
    if (availableFeatureChoices.length > 0) {
      base.push({ id: 'feature-choices', label: 'Features', icon: <Sparkles size={16} /> })
    }
    if (weaponMasterySlots > 0) {
      base.push({ id: 'weapon-mastery', label: 'Mastery', icon: <Swords size={16} /> })
    }
    base.push({ id: 'equipment', label: 'Equipment', icon: <Backpack size={16} /> })
    if (isCaster || magicInitiateClass) {
      base.push({ id: 'spells', label: 'Spells', icon: <Wand2 size={16} /> })
    }
    base.push(
      { id: 'details', label: 'Details', icon: <User size={16} /> },
      { id: 'review', label: 'Review', icon: <Check size={16} /> },
    )
    return base
  }, [isCaster, asiLevels.length, availableFeatureChoices.length, weaponMasterySlots, magicInitiateClass])

  // Auto-populate equipment when background, class, or A/B choice changes
  useEffect(() => {
    const items: ParsedEquipmentItem[] = []
    let gold = 0
    // Class equipment: Option A = items, Option B = gold
    if (classEquipChoice === 'A' && classData?.startingEquipment) {
      const parsed = parseBackgroundEquipment(classData.startingEquipment)
      items.push(...parsed.items)
      gold += parsed.gold
    } else if (classEquipChoice === 'B') {
      gold += classData?.startingGold ?? 75
    }
    // Background equipment: Option A = items, Option B = 50 GP
    if (bgEquipChoice === 'A' && backgroundData?.equipment) {
      const parsed = parseBackgroundEquipment(backgroundData.equipment)
      items.push(...parsed.items)
      gold += parsed.gold
    } else if (bgEquipChoice === 'B') {
      gold += 50
    }
    setEquipmentItems(items)
    setStartingGold(gold)
    setCustomItems([])
  }, [selectedBackground, selectedClass, bgEquipChoice, classEquipChoice])

  // Clamp step when steps array changes
  useEffect(() => {
    const currentIdx = steps.findIndex(s => s.id === step)
    if (currentIdx === -1) {
      setStep('skills')
    }
    setMaxCompletedStep(prev => Math.min(prev, steps.length - 1))
  }, [isCaster, asiLevels.length, availableFeatureChoices.length, weaponMasterySlots, magicInitiateClass])

  // Reset spells when class changes
  useEffect(() => {
    setSelectedCantrips([])
    setSelectedSpells([])
    setSpellSearch('')
  }, [selectedClass])

  // Reset level-dependent state when startingLevel changes
  useEffect(() => {
    setFeatSelections({})
    setFeatureChoiceSelections({})
    setSelectedCantrips([])
    setSelectedSpells([])
  }, [startingLevel])

  // Spell data queries
  const { data: classSpells = [], isLoading: loadingSpells } = useQuery({
    queryKey: ['class-spells', selectedClass.toLowerCase()],
    queryFn: () => getSpellsByClass(selectedClass.toLowerCase()),
    enabled: isCaster,
    staleTime: 10 * 60 * 1000,
  })

  const { data: classLevelData } = useQuery<SRDClassLevel>({
    queryKey: ['class-level', selectedClass.toLowerCase(), startingLevel],
    queryFn: () => getClassLevel(selectedClass.toLowerCase(), startingLevel),
    enabled: isCaster,
    staleTime: Infinity,
  })

  const effectiveRaceData = useMemo(() => {
    if (!raceData || !selectedSubrace || !raceData.subraces) return raceData
    const subrace = raceData.subraces.find(s => s.name === selectedSubrace)
    return subrace ? applySubrace(raceData, subrace) : raceData
  }, [raceData, selectedSubrace])

  const baseScores = abilityMethod === 'standard' ? standardAssignment
    : abilityMethod === 'pointbuy' ? pointBuyScores
    : manualScores

  const finalScores = useMemo(() => {
    const scores = { ...baseScores }
    if (bonusMode === 'split') {
      scores[primaryBonus] = Math.min(20, scores[primaryBonus] + 2)
      if (secondaryBonus !== primaryBonus) {
        scores[secondaryBonus] = Math.min(20, scores[secondaryBonus] + 1)
      }
    } else {
      scores[primaryBonus] = Math.min(20, scores[primaryBonus] + 1)
      scores[secondaryBonus] = Math.min(20, scores[secondaryBonus] + 1)
      scores[tertiaryBonus] = Math.min(20, scores[tertiaryBonus] + 1)
    }
    return scores
  }, [baseScores, bonusMode, primaryBonus, secondaryBonus, tertiaryBonus])

  const finalScoresWithASI = useMemo(() => {
    const scores = { ...finalScores }
    for (const choice of Object.values(featSelections)) {
      if (choice.type === 'asi') {
        // Standard ASI: +2 to one or +1 to two
        const maxScore = 20
        if (choice.asiMode === 'single') {
          const ab = choice.asiFirst ?? 'strength' as AbilityScore
          scores[ab] = Math.min(maxScore, scores[ab] + 2)
        } else {
          const first = choice.asiFirst ?? 'strength' as AbilityScore
          const second = choice.asiSecond ?? 'dexterity' as AbilityScore
          scores[first] = Math.min(maxScore, scores[first] + 1)
          scores[second] = Math.min(maxScore, scores[second] + 1)
        }
      } else if (choice.type === 'feat' && choice.featName) {
        // Feat with ability score increase
        const feat = getFeatByName(choice.featName)
        // Resilient: ability score increase is linked to the saving throw choice
        const effectiveAbility = choice.featName === 'Resilient' && choice.featExtras?.savingThrow
          ? choice.featExtras.savingThrow as AbilityScore
          : choice.featAbility
        if (feat?.abilityScoreIncrease && effectiveAbility) {
          const maxScore = feat.maxAbilityScore ?? 20
          scores[effectiveAbility] = Math.min(maxScore, scores[effectiveAbility] + 1)
        }
      }
    }
    return scores
  }, [finalScores, featSelections])

  const spellRules = useMemo(() => {
    if (!isCaster) return null
    const scAbility = classData?.spellcastingAbility as AbilityScore | null
    const mod = scAbility ? abilityModifier(finalScoresWithASI[scAbility]) : 0
    return getSpellSelectionRules(selectedClass, classLevelData, mod, startingLevel)
  }, [isCaster, selectedClass, classLevelData, classData, finalScoresWithASI, startingLevel])

  const cantrips = useMemo(() => classSpells.filter(s => s.level === 0), [classSpells])

  const availableSpells = useMemo(() => {
    if (!spellRules) return []
    return classSpells.filter(s => s.level > 0 && s.level <= spellRules.maxSpellLevel)
  }, [classSpells, spellRules])

  // How many leveled spells the player picks on this screen. Known casters pick their
  // "spells known"; prepared casters (Artificer, Cleric, Druid, Paladin) pick their initial
  // prepared spells here rather than deferring entirely to the Spells tab after creation.
  const leveledSpellTarget = spellRules && spellRules.maxSpellLevel > 0
    ? (spellRules.isPreparedCaster ? spellRules.preparedCount : spellRules.spellsToSelect)
    : 0

  const pointBuySpent = useMemo(() => {
    return ABILITY_SCORES.reduce((total, ab) => total + (POINT_BUY_COSTS[pointBuyScores[ab]] ?? 0), 0)
  }, [pointBuyScores])

  const hitDie = CLASS_HIT_DICE[selectedClass.toLowerCase()] || (classData?.hitDie ?? 10)
  const conMod = abilityModifier(finalScoresWithASI.constitution)
  const hpBonus = computeHpBonus(getAllFeatures(), startingLevel)
  const startingHp = computeTotalHp(hitDie, conMod, startingLevel, hpBonus)

  // All auto-granted proficiencies
  const allLanguages = useMemo(() => {
    const langs = new Set<string>()
    effectiveRaceData?.languages.forEach(l => langs.add(l))
    extraLanguages.forEach(l => langs.add(l))
    return Array.from(langs)
  }, [effectiveRaceData, extraLanguages])

  const allSkillProficiencies = useMemo(() => {
    const skills = new Set<string>()
    // From background
    backgroundData?.skillProficiencies.forEach(s => skills.add(s))
    // From species
    effectiveRaceData?.skillProficiencies?.forEach(s => skills.add(s))
    // From species choices (Human Skillful, etc.)
    selectedRaceSkills.forEach(s => skills.add(s))
    // From class choices
    selectedClassSkills.forEach(s => skills.add(s))
    // From Skilled feat (skill picks only — tool picks handled in buildProficiencies)
    skilledFeatPicks.filter(p => SKILLS.some(s => s.name === p)).forEach(s => skills.add(s))
    return Array.from(skills)
  }, [backgroundData, effectiveRaceData, selectedRaceSkills, selectedClassSkills, skilledFeatPicks])

  // Navigation
  const currentStepIndex = steps.findIndex(s => s.id === step)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoBack = currentStepIndex > 0

  function nextStep() {
    if (canGoNext) {
      setMaxCompletedStep(prev => Math.max(prev, currentStepIndex + 1))
      setStep(steps[currentStepIndex + 1].id)
    }
  }
  function prevStep() {
    if (canGoBack) setStep(steps[currentStepIndex - 1].id)
  }

  // Validation
  function canProceed(): boolean {
    switch (step) {
      case 'species': return !!selectedRace && (!raceData?.subraces?.length || !!selectedSubrace) && (selectedRace !== 'Human' || !!humanOriginFeat)
      case 'class': {
        if (!selectedClass || (needsSubclass && !selectedSubclass)) return false
        // Multiclass validity: no duplicate classes, total level <= 20, each added class that
        // reaches its subclass level must have picked one.
        const names = new Set([selectedClass, ...additionalClasses.map(c => c.class)])
        if (names.size !== 1 + additionalClasses.length) return false
        if (startingLevel + additionalClasses.reduce((s, c) => s + c.level, 0) > 20) return false
        for (const ac of additionalClasses) {
          if (ac.level < 1) return false
          const scLevel = getClassChoiceData(ac.class)?.subclassLevel ?? 99
          if (ac.level >= scLevel && !ac.subclass) return false
        }
        return true
      }
      case 'background': {
        if (!selectedBackground) return false
        if (bonusMode === 'split') return primaryBonus !== secondaryBonus
        return new Set([primaryBonus, secondaryBonus, tertiaryBonus]).size === 3
      }
      case 'abilities': {
        if (abilityMethod === 'pointbuy') return pointBuySpent === POINT_BUY_BUDGET
        if (abilityMethod === 'standard') {
          const values = Object.values(standardAssignment).sort((a, b) => b - a)
          const std = [...STANDARD_ARRAY].sort((a, b) => b - a)
          return JSON.stringify(values) === JSON.stringify(std)
        }
        return true
      }
      case 'skills': return selectedClassSkills.length === (classData?.skillChoices.count ?? 2)
      case 'asi': return asiLevels.every(level => {
        const sel = featSelections[level]
        if (!sel) return false
        if (sel.type === 'asi') return true
        if (sel.type === 'feat') return !!sel.featName
        return false
      })
      case 'feature-choices': return availableFeatureChoices.every(fc =>
        (featureChoiceSelections[fc.id]?.length ?? 0) > 0
      )
      case 'weapon-mastery': return selectedWeaponMasteries.length === weaponMasterySlots
      case 'equipment': return true
      case 'spells': {
        // Class spell validation
        let classOk = true
        if (spellRules?.hasSpells) {
          const cantripsOk = selectedCantrips.length === spellRules.cantripsKnown
          const spellsOk = leveledSpellTarget === 0 || selectedSpells.length === leveledSpellTarget
          classOk = cantripsOk && spellsOk
        }
        // Magic Initiate validation
        const miOk = !magicInitiateClass || (miCantrips.length === 2 && miSpell !== null)
        return classOk && miOk
      }
      case 'details': return name.trim().length > 0
      case 'review': return true
      default: return true
    }
  }

  // Build all features
  function getAllFeatures(): Feature[] {
    const features: Feature[] = []
    // Species features (with subrace applied)
    effectiveRaceData?.features.forEach(f => features.push(f))
    // Background origin feat
    if (backgroundData?.originFeat) {
      features.push({ ...backgroundData.originFeat, source: 'Feat' })
    }
    // Subclass feature
    if (selectedSubclass && classChoiceData) {
      const sub = classChoiceData.subclasses.find(s => s.name === selectedSubclass)
      if (sub) {
        features.push({
          name: `${classChoiceData.subclassLabel}: ${sub.name}`,
          description: sub.description,
          source: 'Subclass',
        })
      }
    }
    // SRD class features (including level 1) — descriptions fetched async in handleCreate
    if (allClassLevels.length > 0) {
      const srdFeatures = collectFeatures(allClassLevels, startingLevel)
      srdFeatures.forEach(f => features.push({
        name: f.name,
        description: `Level ${f.level} class feature`,
        source: selectedClass,
      }))
    }
    // Monk Focus Points (available from level 2)
    if (selectedClass.toLowerCase() === 'monk' && startingLevel >= 2) {
      features.push({
        name: 'Focus Points',
        description: `You have ${startingLevel} Focus Points. You can spend these to fuel features like Flurry of Blows, Patient Defense, and Step of the Wind. You regain all Focus Points on a Short or Long Rest.`,
        source: 'Monk',
        usesMax: startingLevel,
        usesRemaining: startingLevel,
        rechargeOn: 'short_rest',
      })
    }

    // Feature choice selections
    for (const [choiceId, selected] of Object.entries(featureChoiceSelections)) {
      const choice = availableFeatureChoices.find(fc => fc.id === choiceId)
      if (!choice) continue
      for (const optIndex of selected) {
        const opt = choice.options.find(o => o.index === optIndex)
        if (opt) {
          features.push({
            name: opt.name,
            description: opt.description,
            source: selectedClass,
          })
        }
      }
    }
    // Human Versatile origin feat
    if (selectedRace === 'Human' && humanOriginFeat) {
      const feat = ORIGIN_FEATS.find(f => f.name === humanOriginFeat)
      if (feat) {
        let desc = feat.description
        const hoe = humanOriginExtras
        const notes: string[] = []
        if (hoe.skill) notes.push(`Chosen skill: ${hoe.skill}`)
        if (hoe.expertise) notes.push(`Expertise: ${hoe.expertise}`)
        if (hoe.skills?.length) notes.push(`Chosen: ${hoe.skills.join(', ')}`)
        if (hoe.tools?.length) notes.push(`Tools: ${hoe.tools.join(', ')}`)
        if (hoe.instruments?.length) notes.push(`Instruments: ${hoe.instruments.join(', ')}`)
        if (hoe.damageTypes?.length) notes.push(`Resistances: ${hoe.damageTypes.join(', ')}`)
        if (hoe.miAbility) notes.push(`Spellcasting ability: ${hoe.miAbility}`)
        if (notes.length > 0) desc += '\n\n' + notes.join('. ') + '.'
        const resource = FEAT_RESOURCES[feat.name]
        const featureEntry: Feature = { name: feat.name, description: desc, source: 'Feat' }
        if (resource) {
          const maxUses = resource.usesMax === 'proficiency' ? proficiencyBonus(startingLevel) : resource.usesMax
          featureEntry.usesMax = maxUses
          featureEntry.usesRemaining = maxUses
          featureEntry.rechargeOn = resource.rechargeOn
        }
        features.push(featureEntry)
      }
    }

    // Feats chosen at ASI levels
    for (const sel of Object.values(featSelections)) {
      if (sel.type === 'feat' && sel.featName) {
        const feat = getFeatByName(sel.featName)
        if (feat) {
          let desc = feat.description
          // Append chosen extras to the description
          const extras = sel.featExtras
          if (extras) {
            const notes: string[] = []
            if (extras.skill) notes.push(`Chosen skill: ${extras.skill}`)
            if (extras.expertise) notes.push(`Expertise: ${extras.expertise}`)
            if (extras.skills?.length) notes.push(`Chosen: ${extras.skills.join(', ')}`)
            if (extras.savingThrow) notes.push(`Saving throw: ${extras.savingThrow}`)
            if (extras.damageType) notes.push(`Chosen damage type: ${extras.damageType}`)
            if (extras.damageTypes?.length) notes.push(`Resistances: ${extras.damageTypes.join(', ')}`)
            if (extras.spellPick) notes.push(`Chosen spell: ${extras.spellPick}`)
            if (extras.spellPicks?.length) notes.push(`Ritual spells: ${extras.spellPicks.join(', ')}`)
            if (extras.tools?.length) notes.push(`Tools: ${extras.tools.join(', ')}`)
            if (extras.instruments?.length) notes.push(`Instruments: ${extras.instruments.join(', ')}`)
            if (extras.miAbility) notes.push(`Spellcasting ability: ${extras.miAbility}`)
            if (notes.length > 0) desc += '\n\n' + notes.join('. ') + '.'
          }
          // Resource tracking for feats that have uses
          const resource = FEAT_RESOURCES[feat.name]
          const featureEntry: Feature = {
            name: feat.name,
            description: desc,
            source: 'Feat',
          }
          if (resource) {
            const maxUses = resource.usesMax === 'proficiency' ? proficiencyBonus(startingLevel) : resource.usesMax
            featureEntry.usesMax = maxUses
            featureEntry.usesRemaining = maxUses
            featureEntry.rechargeOn = resource.rechargeOn
          }
          features.push(featureEntry)
        }
      }
    }
    return features
  }

  // Build proficiencies object
  // Note: SkillsList expects lowercase skill names, SavingThrows expects lowercase ability names
  function buildProficiencies(): Proficiencies {
    const proficiencies: Proficiencies = {
      skills: allSkillProficiencies.map(s => s.toLowerCase()),
      savingThrows: (classData?.savingThrows ?? []).map(s => s.toLowerCase()),
      languages: allLanguages,
      tools: [],
      weapons: classData?.weaponProficiencies ?? [],
      armor: classData?.armorProficiencies ?? [],
    }

    // Tool proficiencies from class
    if (classData?.toolProficiencies) {
      proficiencies.tools.push(...classData.toolProficiencies)
    }
    // Tool proficiency from background
    if (backgroundData?.toolProficiency) {
      if (!proficiencies.tools.includes(backgroundData.toolProficiency)) {
        proficiencies.tools.push(backgroundData.toolProficiency)
      }
    }
    // Tool proficiencies from Skilled feat
    skilledFeatPicks.filter(p => !SKILLS.some(s => s.name === p)).forEach(t => {
      if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t)
    })
    // Proficiencies from feat extras (Keen Mind, Observant, Skill Expert, Resilient, Crafter, Musician, Skilled, Magic Initiate)
    for (const sel of Object.values(featSelections)) {
      if (sel.type !== 'feat' || !sel.featExtras) continue
      const extras = sel.featExtras
      // Skill proficiency from feats (Keen Mind, Observant: upgrade to expertise if already proficient)
      if (extras.skill) {
        const skillLower = extras.skill.toLowerCase()
        const isKeenMindOrObservant = sel.featName === 'Keen Mind' || sel.featName === 'Observant'
        if (isKeenMindOrObservant && proficiencies.skills.includes(skillLower)) {
          if (!proficiencies.expertise) proficiencies.expertise = []
          if (!proficiencies.expertise.includes(skillLower)) proficiencies.expertise.push(skillLower)
        } else if (!proficiencies.skills.includes(skillLower)) {
          proficiencies.skills.push(skillLower)
        }
      }
      // Skilled feat: 3 skills/tools
      if (extras.skills?.length) {
        for (const pick of extras.skills) {
          const isSkill = SKILLS.some(s => s.name === pick)
          if (isSkill) {
            const lower = pick.toLowerCase()
            if (!proficiencies.skills.includes(lower)) proficiencies.skills.push(lower)
          } else {
            if (!proficiencies.tools.includes(pick)) proficiencies.tools.push(pick)
          }
        }
      }
      // Expertise from Skill Expert
      if (extras.expertise) {
        if (!proficiencies.expertise) proficiencies.expertise = []
        const expLower = extras.expertise.toLowerCase()
        if (!proficiencies.expertise.includes(expLower)) {
          proficiencies.expertise.push(expLower)
        }
      }
      // Saving throw from Resilient
      if (extras.savingThrow) {
        const stLower = extras.savingThrow.toLowerCase()
        if (!proficiencies.savingThrows.includes(stLower)) {
          proficiencies.savingThrows.push(stLower)
        }
      }
      // Tools from Crafter
      if (extras.tools) {
        extras.tools.forEach(t => {
          if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t)
        })
      }
      // Instruments from Musician
      if (extras.instruments) {
        extras.instruments.forEach(t => {
          if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t)
        })
      }
    }
    // Proficiency grants from feat names
    for (const sel of Object.values(featSelections)) {
      if (sel.type !== 'feat' || !sel.featName) continue
      const grants = FEAT_PROFICIENCY_GRANTS[sel.featName]
      if (!grants) continue
      if (grants.tools) grants.tools.forEach(t => { if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t) })
      if (grants.armor) grants.armor.forEach(a => { if (!proficiencies.armor.includes(a)) proficiencies.armor.push(a) })
      if (grants.weapons) grants.weapons.forEach(w => { if (!proficiencies.weapons.includes(w)) proficiencies.weapons.push(w) })
      if (grants.allSkills) {
        SKILLS.forEach(s => {
          const lower = s.name.toLowerCase()
          if (!proficiencies.skills.includes(lower)) proficiencies.skills.push(lower)
        })
      }
    }
    // Also check humanOriginFeat for proficiency grants
    if (selectedRace === 'Human' && humanOriginFeat) {
      const grants = FEAT_PROFICIENCY_GRANTS[humanOriginFeat]
      if (grants) {
        if (grants.tools) grants.tools.forEach(t => { if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t) })
        if (grants.armor) grants.armor.forEach(a => { if (!proficiencies.armor.includes(a)) proficiencies.armor.push(a) })
        if (grants.weapons) grants.weapons.forEach(w => { if (!proficiencies.weapons.includes(w)) proficiencies.weapons.push(w) })
        if (grants.allSkills) SKILLS.forEach(s => { const lower = s.name.toLowerCase(); if (!proficiencies.skills.includes(lower)) proficiencies.skills.push(lower) })
      }
      // Handle extras from Human Versatile origin feat
      const hoe = humanOriginExtras
      if (hoe.skill) {
        const skillLower = hoe.skill.toLowerCase()
        if (!proficiencies.skills.includes(skillLower)) proficiencies.skills.push(skillLower)
      }
      if (hoe.expertise) {
        if (!proficiencies.expertise) proficiencies.expertise = []
        const expLower = hoe.expertise.toLowerCase()
        if (!proficiencies.expertise.includes(expLower)) proficiencies.expertise.push(expLower)
      }
      if (hoe.skills?.length) {
        for (const pick of hoe.skills) {
          const isSkill = SKILLS.some(s => s.name === pick)
          if (isSkill) {
            const lower = pick.toLowerCase()
            if (!proficiencies.skills.includes(lower)) proficiencies.skills.push(lower)
          } else {
            if (!proficiencies.tools.includes(pick)) proficiencies.tools.push(pick)
          }
        }
      }
      if (hoe.tools?.length) hoe.tools.forEach(t => { if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t) })
      if (hoe.instruments?.length) hoe.instruments.forEach(t => { if (!proficiencies.tools.includes(t)) proficiencies.tools.push(t) })
    }
    // Weapon proficiencies from species
    if (effectiveRaceData?.weaponProficiencies) {
      effectiveRaceData.weaponProficiencies.forEach(w => {
        if (!proficiencies.weapons.includes(w)) proficiencies.weapons.push(w)
      })
    }

    // Weapon masteries (2024)
    if (selectedWeaponMasteries.length > 0) {
      proficiencies.weaponMasteries = [...selectedWeaponMasteries]
    }

    return proficiencies
  }

  async function handleCreate() {
    setError(null)
    try {
      // Fetch SRD feature descriptions for class features
      const features = getAllFeatures()
      const srdFeatureIndices = allClassLevels.length > 0
        ? collectFeatures(allClassLevels, Math.min(20, startingLevel))
        : []
      for (const srdFeature of srdFeatureIndices) {
        const match = features.find(f => f.name === srdFeature.name && f.description.startsWith('Level '))
        if (match && srdFeature.index) {
          try {
            const detail = await getFeatureDetail(srdFeature.index)
            if (detail.desc?.length > 0) {
              match.description = detail.desc.join('\n\n')
            }
          } catch {
            // Keep placeholder if SRD fetch fails
          }
        }
      }

      // Dragon-Rider: add Signature Weapon feature
      if (isDragonRider && signatureWeaponName.trim()) {
        features.push({
          name: 'Signature Weapon',
          description: `Your Signature Weapon is a ${signatureWeaponName.trim()}. It is masterwork but not yet magical. It cannot be permanently broken or destroyed by mundane means. You can recall it at the end of a long rest.`,
          source: 'Dragon-Rider',
        })
      }

      // ─── Multiclass: fold in secondary classes' features, proficiencies, HP and level ───
      const mcTotalLevel = isMulticlass ? totalCharLevel : Math.min(20, startingLevel)
      const mcPB = proficiencyBonus(mcTotalLevel)
      const proficiencies = buildProficiencies()
      let mcHp = startingHp
      if (isMulticlass) {
        const conModVal = abilityModifier(finalScoresWithASI.constitution)
        for (const ac of additionalClasses) {
          // Secondary-class features (base + chosen subclass). featureRefresh can't backfill
          // multiclass chars, so grant them at creation.
          const ccd = getClassChoiceData(ac.class)
          if (ac.subclass && ccd) {
            const sub = ccd.subclasses.find(s => s.name === ac.subclass)
            if (sub) features.push({ name: `${ccd.subclassLabel}: ${sub.name}`, description: sub.description, source: 'Subclass' })
          }
          collectClassFeaturesForLevel(ac.class, ac.level, ac.subclass).forEach(f => {
            if (!features.some(x => x.name === f.name)) features.push(f)
          })
          // Multiclass proficiencies (subset gained when multiclassing into a class).
          const mp = MULTICLASS_PROFICIENCIES[ac.class.toLowerCase()]
          if (mp) {
            mp.armor.forEach(a => { if (!proficiencies.armor.includes(a)) proficiencies.armor.push(a) })
            mp.weapons.forEach(w => { if (!proficiencies.weapons.includes(w)) proficiencies.weapons.push(w) })
          }
          // Secondary-class levels use average HP (only the primary class gets max at level 1).
          const die = CLASS_HIT_DICE[ac.class.toLowerCase()] ?? 8
          mcHp += ac.level * (Math.floor(die / 2) + 1 + conModVal)
        }
      }

      // Check if Alert feat grants initiative bonus (2024 rules: add proficiency bonus)
      let initiativeBonus = 0
      const alertFeat = features.find(f => f.name === 'Alert')
      if (alertFeat) initiativeBonus = mcPB

      const character = await createCharacter({
        user_id: user!.id,
        is_active: true,
        name: name.trim(),
        race: formatRaceWithSubrace(selectedRace, selectedSubrace),
        class: isMulticlass ? formatClassDisplay(classLevels) : selectedClass,
        subclass: selectedSubclass,
        level: mcTotalLevel,
        background: selectedBackground,
        alignment: alignment || null,
        experience_points: XP_THRESHOLDS[mcTotalLevel] ?? 0,
        strength: finalScoresWithASI.strength,
        dexterity: finalScoresWithASI.dexterity,
        constitution: finalScoresWithASI.constitution,
        intelligence: finalScoresWithASI.intelligence,
        wisdom: finalScoresWithASI.wisdom,
        charisma: finalScoresWithASI.charisma,
        max_hp: Math.max(1, mcHp),
        current_hp: Math.max(1, mcHp),
        temp_hp: 0,
        armor_class: 10 + abilityModifier(finalScoresWithASI.dexterity),
        initiative_bonus: initiativeBonus,
        speed: effectiveRaceData?.speed ?? 30,
        hit_dice_total: isMulticlass ? buildHitDiceTotal(classLevels) : `${startingLevel}d${hitDie}`,
        hit_dice_remaining: mcTotalLevel,
        death_save_successes: 0,
        death_save_failures: 0,
        proficiencies,
        features,
        copper: 0,
        silver: 0,
        electrum: 0,
        gold: startingGold,
        platinum: 0,
        personality_traits: personalityTraits,
        ideals,
        bonds,
        flaws,
        appearance: JSON.stringify({
          height, weight, hairColor, eyeColor, skinColor, age,
          ...(isMulticlass ? { classLevels } : {}),
          ...(isDragonRider ? {
            dragonName: dragonName.trim() || 'Unnamed Dragon',
            dragonElement,
            dragonCurrentHp: getCompanionStats(Math.min(20, startingLevel)).maxHp,
          } : {}),
        }),
        backstory,
        spellcasting_ability: classData?.spellcastingAbility ?? null,
        spell_save_dc: classData?.spellcastingAbility
          ? 8 + mcPB + abilityModifier(finalScoresWithASI[classData.spellcastingAbility as AbilityScore])
          : null,
        spell_attack_bonus: classData?.spellcastingAbility
          ? mcPB + abilityModifier(finalScoresWithASI[classData.spellcastingAbility as AbilityScore])
          : null,
      })
      const characterId = character.id

      // Insert inventory items (skip if using gold by level)
      const allItems = useGoldByLevel ? [] : [...equipmentItems, ...customItems]
      if (allItems.length > 0) {
        await supabase.from('inventory_items').insert(allItems.map((item, i) => ({
          character_id: characterId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight,
          description: item.description || '',
          is_equipped: false,
          is_attuned: false,
          // Preserve parsed weapon damage/properties so items added at creation show their
          // damage dice and details on the sheet (previously these were dropped to null).
          damage: item.damage ?? null,
          weapon_properties: item.weaponProperties ?? null,
          armor_bonus: null,
          sort_order: i,
        })))
      }

      // Set starting gold
      if (startingGold > 0) {
        await supabase.from('characters').update({ gold: startingGold }).eq('id', characterId)
      }

      // Insert spells and spell slots for casters
      if (isCaster && (selectedCantrips.length > 0 || selectedSpells.length > 0)) {
        const spellSlugs = [...selectedCantrips, ...selectedSpells]
        const details = await Promise.all(spellSlugs.map(slug => getSpellDetail(slug)))
        const spellRows = details.filter(Boolean).map(spell => ({
          character_id: characterId,
          name: spell.name,
          level: spell.level,
          school: spell.school.name,
          casting_time: spell.casting_time,
          range: spell.range,
          components: formatSpellComponents(spell.components, spell.material),
          duration: spell.duration,
          is_concentration: spell.concentration,
          is_ritual: spell.ritual,
          is_prepared: true,
          description: formatSpellDescription(spell.desc),
          higher_levels: spell.higher_level?.join('\n\n') ?? '',
          source: selectedClass,
        }))
        if (spellRows.length > 0) {
          await supabase.from('spells').insert(spellRows)
        }
      }

      // Insert spell slots. Multiclass uses the combined PHB caster-level table (p.165);
      // single-class uses the primary class's own slot progression.
      if (isMulticlass) {
        const casterLevel = getMulticlassCasterLevel(classLevels)
        if (casterLevel > 0) {
          const slotRows = getMulticlassSpellSlots(casterLevel)
            .map((total, i) => ({ character_id: characterId, slot_level: i + 1, total, expended: 0 }))
            .filter(r => r.total > 0)
          if (slotRows.length > 0) {
            await supabase.from('spell_slots').insert(slotRows)
          }
        }
      } else if (isCaster && classLevelData?.spellcasting) {
        const slots = getSpellSlotsByLevel(classLevelData.spellcasting)
        if (slots.length > 0) {
          await supabase.from('spell_slots').insert(slots.map(s => ({
            character_id: characterId,
            slot_level: s.level,
            total: s.slots,
            expended: 0,
          })))
        }
      }

      // Insert subclass spells if applicable
      if (selectedSubclass && classChoiceData) {
        const grantedSpells = getSubclassSpells(selectedClass.toLowerCase(), selectedSubclass.toLowerCase().replace(/\s+/g, '-'), startingLevel)
        if (grantedSpells.length > 0) {
          const subDetails = await Promise.all(grantedSpells.map(sp => getSpellDetail(sp.index)))
          const subRows = subDetails.filter(Boolean).map(spell => ({
            character_id: characterId,
            name: spell.name,
            level: spell.level,
            school: spell.school.name,
            casting_time: spell.casting_time,
            range: spell.range,
            components: formatSpellComponents(spell.components, spell.material),
            duration: spell.duration,
            is_concentration: spell.concentration,
            is_ritual: spell.ritual,
            is_prepared: true,
            description: formatSpellDescription(spell.desc),
            higher_levels: spell.higher_level?.join('\n\n') ?? '',
            source: 'Subclass',
          }))
          if (subRows.length > 0) {
            await supabase.from('spells').insert(subRows)
          }
        }
      }

      // Insert Magic Initiate spells
      const miSlugs = [...miCantrips, ...(miSpell ? [miSpell] : [])]
      if (miSlugs.length > 0) {
        const miDetails = await Promise.all(miSlugs.map(slug => getSpellDetail(slug).catch(() => null)))
        const miRows = miDetails.filter(Boolean).map(spell => ({
          character_id: characterId,
          name: spell!.name,
          level: spell!.level,
          school: spell!.school.name,
          casting_time: spell!.casting_time,
          range: spell!.range,
          components: formatSpellComponents(spell!.components, spell!.material),
          duration: spell!.duration,
          is_concentration: spell!.concentration,
          is_ritual: spell!.ritual,
          is_prepared: true,
          description: formatSpellDescription(spell!.desc),
          higher_levels: spell!.higher_level?.join('\n\n') ?? '',
          source: 'Magic Initiate',
        }))
        if (miRows.length > 0) {
          await supabase.from('spells').insert(miRows)
        }
      }

      // Insert race-granted spells
      const raceSpells = effectiveRaceData?.grantedSpells?.filter(s => s.grantedAtLevel <= Math.min(20, startingLevel)) ?? []
      if (raceSpells.length > 0) {
        const raceSpellDetails = await Promise.all(raceSpells.map(sp => getSpellDetail(sp.index).catch(() => null)))
        const raceSpellRows = raceSpellDetails.filter(Boolean).map(spell => ({
          character_id: characterId,
          name: spell!.name,
          level: spell!.level,
          school: spell!.school.name,
          casting_time: spell!.casting_time,
          range: spell!.range,
          components: formatSpellComponents(spell!.components, spell!.material),
          duration: spell!.duration,
          is_concentration: spell!.concentration,
          is_ritual: spell!.ritual,
          is_prepared: true,
          description: formatSpellDescription(spell!.desc),
          higher_levels: spell!.higher_level?.join('\n\n') ?? '',
          source: 'Species',
        }))
        if (raceSpellRows.length > 0) {
          await supabase.from('spells').insert(raceSpellRows)
        }
      }

      // Insert feat-granted spells (Fey Touched, Shadow Touched, Ritual Caster, Telekinetic, Telepathic, Magic Initiate)
      const featSpellSlugs: { slug: string; source: string }[] = []
      // Helper to collect spells from feat extras
      function collectFeatSpells(fname: string, extras?: NonNullable<FeatLevelChoice['featExtras']>) {
        if (FEAT_FIXED_SPELLS[fname]) {
          for (const slug of FEAT_FIXED_SPELLS[fname]) {
            featSpellSlugs.push({ slug, source: `Feat (${fname})` })
          }
        }
        if (!extras) return
        if (extras.spellPick) featSpellSlugs.push({ slug: extras.spellPick, source: `Feat (${fname})` })
        if (extras.spellPicks?.length) {
          for (const slug of extras.spellPicks) featSpellSlugs.push({ slug, source: `Feat (${fname})` })
        }
        // Magic Initiate cantrips + spell
        if (extras.miCantrips?.length) {
          for (const slug of extras.miCantrips) featSpellSlugs.push({ slug, source: `Feat (${fname})` })
        }
        if (extras.miSpell) featSpellSlugs.push({ slug: extras.miSpell, source: `Feat (${fname})` })
      }
      for (const sel of Object.values(featSelections)) {
        if (sel.type !== 'feat' || !sel.featName) continue
        collectFeatSpells(sel.featName, sel.featExtras)
      }
      // Also check humanOriginFeat for spell-granting feats
      if (selectedRace === 'Human' && humanOriginFeat) {
        collectFeatSpells(humanOriginFeat, humanOriginExtras)
      }
      if (featSpellSlugs.length > 0) {
        const featSpellDetails = await Promise.all(
          featSpellSlugs.map(({ slug, source }) =>
            getSpellDetail(slug).then(spell => ({ spell, source })).catch(() => null)
          )
        )
        const featSpellRows = featSpellDetails.filter((d): d is { spell: Awaited<ReturnType<typeof getSpellDetail>>; source: string } => d != null).map(({ spell, source }) => ({
          character_id: characterId,
          name: spell!.name,
          level: spell!.level,
          school: spell!.school.name,
          casting_time: spell!.casting_time,
          range: spell!.range,
          components: formatSpellComponents(spell!.components, spell!.material),
          duration: spell!.duration,
          is_concentration: spell!.concentration,
          is_ritual: spell!.ritual,
          is_prepared: true,
          description: formatSpellDescription(spell!.desc),
          higher_levels: spell!.higher_level?.join('\n\n') ?? '',
          source,
        }))
        if (featSpellRows.length > 0) {
          await supabase.from('spells').insert(featSpellRows)
        }
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character')
    }
  }

  // ─── Bonus helpers ───
  function getBonusFor(ability: AbilityScore): number {
    if (bonusMode === 'split') {
      if (ability === primaryBonus) return 2
      if (ability === secondaryBonus) return 1
      return 0
    }
    if (ability === primaryBonus || ability === secondaryBonus || ability === tertiaryBonus) return 1
    return 0
  }

  async function handlePreviewSpell(spellIndex: string) {
    setLoadingPreview(true)
    try {
      const detail = await getSpellDetail(spellIndex)
      setPreviewSpell(detail)
    } catch {
      // Silently fail
    } finally {
      setLoadingPreview(false)
    }
  }

  function rollDice4d6DropLowest(): number {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
    rolls.sort((a, b) => a - b)
    return rolls[1] + rolls[2] + rolls[3]
  }

  function rollSingleAbility(ability: AbilityScore) {
    const val = rollDice4d6DropLowest()
    setManualScores(prev => ({ ...prev, [ability]: val }))
    setManualInputStrings(prev => ({ ...prev, [ability]: String(val) }))
  }

  function rollAllAbilities() {
    const newScores: Record<string, number> = {}
    const newStrings: Record<string, string> = {}
    for (const ab of ABILITY_SCORES) {
      const val = rollDice4d6DropLowest()
      newScores[ab] = val
      newStrings[ab] = String(val)
    }
    setManualScores(newScores as Record<AbilityScore, number>)
    setManualInputStrings(newStrings as Record<AbilityScore, string>)
  }

  // ─── Standard Array swap helper ───
  function swapStandardScore(ability: AbilityScore, value: number) {
    const currentAbility = Object.entries(standardAssignment).find(([, v]) => v === value)?.[0] as AbilityScore | undefined
    if (!currentAbility) return
    setStandardAssignment(prev => ({
      ...prev,
      [ability]: value,
      [currentAbility]: prev[ability],
    }))
  }

  if (creationMode === 'choose') {
    return (
      <div className="min-h-screen bg-parchment-200 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <Swords className="text-gold-400 mx-auto mb-2" size={36} />
            <h1 className="font-display text-2xl text-ink-900">Create Your Character</h1>
            <p className="text-ink-500 text-sm mt-1">Choose how you'd like to get started</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setCreationMode('wizard')}
              className="w-full text-left p-5 bg-parchment-100 border border-parchment-300 rounded-lg hover:border-gold-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-gold-200 rounded-lg group-hover:bg-gold-300 transition-colors">
                  <Swords size={24} className="text-gold-700" />
                </div>
                <div>
                  <div className="font-display text-lg text-ink-900">Build from Scratch</div>
                  <p className="text-sm text-ink-500 mt-1">Step-by-step creation wizard using 2024 PHB rules</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="w-full text-left p-5 bg-parchment-100 border border-parchment-300 rounded-lg hover:border-gold-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-arcane-400/20 rounded-lg group-hover:bg-arcane-400/30 transition-colors">
                  <FileText size={24} className="text-arcane-500" />
                </div>
                <div>
                  <div className="font-display text-lg text-ink-900">Upload Character Sheet</div>
                  <p className="text-sm text-ink-500 mt-1">Import from a D&D 5e character sheet PDF</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="w-full text-left p-5 bg-parchment-100 border border-parchment-300 rounded-lg hover:border-gold-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-parchment-300 rounded-lg group-hover:bg-parchment-400/50 transition-colors">
                  <Upload size={24} className="text-ink-500" />
                </div>
                <div>
                  <div className="font-display text-lg text-ink-900">Import Squire File</div>
                  <p className="text-sm text-ink-500 mt-1">Load from a previously exported Squire JSON file</p>
                </div>
              </div>
            </button>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-ink-400 hover:text-ink-700 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {showImportModal && user && (
          <ImportCharacterModal
            open={showImportModal}
            onClose={() => setShowImportModal(false)}
            userId={user.id}
            onImportComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['character', user?.id] })
              navigate('/dashboard')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment-200 py-6 px-4">
      <EchoGuide step={step} />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Swords className="text-gold-400 mx-auto mb-2" size={36} />
          <h1 className="font-display text-2xl text-ink-900">Create Your Character</h1>
          <p className="text-ink-500 text-sm mt-1">2024 Player's Handbook</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  if (i <= maxCompletedStep) setStep(s.id)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-display uppercase tracking-wide transition-colors ${
                  i === currentStepIndex
                    ? 'bg-gold-400 text-ink-900'
                    : i <= maxCompletedStep
                    ? 'bg-gold-200 text-ink-700 cursor-pointer hover:bg-gold-300'
                    : 'bg-parchment-300 text-ink-400'
                }`}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 ${i < maxCompletedStep || i < currentStepIndex ? 'bg-gold-400' : 'bg-parchment-300'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
            {error}
          </div>
        )}

        {/* ─── SPECIES STEP ─── */}
        {step === 'species' && (
          <div className="space-y-4">
            <SectionHeader>Choose Your Species</SectionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RACES.map(race => {
                const data = getRaceData(race)
                const isSelected = selectedRace === race
                return (
                  <button
                    key={race}
                    onClick={() => { setSelectedRace(race); setSelectedSubrace(null) }}
                    className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      isSelected ? 'border-gold-400 bg-gold-100/50 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900">{race}</div>
                    {data && (
                      <div className="text-xs text-ink-500 mt-1">
                        {data.size} · {data.speed} ft
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {raceData && (
              <Card className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-gold-400" />
                  <h3 className="font-display text-lg text-ink-900">{selectedRace}</h3>
                  {selectedSubrace && <Badge variant="arcane">{selectedSubrace}</Badge>}
                  <Badge variant="gold">{raceData.size}</Badge>
                  <Badge variant="gold">{(effectiveRaceData ?? raceData).speed} ft</Badge>
                </div>
                <p className="text-sm text-ink-600 mb-3">{raceData.description}</p>

                {/* Subrace Selection */}
                {raceData.subraces && raceData.subraces.length > 0 && (
                  <>
                    <Divider />
                    <div className="text-xs font-display uppercase text-ink-500 mb-2">
                      Choose Your {selectedRace === 'Goliath' || selectedRace === 'Dragonborn' ? 'Ancestry' : 'Lineage'}
                    </div>
                    <div className={`grid gap-2 mb-3 ${raceData.subraces.length <= 3 ? 'grid-cols-3' : raceData.subraces.length <= 6 ? 'grid-cols-3 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
                      {raceData.subraces.map(sub => (
                        <button
                          key={sub.index}
                          onClick={() => setSelectedSubrace(sub.name)}
                          className={`p-2 rounded-lg border-2 text-left cursor-pointer transition-all ${
                            selectedSubrace === sub.name ? 'border-gold-400 bg-gold-100/50 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                          }`}
                        >
                          <div className="font-display text-xs text-ink-900">{sub.name}</div>
                          <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{sub.description}</p>
                        </button>
                      ))}
                    </div>
                    {!selectedSubrace && (
                      <p className="text-xs text-warning mb-2">Please select a {selectedRace === 'Goliath' || selectedRace === 'Dragonborn' ? 'ancestry' : 'lineage'} to continue.</p>
                    )}
                  </>
                )}

                <div className="text-xs font-display uppercase text-ink-500 mb-1">Languages</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {raceData.languages.map(l => (
                    <Badge key={l}>{l}</Badge>
                  ))}
                </div>

                <div className="text-xs font-display uppercase text-ink-500 mb-2">Species Traits</div>
                <div className="space-y-2">
                  {(effectiveRaceData ?? raceData).features.map(f => (
                    <div key={f.name} className="p-2 bg-parchment-100 rounded border border-parchment-300">
                      <div className="font-display text-sm text-ink-900">{f.name}</div>
                      <p className="text-xs text-ink-600 mt-0.5 whitespace-pre-wrap">{f.description}</p>
                    </div>
                  ))}
                </div>

                {/* Human Versatile: Origin Feat picker */}
                {selectedRace === 'Human' && (
                  <>
                    <Divider />
                    <div className="text-xs font-display uppercase text-ink-500 mb-2">Versatile — Choose an Origin Feat</div>
                    <p className="text-xs text-ink-400 mb-2">Humans gain one Origin feat of their choice in addition to their background's origin feat.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ORIGIN_FEATS.map(feat => {
                        const isSelected = humanOriginFeat === feat.name
                        return (
                          <button
                            key={feat.name}
                            onClick={() => setHumanOriginFeat(isSelected ? null : feat.name)}
                            className={`p-2 rounded-lg border-2 text-left cursor-pointer transition-all ${
                              isSelected ? 'border-gold-400 bg-gold-100/50 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                            }`}
                          >
                            <div className="font-display text-xs text-ink-900">{feat.name}</div>
                          </button>
                        )
                      })}
                    </div>
                    {humanOriginFeat && (() => {
                      const feat = ORIGIN_FEATS.find(f => f.name === humanOriginFeat)
                      if (!feat) return null
                      return (
                        <div className="mt-2 p-2 bg-gold-100/50 border border-gold-300 rounded">
                          <div className="font-display text-sm text-ink-900">{feat.name}</div>
                          <p className="text-xs text-ink-600 mt-1 whitespace-pre-wrap">{feat.description}</p>
                          <FeatExtrasUI
                            featName={humanOriginFeat}
                            extras={humanOriginExtras}
                            onExtrasChange={setHumanOriginExtras}
                            existingSkills={allSkillProficiencies.map(s => s.toLowerCase())}
                            proficiencyBonus={proficiencyBonus(startingLevel)}
                          />
                        </div>
                      )
                    })()}
                    {!humanOriginFeat && (
                      <p className="text-xs text-warning mt-1">Please select an Origin feat to continue.</p>
                    )}
                  </>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ─── CLASS STEP ─── */}
        {step === 'class' && (
          <div className="space-y-4">
            <SectionHeader>Choose Your Class</SectionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CLASSES.map(cls => {
                const data = getClassProfileData(cls)
                const isSelected = selectedClass === cls
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls)
                      setSelectedClassSkills([])
                      setSelectedSubclass(null)
                      setAdditionalClasses(prev => prev.filter(c => c.class !== cls))
                    }}
                    className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      isSelected ? 'border-gold-400 bg-gold-100/50 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900">{cls}</div>
                    {data && (
                      <div className="text-xs text-ink-500 mt-1">
                        d{data.hitDie} · {data.spellcastingAbility ? `${data.spellcastingAbility.slice(0, 3).toUpperCase()} caster` : 'Martial'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {classData && (
              <Card className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-gold-400" />
                  <h3 className="font-display text-lg text-ink-900">{selectedClass}</h3>
                  <Badge variant="gold">d{classData.hitDie}</Badge>
                  {classData.spellcastingAbility && (
                    <Badge variant="arcane">Spellcaster</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Hit Die</div>
                    <div className="text-ink-900">d{classData.hitDie} (HP at 1st: {classData.hitDie} + CON mod)</div>
                  </div>
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Saving Throws</div>
                    <div className="flex gap-1">
                      {classData.savingThrows.map(st => <Badge key={st}>{st}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Armor</div>
                    <div className="flex flex-wrap gap-1">
                      {classData.armorProficiencies.length > 0
                        ? classData.armorProficiencies.map(a => <Badge key={a}>{a}</Badge>)
                        : <span className="text-ink-400 text-xs">None</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Weapons</div>
                    <div className="flex flex-wrap gap-1">
                      {classData.weaponProficiencies.map(w => <Badge key={w}>{w}</Badge>)}
                    </div>
                  </div>
                  {classData.toolProficiencies.length > 0 && (
                    <div className="col-span-2">
                      <div className="text-xs font-display uppercase text-ink-500 mb-1">Tools</div>
                      <div className="flex flex-wrap gap-1">
                        {classData.toolProficiencies.map(t => <Badge key={t}>{t}</Badge>)}
                      </div>
                    </div>
                  )}
                  {classData.spellcastingAbility && (
                    <div className="col-span-2">
                      <div className="text-xs font-display uppercase text-ink-500 mb-1">Spellcasting Ability</div>
                      <div className="text-ink-900 capitalize">{classData.spellcastingAbility}</div>
                    </div>
                  )}
                </div>

                <Divider />
                <div className="text-xs text-ink-500">
                  You'll choose {classData.skillChoices.count} skill{classData.skillChoices.count > 1 ? 's' : ''} from this class in the Skills step.
                </div>
              </Card>
            )}

            {/* Starting Level selector */}
            <Card className="mt-4">
              <div className="text-xs font-display uppercase text-ink-500 mb-2">{isMulticlass ? `${selectedClass} Level` : 'Starting Level'}</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStartingLevel(prev => Math.max(1, prev - 1))}
                  disabled={startingLevel <= 1}
                  className="w-8 h-8 rounded border border-parchment-400 flex items-center justify-center cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                >
                  <Minus size={14} />
                </button>
                <span className="font-mono text-2xl font-bold text-ink-900 w-10 text-center">{startingLevel}</span>
                <button
                  onClick={() => setStartingLevel(prev => Math.min(20, prev + 1))}
                  disabled={startingLevel >= 20}
                  className="w-8 h-8 rounded border border-parchment-400 flex items-center justify-center cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                >
                  <Plus size={14} />
                </button>
                <span className="text-sm text-ink-500">
                  {isMulticlass ? `Total character level ${totalCharLevel}` : (startingLevel > 1 && `${XP_THRESHOLDS[startingLevel]?.toLocaleString()} XP`)}
                </span>
              </div>
            </Card>

            {/* Multiclass (optional) */}
            <Card className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-gold-400" />
                <h3 className="font-display text-lg text-ink-900">Multiclass (optional)</h3>
              </div>
              <p className="text-xs text-ink-500 mb-3">
                Add levels in other classes. Your total character level is the sum of all class levels
                (max 20). Each added class picks its own subclass once it reaches the required level.
                Spells for a secondary caster class can be added from the Spells tab after creation.
              </p>

              {additionalClasses.map((ac, idx) => {
                const ccd = getClassChoiceData(ac.class)
                const scLevel = ccd?.subclassLevel ?? 99
                const used = new Set([selectedClass, ...additionalClasses.filter((_, i) => i !== idx).map(c => c.class)])
                const options = CLASSES.filter(c => !used.has(c) || c === ac.class)
                return (
                  <div key={idx} className="flex flex-wrap items-center gap-2 mb-2 p-2 border border-parchment-300 rounded-lg">
                    <select
                      value={ac.class}
                      onChange={(e) => setAdditionalClasses(prev => prev.map((c, i) => i === idx ? { class: e.target.value, level: c.level, subclass: null } : c))}
                      className="text-sm px-2 py-1 border border-parchment-400 rounded bg-parchment-50 text-ink-900"
                    >
                      {options.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAdditionalClasses(prev => prev.map((c, i) => i === idx ? { ...c, level: Math.max(1, c.level - 1) } : c))} className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center cursor-pointer hover:bg-parchment-200"><Minus size={12} /></button>
                      <span className="font-mono text-lg font-bold text-ink-900 w-6 text-center">{ac.level}</span>
                      <button onClick={() => setAdditionalClasses(prev => prev.map((c, i) => i === idx ? { ...c, level: c.level + 1 } : c))} disabled={totalCharLevel >= 20} className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center cursor-pointer disabled:opacity-30 hover:bg-parchment-200"><Plus size={12} /></button>
                    </div>
                    {ac.level >= scLevel && ccd && (
                      <select
                        value={ac.subclass ?? ''}
                        onChange={(e) => setAdditionalClasses(prev => prev.map((c, i) => i === idx ? { ...c, subclass: e.target.value || null } : c))}
                        className="text-sm px-2 py-1 border border-parchment-400 rounded bg-parchment-50 text-ink-900"
                      >
                        <option value="">{ccd.subclassLabel}…</option>
                        {ccd.subclasses.map(s => <option key={s.index} value={s.name}>{s.name}</option>)}
                      </select>
                    )}
                    <button onClick={() => setAdditionalClasses(prev => prev.filter((_, i) => i !== idx))} className="ml-auto text-ink-400 hover:text-danger cursor-pointer" title="Remove class"><X size={16} /></button>
                  </div>
                )
              })}

              {(() => {
                const used = new Set([selectedClass, ...additionalClasses.map(c => c.class)])
                const avail = CLASSES.filter(c => !used.has(c))
                return (
                  <button
                    onClick={() => { if (avail.length && totalCharLevel < 20) setAdditionalClasses(prev => [...prev, { class: avail[0], level: 1, subclass: null }]) }}
                    disabled={avail.length === 0 || totalCharLevel >= 20}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-dashed border-parchment-400 text-sm text-ink-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={14} /> Add another class
                  </button>
                )
              })()}
            </Card>

            {/* Subclass selection */}
            {needsSubclass && classChoiceData && (
              <Card className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-arcane-500" />
                  <h3 className="font-display text-lg text-ink-900">Choose Your {classChoiceData.subclassLabel}</h3>
                </div>
                <p className="text-xs text-ink-500 mb-3">
                  {selectedClass === 'Cleric' ? 'Your divine domain grants you additional spells and abilities.'
                    : selectedClass === 'Warlock' ? 'Your otherworldly patron shapes your magic and abilities.'
                    : selectedClass === 'Sorcerer' ? 'Your sorcerous origin defines the source of your innate magic.'
                    : `At level ${classChoiceData.subclassLevel}, you choose your ${classChoiceData.subclassLabel.toLowerCase()}.`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classChoiceData.subclasses.map(sub => (
                    <button
                      key={sub.index}
                      onClick={() => setSelectedSubclass(sub.name)}
                      className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                        selectedSubclass === sub.name ? 'border-arcane-500 bg-arcane-400/10 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                      }`}
                    >
                      <div className="font-display text-sm text-ink-900">{sub.name}</div>
                    </button>
                  ))}
                </div>

                {selectedSubclass && (() => {
                  const sub = classChoiceData.subclasses.find(s => s.name === selectedSubclass)
                  if (!sub) return null
                  return (
                    <div className="mt-3 p-3 bg-arcane-400/5 border border-arcane-400/20 rounded-lg">
                      <div className="font-display text-sm text-ink-900 mb-1">{sub.name}</div>
                      <p className="text-xs text-ink-600 whitespace-pre-wrap">{sub.description}</p>
                      {sub.spells && sub.spells.filter(sp => sp.grantedAtLevel <= startingLevel).length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-display uppercase text-ink-500 mb-1">Granted Spells</div>
                          <div className="flex flex-wrap gap-1">
                            {sub.spells.filter(sp => sp.grantedAtLevel <= startingLevel).map(sp => (
                              <Badge key={sp.index} variant="arcane">{sp.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {!selectedSubclass && needsSubclass && (
                  <p className="text-xs text-warning mt-2">Please select a {classChoiceData.subclassLabel.toLowerCase()} to continue.</p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ─── BACKGROUND STEP ─── */}
        {step === 'background' && (
          <div className="space-y-4">
            <SectionHeader>Choose Your Background</SectionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BACKGROUNDS.map(bg => {
                const data = getBackgroundData(bg)
                const isSelected = selectedBackground === bg
                return (
                  <button
                    key={bg}
                    onClick={() => {
                      setSelectedBackground(bg)
                      setSkilledFeatPicks([])
                      if (data?.abilityScores?.options) {
                        setPrimaryBonus(data.abilityScores.options[0] as AbilityScore)
                        setSecondaryBonus(data.abilityScores.options[1] as AbilityScore)
                        setTertiaryBonus(data.abilityScores.options[2] as AbilityScore)
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                      isSelected ? 'border-gold-400 bg-gold-100/50 shadow-md' : 'border-parchment-300 hover:border-parchment-400'
                    }`}
                  >
                    <div className="font-display text-sm text-ink-900">{bg}</div>
                    {data && (
                      <div className="text-xs text-ink-500 mt-0.5">
                        {data.skillProficiencies.join(', ')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {backgroundData && (
              <Card className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-gold-400" />
                  <h3 className="font-display text-lg text-ink-900">{selectedBackground}</h3>
                </div>
                <p className="text-sm text-ink-600 mb-3">{backgroundData.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Skill Proficiencies</div>
                    <div className="flex gap-1">
                      {backgroundData.skillProficiencies.map(s => <Badge key={s}>{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-display uppercase text-ink-500 mb-1">Tool Proficiency</div>
                    <Badge>{backgroundData.toolProficiency}</Badge>
                  </div>
                </div>

                {/* Origin Feat */}
                <div className="p-3 bg-gold-50 border border-gold-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-gold-500" />
                    <span className="font-display text-sm text-ink-900">Origin Feat: {backgroundData.originFeat.name}</span>
                  </div>
                  <p className="text-xs text-ink-600">{backgroundData.originFeat.description}</p>

                  {/* Skilled feat: pick 3 skills or tools */}
                  {backgroundData.originFeat.name === 'Skilled' && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-display uppercase text-ink-500">Choose 3 Skills or Tools</div>
                      {[0, 1, 2].map(i => (
                        <select
                          key={i}
                          value={skilledFeatPicks[i] ?? ''}
                          onChange={e => {
                            const picks = [...skilledFeatPicks]
                            picks[i] = e.target.value
                            setSkilledFeatPicks(picks.filter(Boolean))
                          }}
                          className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                        >
                          <option value="">— Select —</option>
                          <optgroup label="Skills">
                            {SKILLS.map(s => (
                              <option key={s.name} value={s.name} disabled={skilledFeatPicks.includes(s.name) && skilledFeatPicks[i] !== s.name}>
                                {s.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Tools">
                            {["Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools", "Disguise Kit", "Forgery Kit", "Herbalism Kit", "Navigator's Tools", "Poisoner's Kit", "Thieves' Tools"].map(t => (
                              <option key={t} value={t} disabled={skilledFeatPicks.includes(t) && skilledFeatPicks[i] !== t}>
                                {t}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ability Score Bonuses */}
                <Divider />
                <div className="text-xs font-display uppercase text-ink-500 mb-2">Ability Score Increases</div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setBonusMode('split')}
                    className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                      bonusMode === 'split' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                    }`}
                  >
                    <div className="font-display text-xs uppercase">+2 and +1</div>
                  </button>
                  <button
                    onClick={() => setBonusMode('even')}
                    className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                      bonusMode === 'even' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                    }`}
                  >
                    <div className="font-display text-xs uppercase">+1, +1, +1</div>
                  </button>
                </div>

                {(() => {
                  const allowedScores = (backgroundData?.abilityScores?.options ?? ABILITY_SCORES) as AbilityScore[]
                  return bonusMode === 'split' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-display uppercase text-ink-500 mb-1">+2 Bonus</label>
                      <select
                        value={primaryBonus}
                        onChange={e => {
                          const val = e.target.value as AbilityScore
                          if (val === secondaryBonus) setSecondaryBonus(primaryBonus)
                          setPrimaryBonus(val)
                        }}
                        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                      >
                        {allowedScores.map(ab => (
                          <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-display uppercase text-ink-500 mb-1">+1 Bonus</label>
                      <select
                        value={secondaryBonus}
                        onChange={e => {
                          const val = e.target.value as AbilityScore
                          if (val === primaryBonus) setPrimaryBonus(secondaryBonus)
                          setSecondaryBonus(val)
                        }}
                        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                      >
                        {allowedScores.map(ab => (
                          <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'First +1', value: primaryBonus, setter: setPrimaryBonus },
                      { label: 'Second +1', value: secondaryBonus, setter: setSecondaryBonus },
                      { label: 'Third +1', value: tertiaryBonus, setter: setTertiaryBonus },
                    ] as const).map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="block text-xs font-display uppercase text-ink-500 mb-1">{label}</label>
                        <select
                          value={value}
                          onChange={e => setter(e.target.value as AbilityScore)}
                          className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                        >
                          {allowedScores.map(ab => (
                            <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )
                })()}
                {bonusMode === 'split' && primaryBonus === secondaryBonus && (
                  <p className="text-xs text-danger mt-2">Both bonuses cannot be assigned to the same ability.</p>
                )}
                {bonusMode === 'even' && new Set([primaryBonus, secondaryBonus, tertiaryBonus]).size < 3 && (
                  <p className="text-xs text-danger mt-2">All three bonuses must be assigned to different abilities.</p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ─── ABILITIES STEP ─── */}
        {step === 'abilities' && (
          <div className="space-y-4">
            <SectionHeader>Ability Scores</SectionHeader>

            {/* Method selector */}
            <div className="flex gap-2">
              {(['standard', 'pointbuy', 'manual'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setAbilityMethod(method)}
                  className={`flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    abilityMethod === method ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">
                    {method === 'standard' ? 'Standard Array' : method === 'pointbuy' ? 'Point Buy' : 'Manual'}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {method === 'standard' ? '15, 14, 13, 12, 10, 8'
                      : method === 'pointbuy' ? `${POINT_BUY_BUDGET} points`
                      : 'Enter scores'}
                  </div>
                </button>
              ))}
            </div>

            {/* Standard Array */}
            {abilityMethod === 'standard' && (
              <Card>
                <p className="text-xs text-ink-500 mb-3">Assign each value from the Standard Array to an ability. Click a score to swap it.</p>
                <div className="space-y-2">
                  {ABILITY_SCORES.map(ability => (
                    <div key={ability} className="flex items-center gap-3 p-2 rounded hover:bg-parchment-100">
                      <span className="font-display text-sm w-12 uppercase text-ink-500">{ABILITY_ABBREVIATIONS[ability]}</span>
                      <select
                        value={standardAssignment[ability]}
                        onChange={e => swapStandardScore(ability, parseInt(e.target.value))}
                        className="px-3 py-1.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm focus:outline-none focus:border-gold-400"
                      >
                        {STANDARD_ARRAY.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      {getBonusFor(ability) > 0 && (
                        <Badge variant="gold">+{getBonusFor(ability)} BG</Badge>
                      )}
                      <span className="font-mono text-sm text-ink-700 ml-auto">
                        = {standardAssignment[ability] + getBonusFor(ability)}
                        {' '}
                        <span className="text-ink-500">
                          ({formatModifier(abilityModifier(standardAssignment[ability] + getBonusFor(ability)))})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Point Buy */}
            {abilityMethod === 'pointbuy' && (
              <Card>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-ink-500">Distribute {POINT_BUY_BUDGET} points. Scores range 8-15.</p>
                  <span className={`font-mono text-sm font-bold ${pointBuySpent === POINT_BUY_BUDGET ? 'text-gold-500' : pointBuySpent > POINT_BUY_BUDGET ? 'text-danger' : 'text-ink-500'}`}>
                    {pointBuySpent} / {POINT_BUY_BUDGET}
                  </span>
                </div>
                <div className="space-y-2">
                  {ABILITY_SCORES.map(ability => {
                    const score = pointBuyScores[ability]
                    const bonus = getBonusFor(ability)
                    const finalVal = score + bonus
                    return (
                      <div key={ability} className="flex items-center gap-3 p-2 rounded hover:bg-parchment-100">
                        <span className="font-display text-sm w-12 uppercase text-ink-500">{ABILITY_ABBREVIATIONS[ability]}</span>
                        <button
                          onClick={() => setPointBuyScores(prev => ({ ...prev, [ability]: Math.max(8, score - 1) }))}
                          disabled={score <= 8}
                          className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-sm w-6 text-center font-bold text-ink-900">{score}</span>
                        <button
                          onClick={() => setPointBuyScores(prev => ({ ...prev, [ability]: Math.min(15, score + 1) }))}
                          disabled={score >= 15 || pointBuySpent + ((POINT_BUY_COSTS[score + 1] ?? 99) - (POINT_BUY_COSTS[score] ?? 0)) > POINT_BUY_BUDGET}
                          className="w-7 h-7 rounded border border-parchment-400 flex items-center justify-center cursor-pointer disabled:opacity-30 hover:bg-parchment-200"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="text-xs text-ink-400 w-10 text-center">({POINT_BUY_COSTS[score] ?? 0} pts)</span>
                        {bonus > 0 && (
                          <Badge variant="gold">+{bonus}</Badge>
                        )}
                        <span className="font-mono text-sm text-ink-700 ml-auto">
                          = {finalVal} ({formatModifier(abilityModifier(finalVal))})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Manual Entry */}
            {abilityMethod === 'manual' && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ink-500">Enter your ability scores directly or roll for them.</p>
                  <Button size="sm" variant="secondary" onClick={rollAllAbilities}>
                    <Dices size={14} className="mr-1" /> Roll All (4d6 drop lowest)
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ABILITY_SCORES.map(ability => {
                    const bonus = getBonusFor(ability)
                    const finalVal = manualScores[ability] + bonus
                    return (
                      <div key={ability} className="text-center">
                        <label className="block text-xs font-display uppercase text-ink-500 mb-1">
                          {ABILITY_ABBREVIATIONS[ability]}
                          {bonus > 0 && (
                            <span className="text-gold-500 ml-1">(+{bonus})</span>
                          )}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={manualInputStrings[ability]}
                            onChange={e => {
                              setManualInputStrings(prev => ({ ...prev, [ability]: e.target.value }))
                              const parsed = parseInt(e.target.value)
                              if (!isNaN(parsed)) {
                                setManualScores(prev => ({ ...prev, [ability]: Math.min(20, Math.max(1, parsed)) }))
                              }
                            }}
                            onBlur={() => {
                              const parsed = parseInt(manualInputStrings[ability])
                              const val = isNaN(parsed) ? 8 : Math.min(20, Math.max(1, parsed))
                              setManualScores(prev => ({ ...prev, [ability]: val }))
                              setManualInputStrings(prev => ({ ...prev, [ability]: String(val) }))
                            }}
                            className="flex-1 px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-mono text-center text-lg focus:outline-none focus:border-gold-400"
                          />
                          <button
                            onClick={() => rollSingleAbility(ability)}
                            className="p-2 rounded border border-parchment-400 hover:bg-gold-100 hover:border-gold-400 transition-colors cursor-pointer shrink-0"
                            title="Roll 4d6 drop lowest"
                          >
                            <Dices size={16} className="text-gold-500" />
                          </button>
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          Final: {finalVal} ({formatModifier(abilityModifier(finalVal))})
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Final Scores Summary */}
            <Card>
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Final Ability Scores (with background bonuses)</div>
              <div className="grid grid-cols-6 gap-2 text-center">
                {ABILITY_SCORES.map(ability => (
                  <div key={ability} className="p-2 bg-parchment-100 rounded border border-parchment-300">
                    <div className="text-xs font-display uppercase text-ink-500">{ABILITY_ABBREVIATIONS[ability]}</div>
                    <div className="font-mono text-xl font-bold text-ink-900">{finalScores[ability]}</div>
                    <div className="text-xs text-ink-500">{formatModifier(abilityModifier(finalScores[ability]))}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── SKILLS STEP ─── */}
        {step === 'skills' && classData && (
          <div className="space-y-4">
            <SectionHeader>Proficiencies & Skills</SectionHeader>

            {/* Auto-granted skill proficiencies from background */}
            {backgroundData && backgroundData.skillProficiencies.length > 0 && (
              <Card>
                <div className="text-xs font-display uppercase text-ink-500 mb-2">From Background ({selectedBackground})</div>
                <div className="flex flex-wrap gap-1.5">
                  {backgroundData.skillProficiencies.map(s => (
                    <Badge key={s} variant="gold">{s}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Species skill proficiencies */}
            {effectiveRaceData?.skillProficiencies && effectiveRaceData.skillProficiencies.length > 0 && (
              <Card>
                <div className="text-xs font-display uppercase text-ink-500 mb-2">From Species ({selectedRace})</div>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveRaceData!.skillProficiencies!.map(s => (
                    <Badge key={s} variant="gold">{s}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Species skill choices (Human Skillful, etc.) */}
            {effectiveRaceData?.skillChoiceCount && effectiveRaceData.skillChoiceCount > 0 && (
              <Card>
                <div className="text-xs font-display uppercase text-ink-500 mb-1">
                  Species Skill Choice ({selectedRaceSkills.length}/{effectiveRaceData.skillChoiceCount})
                </div>
                <p className="text-xs text-ink-500 mb-3">
                  Your species grants proficiency in {effectiveRaceData.skillChoiceCount} skill{effectiveRaceData.skillChoiceCount > 1 ? 's' : ''} of your choice.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS.map(({ name: skill }) => {
                    const isAutoGranted = backgroundData?.skillProficiencies.includes(skill) || effectiveRaceData?.skillProficiencies?.includes(skill)
                    const isSelected = selectedRaceSkills.includes(skill)
                    const atMax = selectedRaceSkills.length >= (effectiveRaceData?.skillChoiceCount ?? 0)

                    if (isAutoGranted) return null

                    return (
                      <button
                        key={skill}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRaceSkills(prev => prev.filter(s => s !== skill))
                          } else if (!atMax) {
                            setSelectedRaceSkills(prev => [...prev, skill])
                          }
                        }}
                        disabled={!isSelected && atMax}
                        className={`p-2 rounded border-2 text-sm text-left cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default ${
                          isSelected ? 'border-gold-400 bg-gold-100/50 text-ink-900' : 'border-parchment-300 text-ink-700 hover:border-gold-300'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Class skill choices */}
            <Card>
              <div className="text-xs font-display uppercase text-ink-500 mb-1">
                Choose from {selectedClass} ({selectedClassSkills.length}/{classData.skillChoices.count})
              </div>
              <p className="text-xs text-ink-500 mb-3">
                Select {classData.skillChoices.count} skill{classData.skillChoices.count > 1 ? 's' : ''} from the list below.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {classData.skillChoices.from.map(skill => {
                  const isAutoGranted = (backgroundData?.skillProficiencies.includes(skill) || effectiveRaceData?.skillProficiencies?.includes(skill) || selectedRaceSkills.includes(skill) || skilledFeatPicks.includes(skill))
                  const isSelected = selectedClassSkills.includes(skill)
                  const atMax = selectedClassSkills.length >= classData.skillChoices.count

                  if (isAutoGranted) {
                    return (
                      <div key={skill} className="p-2 rounded border border-parchment-300 bg-parchment-100 opacity-50">
                        <span className="text-sm text-ink-400">{skill}</span>
                        <span className="text-xs text-ink-400 ml-1">(already proficient)</span>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={skill}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedClassSkills(prev => prev.filter(s => s !== skill))
                        } else if (!atMax) {
                          setSelectedClassSkills(prev => [...prev, skill])
                        }
                      }}
                      disabled={!isSelected && atMax}
                      className={`p-2 rounded border-2 text-left cursor-pointer transition-colors ${
                        isSelected ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300 hover:border-parchment-400 disabled:opacity-40 disabled:cursor-default'
                      }`}
                    >
                      <span className="text-sm text-ink-900">{skill}</span>
                      {isSelected && <Check size={14} className="inline ml-1 text-gold-500" />}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Extra Languages */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-display uppercase text-ink-500">Languages</div>
                {(() => {
                  const maxExtra = raceData?.extraLanguageSlots ?? 0
                  return maxExtra > 0 || dmLanguageOverride ? (
                    <span className="text-xs text-ink-500">
                      {dmLanguageOverride ? `${extraLanguages.length} extra` : `${extraLanguages.length}/${maxExtra} additional`}
                    </span>
                  ) : null
                })()}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allLanguages.map(lang => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gold-100 border border-gold-300 rounded-full text-xs font-display text-ink-900"
                  >
                    {lang}
                    {!raceData?.languages.includes(lang) && (
                      <button
                        type="button"
                        onClick={() => setExtraLanguages(prev => prev.filter(l => l !== lang))}
                        className="text-ink-400 hover:text-danger cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {(() => {
                const maxExtra = raceData?.extraLanguageSlots ?? 0
                const atLimit = !dmLanguageOverride && extraLanguages.length >= maxExtra
                return (
                  <>
                    <select
                      disabled={atLimit}
                      onChange={e => {
                        const val = e.target.value
                        if (val && !allLanguages.includes(val)) {
                          setExtraLanguages(prev => [...prev, val])
                        }
                        e.target.value = ''
                      }}
                      className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">{atLimit ? 'No additional language slots' : 'Add a language...'}</option>
                      <optgroup label="Standard">
                        {STANDARD_LANGUAGES.filter(l => !allLanguages.includes(l)).map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Rare">
                        {RARE_LANGUAGES.filter(l => !allLanguages.includes(l)).map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </optgroup>
                    </select>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dmLanguageOverride}
                        onChange={e => setDmLanguageOverride(e.target.checked)}
                        className="rounded border-parchment-400"
                      />
                      <span className="text-xs text-ink-500">DM Override (allow additional languages)</span>
                    </label>
                  </>
                )
              })()}
            </Card>
          </div>
        )}

        {/* ─── FEAT SELECTION STEP ─── */}
        {step === 'asi' && (
          <div className="space-y-4">
            <SectionHeader>Feat Selection</SectionHeader>
            <p className="text-sm text-ink-500">At each of these levels, choose the Ability Score Improvement feat or pick a different feat.</p>
            <FeatSelectionStep
              asiLevels={asiLevels}
              selections={featSelections}
              onSelectionsChange={setFeatSelections}
              selectedClass={selectedClass}
              prerequisiteContext={{
                ...finalScoresWithASI,
                armorProficiencies: classData?.armorProficiencies ?? [],
                hasSpellcasting: !!classData?.spellcastingAbility,
                hasFightingStyle: classChoiceData?.featureChoices?.some(fc => fc.label.toLowerCase().includes('fighting style')) ?? false,
              }}
            />
          </div>
        )}

        {/* ─── FEATURE CHOICES STEP ─── */}
        {step === 'feature-choices' && (
          <div className="space-y-4">
            <SectionHeader>Feature Choices</SectionHeader>
            <FeatureChoicesStep
              choices={availableFeatureChoices}
              selections={featureChoiceSelections}
              onSelectionsChange={setFeatureChoiceSelections}
            />
          </div>
        )}

        {/* ─── WEAPON MASTERY STEP ─── */}
        {step === 'weapon-mastery' && (
          <div className="space-y-4">
            <SectionHeader>Weapon Mastery</SectionHeader>
            <WeaponMasteryStep
              maxChoices={weaponMasterySlots}
              selected={selectedWeaponMasteries}
              weaponProficiencies={classData?.weaponProficiencies ?? []}
              onChange={setSelectedWeaponMasteries}
              className={selectedClass}
            />
          </div>
        )}

        {/* ─── EQUIPMENT STEP ─── */}
        {step === 'equipment' && (
          <div className="space-y-4">
            <SectionHeader>Starting Equipment</SectionHeader>
            <p className="text-xs text-ink-500">For each source, choose the equipment pack or take gold instead.</p>

            {/* Class A/B choice */}
            <div>
              <div className="text-xs font-display uppercase text-ink-500 mb-1">{selectedClass} Class Equipment</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setClassEquipChoice('A')}
                  className={`flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    classEquipChoice === 'A' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Option A</div>
                  <div className="text-xs text-ink-500 mt-1">Class Equipment</div>
                </button>
                <button
                  onClick={() => setClassEquipChoice('B')}
                  className={`flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    classEquipChoice === 'B' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Option B</div>
                  <div className="text-xs text-ink-500 mt-1">{classData?.startingGold ?? 75} GP instead</div>
                </button>
              </div>
            </div>

            {/* Background A/B choice */}
            <div>
              <div className="text-xs font-display uppercase text-ink-500 mb-1">{selectedBackground} Background Equipment</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBgEquipChoice('A')}
                  className={`flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    bgEquipChoice === 'A' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Option A</div>
                  <div className="text-xs text-ink-500 mt-1">Background Equipment</div>
                </button>
                <button
                  onClick={() => setBgEquipChoice('B')}
                  className={`flex-1 p-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    bgEquipChoice === 'B' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Option B</div>
                  <div className="text-xs text-ink-500 mt-1">50 GP instead</div>
                </button>
              </div>
            </div>

            {startingLevel >= 5 && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setUseGoldByLevel(false)}
                  className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    !useGoldByLevel ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Background Equipment</div>
                </button>
                <button
                  onClick={() => { setUseGoldByLevel(true); setStartingGold(getStartingGoldByLevel(startingLevel)) }}
                  className={`flex-1 p-2 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                    useGoldByLevel ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300'
                  }`}
                >
                  <div className="font-display text-xs uppercase">Starting Gold by Level</div>
                </button>
              </div>
            )}

            {!useGoldByLevel && (<>
            <Card>
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Items</div>
              <div className="space-y-2">
                {[...equipmentItems, ...customItems].map((item, i) => (
                  <div key={`${item.name}-${i}`} className="flex items-center justify-between p-2 bg-parchment-100 rounded border border-parchment-300">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-900">{item.name}</span>
                      {item.quantity > 1 && <Badge>{item.quantity}</Badge>}
                      <Badge variant="default">{item.category}</Badge>
                    </div>
                    <button
                      onClick={() => {
                        if (i < equipmentItems.length) {
                          setEquipmentItems(prev => prev.filter((_, idx) => idx !== i))
                        } else {
                          setCustomItems(prev => prev.filter((_, idx) => idx !== i - equipmentItems.length))
                        }
                      }}
                      className="text-ink-400 hover:text-danger cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {equipmentItems.length === 0 && customItems.length === 0 && (
                  <p className="text-xs text-ink-400 text-center py-4">No items. Add some below.</p>
                )}
              </div>
            </Card>

            <Card>
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Add Item</div>
              <div className="flex gap-2">
                <Input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Item name..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newItemName.trim()) {
                      setCustomItems(prev => [...prev, { name: newItemName.trim(), quantity: 1, category: 'gear', weight: 0, description: '' }])
                      setNewItemName('')
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!newItemName.trim()}
                  onClick={() => {
                    if (newItemName.trim()) {
                      setCustomItems(prev => [...prev, { name: newItemName.trim(), quantity: 1, category: 'gear', weight: 0, description: '' }])
                      setNewItemName('')
                    }
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </Card>
            </>)}

            <Card>
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Starting Gold</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={startingGold}
                  onChange={e => setStartingGold(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-mono text-center focus:outline-none focus:border-gold-400"
                />
                <span className="text-sm text-gold-500 font-display">GP</span>
              </div>
            </Card>

            {/* Signature Weapon for Dragon-Rider */}
            {isDragonRider && (
              <Card>
                <SectionHeader>Signature Weapon</SectionHeader>
                <p className="text-xs text-ink-400 mb-3">
                  Choose any weapon as your Signature. It's mundane at first, but it will awaken as you grow.
                  It cannot be permanently broken or destroyed, and you can recall it after a long rest.
                </p>
                <Input
                  label="Signature Weapon"
                  value={signatureWeaponName}
                  onChange={e => setSignatureWeaponName(e.target.value)}
                  placeholder="e.g. Longsword, Longbow, Lance, Greatsword..."
                  required
                />
              </Card>
            )}
          </div>
        )}

        {/* ─── SPELLS STEP ─── */}
        {step === 'spells' && (isCaster || magicInitiateClass) && (
          <div className="space-y-4">
            {/* Magic Initiate Spell Selection */}
            {magicInitiateClass && miSpellList.length > 0 && (
              <>
                <SectionHeader>Magic Initiate ({magicInitiateClass.charAt(0).toUpperCase() + magicInitiateClass.slice(1)})</SectionHeader>
                <Card className="bg-arcane-400/5 border-arcane-400/20">
                  <p className="text-sm text-ink-600 mb-3">
                    Your background grants Magic Initiate. Choose 2 cantrips and 1 level 1 spell from the {magicInitiateClass.charAt(0).toUpperCase() + magicInitiateClass.slice(1)} spell list.
                  </p>

                  {/* MI Cantrips */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-display uppercase text-ink-500">Cantrips</div>
                      <Badge variant={miCantrips.length === 2 ? 'gold' : 'default'}>{miCantrips.length}/2</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {miSpellList.filter(s => s.level === 0).map(spell => {
                        const isSelected = miCantrips.includes(spell.index)
                        const atMax = miCantrips.length >= 2
                        return (
                          <div key={spell.index} className={`flex items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            isSelected ? 'border-arcane-500 bg-arcane-400/10' : 'border-parchment-300'
                          }`}>
                            <button
                              onClick={() => {
                                if (isSelected) setMiCantrips(prev => prev.filter(s => s !== spell.index))
                                else if (!atMax) setMiCantrips(prev => [...prev, spell.index])
                              }}
                              disabled={!isSelected && atMax}
                              className="flex-1 text-left cursor-pointer disabled:opacity-40 disabled:cursor-default"
                            >
                              <div className="font-display text-xs text-ink-900">{spell.name}</div>
                            </button>
                            <button onClick={() => handlePreviewSpell(spell.index)} className="p-1 text-ink-300 hover:text-arcane-500 cursor-pointer shrink-0" title="View spell details">
                              <Info size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* MI Level 1 Spell */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-display uppercase text-ink-500">1st-Level Spell</div>
                      <Badge variant={miSpell ? 'gold' : 'default'}>{miSpell ? 1 : 0}/1</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {miSpellList.filter(s => s.level === 1).map(spell => {
                        const isSelected = miSpell === spell.index
                        return (
                          <div key={spell.index} className={`flex items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            isSelected ? 'border-arcane-500 bg-arcane-400/10' : 'border-parchment-300'
                          }`}>
                            <button
                              onClick={() => setMiSpell(isSelected ? null : spell.index)}
                              disabled={!isSelected && miSpell !== null}
                              className="flex-1 text-left cursor-pointer disabled:opacity-40 disabled:cursor-default"
                            >
                              <div className="font-display text-xs text-ink-900">{spell.name}</div>
                            </button>
                            <button onClick={() => handlePreviewSpell(spell.index)} className="p-1 text-ink-300 hover:text-arcane-500 cursor-pointer shrink-0" title="View spell details">
                              <Info size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </>
            )}

            {isCaster && <SectionHeader>Starting Spells</SectionHeader>}

            {loadingSpells ? (
              <Card>
                <div className="flex items-center justify-center py-8 gap-2 text-ink-500">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading spells from the archives...</span>
                </div>
              </Card>
            ) : !spellRules?.hasSpells ? (
              <Card>
                <p className="text-sm text-ink-500 text-center py-4">
                  As a {selectedClass}, you'll gain spellcasting at a higher level. No spells to select yet.
                </p>
              </Card>
            ) : (
              <>
                {spellRules.isPreparedCaster && (
                  <Card className="bg-arcane-400/5 border-arcane-400/20">
                    <p className="text-sm text-ink-600">
                      As a {selectedClass}, you prepare {spellRules.preparedCount} spell{spellRules.preparedCount !== 1 ? 's' : ''} from the full {selectedClass} spell list.
                      {spellRules.cantripsKnown > 0
                        ? ' Choose your cantrips and prepared spells below.'
                        : ' Choose your prepared spells below.'}
                      {' '}You can change your prepared spells anytime from the Spells tab.
                    </p>
                  </Card>
                )}

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={spellSearch}
                    onChange={e => setSpellSearch(e.target.value)}
                    placeholder="Search spells..."
                    className="w-full pl-9 pr-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Cantrips */}
                {spellRules.cantripsKnown > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-display uppercase text-ink-500">Cantrips</div>
                      <Badge variant={selectedCantrips.length === spellRules.cantripsKnown ? 'gold' : 'default'}>
                        {selectedCantrips.length}/{spellRules.cantripsKnown}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cantrips
                        .filter(s => !spellSearch || s.name.toLowerCase().includes(spellSearch.toLowerCase()))
                        .map(spell => {
                          const isSelected = selectedCantrips.includes(spell.index)
                          const atMax = selectedCantrips.length >= spellRules.cantripsKnown
                          return (
                            <div key={spell.index} className={`flex items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                              isSelected ? 'border-arcane-500 bg-arcane-400/10' : 'border-parchment-300 disabled:opacity-40'
                            }`}>
                              <button
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCantrips(prev => prev.filter(s => s !== spell.index))
                                  } else if (!atMax) {
                                    setSelectedCantrips(prev => [...prev, spell.index])
                                  }
                                }}
                                disabled={!isSelected && atMax}
                                className="flex-1 text-left cursor-pointer disabled:opacity-40 disabled:cursor-default"
                              >
                                <div className="font-display text-xs text-ink-900">{spell.name}</div>
                                <div className="text-xs text-ink-500">Cantrip</div>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePreviewSpell(spell.index) }}
                                className="p-1 text-ink-300 hover:text-arcane-500 cursor-pointer shrink-0"
                                title="View spell details"
                              >
                                <Info size={14} />
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  </Card>
                )}

                {/* Leveled Spells */}
                {leveledSpellTarget > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-display uppercase text-ink-500">{spellRules.isPreparedCaster ? 'Prepared Spells' : spellRules.spellSelectionLabel}</div>
                      <Badge variant={selectedSpells.length === leveledSpellTarget ? 'gold' : 'default'}>
                        {selectedSpells.length}/{leveledSpellTarget}
                      </Badge>
                    </div>
                    {Array.from({ length: spellRules.maxSpellLevel }, (_, i) => i + 1).map(spellLevel => {
                      const spellsAtLevel = availableSpells.filter(s => s.level === spellLevel)
                        .filter(s => !spellSearch || s.name.toLowerCase().includes(spellSearch.toLowerCase()))
                      if (spellsAtLevel.length === 0) return null
                      const levelLabel = spellLevel === 1 ? '1st' : spellLevel === 2 ? '2nd' : spellLevel === 3 ? '3rd' : `${spellLevel}th`
                      const selectedAtLevel = selectedSpells.filter(slug => availableSpells.find(s => s.index === slug && s.level === spellLevel)).length
                      const levelCap = spellRules.perLevelCaps?.[spellLevel]
                      return (
                        <Card key={spellLevel}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-display uppercase text-ink-500">{levelLabel}-Level Spells</div>
                            {levelCap != null && (
                              <Badge variant={selectedAtLevel >= levelCap ? 'gold' : 'default'}>
                                {selectedAtLevel}/{levelCap}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {spellsAtLevel.map(spell => {
                              const isSelected = selectedSpells.includes(spell.index)
                              const atMax = selectedSpells.length >= leveledSpellTarget
                              const atLevelMax = levelCap != null && selectedAtLevel >= levelCap
                              return (
                                <div key={spell.index} className={`flex items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                                  isSelected ? 'border-arcane-500 bg-arcane-400/10' : 'border-parchment-300 disabled:opacity-40'
                                }`}>
                                  <button
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedSpells(prev => prev.filter(s => s !== spell.index))
                                      } else if (!atMax && !atLevelMax) {
                                        setSelectedSpells(prev => [...prev, spell.index])
                                      }
                                    }}
                                    disabled={!isSelected && (atMax || atLevelMax)}
                                    className="flex-1 text-left cursor-pointer disabled:opacity-40 disabled:cursor-default"
                                  >
                                    <div className="font-display text-xs text-ink-900">{spell.name}</div>
                                    <div className="text-xs text-ink-500">{levelLabel} Level</div>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePreviewSpell(spell.index) }}
                                    className="p-1 text-ink-300 hover:text-arcane-500 cursor-pointer shrink-0"
                                    title="View spell details"
                                  >
                                    <Info size={14} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </Card>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Spell Preview Overlay */}
        {(previewSpell || loadingPreview) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setPreviewSpell(null); setLoadingPreview(false) }}>
            <div className="bg-parchment-100 border border-parchment-400 rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              {loadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gold-400" />
                  <span className="ml-2 text-sm text-ink-500">Loading spell...</span>
                </div>
              ) : previewSpell && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-xl text-ink-900">{previewSpell.name}</h3>
                    <button onClick={() => setPreviewSpell(null)} className="text-ink-400 hover:text-ink-700 cursor-pointer text-xl">&times;</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-ink-500 mb-3">
                    <span><strong>Level:</strong> {previewSpell.level === 0 ? 'Cantrip' : `Level ${previewSpell.level}`}</span>
                    <span><strong>School:</strong> {previewSpell.school?.name}</span>
                    <span><strong>Casting Time:</strong> {previewSpell.casting_time}</span>
                    <span><strong>Range:</strong> {previewSpell.range}</span>
                    <span><strong>Components:</strong> {formatSpellComponents(previewSpell.components, previewSpell.material)}</span>
                    <span><strong>Duration:</strong> {previewSpell.duration}</span>
                  </div>
                  {previewSpell.concentration && <Badge variant="arcane">Concentration</Badge>}
                  {previewSpell.ritual && <Badge variant="default">Ritual</Badge>}
                  <p className="text-sm text-ink-700 whitespace-pre-wrap mt-3">{formatSpellDescription(previewSpell.desc)}</p>
                  {previewSpell.higher_level && previewSpell.higher_level.length > 0 && (
                    <p className="text-sm text-arcane-600 italic mt-2">
                      <strong>At Higher Levels:</strong> {formatSpellDescription(previewSpell.higher_level)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── DETAILS STEP ─── */}
        {step === 'details' && (
          <div className="space-y-4">
            <SectionHeader>Character Details</SectionHeader>
            <Card>
              <div className="space-y-4">
                <Input
                  label="Character Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Tharion Duskwalker"
                />
                <Select
                  label="Alignment"
                  value={alignment}
                  onChange={e => setAlignment(e.target.value)}
                  options={ALIGNMENTS.map(a => ({ value: a, label: a }))}
                  placeholder="Choose alignment"
                />
              </div>
            </Card>

            <Card>
              <SectionHeader>Physical Description (Optional)</SectionHeader>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Height" value={height} onChange={e => setHeight(e.target.value)} placeholder="5'10&quot;" />
                <Input label="Weight" value={weight} onChange={e => setWeight(e.target.value)} placeholder="170 lbs" />
                <Input label="Age" value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                <Input label="Hair Color" value={hairColor} onChange={e => setHairColor(e.target.value)} placeholder="Black" />
                <Input label="Eye Color" value={eyeColor} onChange={e => setEyeColor(e.target.value)} placeholder="Brown" />
                <Input label="Skin Color" value={skinColor} onChange={e => setSkinColor(e.target.value)} placeholder="Tan" />
              </div>
            </Card>

            {isDragonRider && (
              <Card>
                <SectionHeader>Dragon Companion</SectionHeader>
                <div className="space-y-4">
                  <Input
                    label="Dragon Name"
                    value={dragonName}
                    onChange={e => setDragonName(e.target.value)}
                    required
                    placeholder="Emberclaw, Stormfang, Ashwing..."
                  />
                  <div>
                    <label className="text-xs font-display uppercase text-ink-500 mb-1 block">Elemental Affinity</label>
                    <p className="text-xs text-ink-400 mb-2">This shapes your dragon's breath weapon, resistances, and the elemental damage of many class features.</p>
                    <div className="grid grid-cols-4 gap-2">
                      {DRAGON_ELEMENTS.map(el => (
                        <button
                          key={el}
                          type="button"
                          onClick={() => setDragonElement(el)}
                          className={`px-2 py-1.5 rounded text-xs font-display uppercase transition-colors cursor-pointer ${
                            dragonElement === el
                              ? 'bg-gold-400 text-ink-900 border-2 border-gold-500'
                              : 'bg-parchment-200 text-ink-500 border-2 border-transparent hover:border-gold-300'
                          }`}
                        >
                          {el}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <SectionHeader>Personality (Optional)</SectionHeader>
              <div className="space-y-3">
                <Textarea label="Personality Traits" value={personalityTraits} onChange={e => setPersonalityTraits(e.target.value)} rows={2} />
                <Textarea label="Ideals" value={ideals} onChange={e => setIdeals(e.target.value)} rows={2} />
                <Textarea label="Bonds" value={bonds} onChange={e => setBonds(e.target.value)} rows={2} />
                <Textarea label="Flaws" value={flaws} onChange={e => setFlaws(e.target.value)} rows={2} />
                <Textarea label="Backstory" value={backstory} onChange={e => setBackstory(e.target.value)} rows={4} />
              </div>
            </Card>
          </div>
        )}

        {/* ─── REVIEW STEP ─── */}
        {step === 'review' && (
          <div className="space-y-4">
            <SectionHeader>Review Your Character</SectionHeader>

            <Card>
              <div className="text-center mb-4">
                <h2 className="font-display text-2xl text-ink-900">{name || 'Unnamed Hero'}</h2>
                <p className="text-ink-500 text-sm">
                  Level {startingLevel} {selectedRace}{selectedSubrace ? ` (${selectedSubrace})` : ''} {selectedClass}{selectedSubclass ? ` — ${selectedSubclass}` : ''} · {selectedBackground}
                  {alignment && ` · ${alignment}`}
                </p>
                {startingLevel > 1 && (
                  <p className="text-xs text-ink-400 mt-1">{(XP_THRESHOLDS[startingLevel] ?? 0).toLocaleString()} XP</p>
                )}
              </div>

              <Divider />

              {/* Ability Scores with breakdown */}
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Ability Scores</div>
              <div className="grid grid-cols-6 gap-2 text-center mb-4">
                {ABILITY_SCORES.map(ability => {
                  const base = baseScores[ability]
                  const bgBonus = finalScores[ability] - base
                  const featBonus = finalScoresWithASI[ability] - finalScores[ability]
                  return (
                    <div key={ability} className="p-2 bg-parchment-100 rounded border border-parchment-300">
                      <div className="text-xs font-display uppercase text-ink-500">{ABILITY_ABBREVIATIONS[ability]}</div>
                      <div className="font-mono text-lg font-bold text-ink-900">{finalScoresWithASI[ability]}</div>
                      <div className="text-xs text-ink-500">{formatModifier(abilityModifier(finalScoresWithASI[ability]))}</div>
                      <div className="text-[10px] text-ink-400 mt-1 space-y-0.5">
                        <div>Base {base}</div>
                        {bgBonus !== 0 && <div className="text-gold-600">+{bgBonus} BG</div>}
                        {featBonus !== 0 && <div className="text-arcane-500">+{featBonus} Feat</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Combat Stats */}
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Combat</div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 bg-parchment-100 rounded border border-parchment-300">
                  <Heart size={14} className="mx-auto text-heal mb-0.5" />
                  <div className="font-mono text-lg font-bold text-ink-900">{Math.max(1, startingHp)}</div>
                  <div className="text-xs text-ink-500">HP</div>
                </div>
                <div className="text-center p-2 bg-parchment-100 rounded border border-parchment-300">
                  <Shield size={14} className="mx-auto text-ink-500 mb-0.5" />
                  <div className="font-mono text-lg font-bold text-ink-900">{10 + abilityModifier(finalScoresWithASI.dexterity)}</div>
                  <div className="text-xs text-ink-500">AC</div>
                </div>
                <div className="text-center p-2 bg-parchment-100 rounded border border-parchment-300">
                  <div className="font-mono text-lg font-bold text-ink-900">{effectiveRaceData?.speed ?? 30}</div>
                  <div className="text-xs text-ink-500">Speed</div>
                </div>
                <div className="text-center p-2 bg-parchment-100 rounded border border-parchment-300">
                  <Dices size={14} className="mx-auto text-arcane-500 mb-0.5" />
                  <div className="font-mono text-lg font-bold text-ink-900">{startingLevel}d{hitDie}</div>
                  <div className="text-xs text-ink-500">Hit Dice</div>
                </div>
              </div>

              {/* Dragon Companion */}
              {isDragonRider && (
                <>
                  <div className="text-xs font-display uppercase text-ink-500 mb-2">Dragon Companion</div>
                  <div className="p-3 bg-parchment-100 rounded border border-parchment-300 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-lg text-ink-900">{dragonName || 'Unnamed Dragon'}</span>
                      <span className="text-xs px-2 py-0.5 bg-gold-200 text-gold-700 rounded font-display uppercase">{dragonElement}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
                      <div><span className="text-ink-400">HP</span> <span className="font-mono text-ink-900">{getCompanionStats(Math.min(20, startingLevel)).maxHp}</span></div>
                      <div><span className="text-ink-400">AC</span> <span className="font-mono text-ink-900">{getCompanionStats(Math.min(20, startingLevel)).ac}</span></div>
                      <div><span className="text-ink-400">Walk</span> <span className="font-mono text-ink-900">{getCompanionStats(Math.min(20, startingLevel)).walk} ft</span></div>
                      <div><span className="text-ink-400">Fly</span> <span className="font-mono text-ink-900">{getCompanionStats(Math.min(20, startingLevel)).fly} ft</span></div>
                    </div>
                  </div>
                  {signatureWeaponName.trim() && (
                    <div className="mt-2 p-2 bg-parchment-100 rounded border border-parchment-300 text-sm">
                      <span className="text-ink-400">Signature Weapon: </span>
                      <span className="font-body font-semibold text-ink-900">{signatureWeaponName}</span>
                    </div>
                  )}
                </>
              )}

              {/* Proficiencies */}
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Proficiencies</div>
              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-xs text-ink-500">Saving Throws: </span>
                  {classData?.savingThrows.map(s => <Badge key={s} className="mr-1">{s}</Badge>)}
                </div>
                <div>
                  <span className="text-xs text-ink-500">Skills: </span>
                  {allSkillProficiencies.map(s => <Badge key={s} className="mr-1" variant="gold">{s}</Badge>)}
                </div>
                <div>
                  <span className="text-xs text-ink-500">Languages: </span>
                  {allLanguages.map(l => <Badge key={l} className="mr-1">{l}</Badge>)}
                </div>
                {classData && classData.armorProficiencies.length > 0 && (
                  <div>
                    <span className="text-xs text-ink-500">Armor: </span>
                    {classData.armorProficiencies.map(a => <Badge key={a} className="mr-1">{a}</Badge>)}
                  </div>
                )}
                {classData && classData.weaponProficiencies.length > 0 && (
                  <div>
                    <span className="text-xs text-ink-500">Weapons: </span>
                    {classData.weaponProficiencies.map(w => <Badge key={w} className="mr-1">{w}</Badge>)}
                  </div>
                )}
              </div>

              {/* Equipment */}
              <div className="text-xs font-display uppercase text-ink-500 mb-2">Starting Equipment</div>
              <div className="space-y-1 mb-4">
                {[...equipmentItems, ...customItems].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ink-700">
                    <span>{item.name}</span>
                    {item.quantity > 1 && <Badge>{item.quantity}</Badge>}
                  </div>
                ))}
                {startingGold > 0 && (
                  <div className="text-sm text-gold-500 font-display">{startingGold} GP</div>
                )}
              </div>

              {/* Spells */}
              {isCaster && (selectedCantrips.length > 0 || selectedSpells.length > 0) && (
                <>
                  <div className="text-xs font-display uppercase text-ink-500 mb-2">Starting Spells</div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selectedCantrips.map(slug => {
                      const spell = cantrips.find(s => s.index === slug)
                      return spell ? <Badge key={slug} variant="arcane">{spell.name} (Cantrip)</Badge> : null
                    })}
                    {selectedSpells.map(slug => {
                      const spell = availableSpells.find(s => s.index === slug)
                      return spell ? <Badge key={slug} variant="arcane">{spell.name} (Lvl {spell.level})</Badge> : null
                    })}
                  </div>
                </>
              )}

              {/* Features */}
              {/* Feat Selection Summary */}
              {asiLevels.length > 0 && (
                <>
                  <div className="text-xs font-display uppercase text-ink-500 mb-2">Feat Selections</div>
                  <div className="space-y-1 mb-4">
                    {asiLevels.map(level => {
                      const sel = featSelections[level]
                      if (!sel) return null
                      if (sel.type === 'asi') {
                        return (
                          <div key={level} className="text-sm text-ink-700">
                            Level {level}: ASI — {sel.asiMode === 'single'
                              ? `+2 ${ABILITY_LABELS[sel.asiFirst ?? 'strength']}`
                              : `+1 ${ABILITY_LABELS[sel.asiFirst ?? 'strength']}, +1 ${ABILITY_LABELS[sel.asiSecond ?? 'dexterity']}`}
                          </div>
                        )
                      }
                      const feat = sel.featName ? getFeatByName(sel.featName) : null
                      return (
                        <div key={level} className="text-sm text-ink-700">
                          Level {level}: <span className="font-bold">{sel.featName}</span>
                          {feat?.abilityScoreIncrease && sel.featAbility && (
                            <span className="text-ink-500"> (+1 {ABILITY_LABELS[sel.featAbility]})</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Feature Choices Summary */}
              {Object.keys(featureChoiceSelections).length > 0 && (
                <>
                  <div className="text-xs font-display uppercase text-ink-500 mb-2">Feature Choices</div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Object.entries(featureChoiceSelections).flatMap(([, selected]) =>
                      selected.map(optIndex => {
                        const opt = availableFeatureChoices.flatMap(fc => fc.options).find(o => o.index === optIndex)
                        return opt ? <Badge key={optIndex} variant="gold">{opt.name}</Badge> : null
                      })
                    )}
                  </div>
                </>
              )}

              <div className="text-xs font-display uppercase text-ink-500 mb-2">Features & Traits</div>
              <div className="space-y-2">
                {getAllFeatures().map(f => (
                  <div key={f.name} className="p-2 bg-parchment-100 rounded border border-parchment-300">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-gold-400" />
                      <span className="font-display text-sm text-ink-900">{f.name}</span>
                      <Badge>{f.source}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── Navigation ─── */}
        <Divider />
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={canGoBack ? prevStep : () => navigate('/dashboard')}
          >
            {canGoBack ? (
              <>
                <ChevronLeft size={14} className="mr-1" /> Back
              </>
            ) : 'Cancel'}
          </Button>

          {step === 'review' ? (
            <Button onClick={handleCreate} disabled={isCreating || !canProceed()}>
              {isCreating ? 'Creating...' : (
                <>
                  <Swords size={14} className="mr-1" /> Create Character
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
