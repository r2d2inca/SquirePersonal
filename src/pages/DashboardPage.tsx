import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useCharacter } from '@/hooks/useCharacter'
import { useSpells } from '@/hooks/useSpells'
import { useSpellSlots } from '@/hooks/useSpellSlots'
import { useInventory } from '@/hooks/useInventory'
import { useActiveEffects } from '@/hooks/useActiveEffects'
import { useSessionLogs } from '@/hooks/useSessionLogs'
import { useLoreEntries } from '@/hooks/useLoreEntries'
import { useNotes } from '@/hooks/useNotes'
import { useAI } from '@/hooks/useAI'
import { useUIStore } from '@/stores/uiStore'
import { AppShell } from '@/components/layout/AppShell'
import { CharacterSheet } from '@/components/character/CharacterSheet'
import { LevelUpWizard } from '@/components/character/LevelUpWizard'
import { RestModal } from '@/components/character/RestModal'
import { SpellsPanel } from '@/components/spells/SpellsPanel'
import { InventoryPanel } from '@/components/inventory/InventoryPanel'
import { AIChatPanel } from '@/components/ai/AIChatPanel'
import { SessionLogPanel } from '@/components/sessions/SessionLogPanel'
import { LorePanel } from '@/components/lore/LorePanel'
import { NotesPanel } from '@/components/notes/NotesPanel'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserPlus, LogOut } from 'lucide-react'
import { abilityModifier, calculateAC, proficiencyBonus } from '@/lib/calculations'
import { playSound } from '@/lib/sound'
import { classifyHpChange, describeHpChange } from '@/lib/hpDelta'
import { pushToast } from '@/stores/toastStore'
import { getSpellSelectionRules } from '@/lib/spellcastingRules'
import { getDragonData, updateDragonData, getCompanionStats } from '@/lib/dragonCompanion'
import { refreshFeatureDescriptions } from '@/lib/featureRefresh'
import { getSubclassSpells, getClassChoiceData } from '@/lib/phbData'
import { parseRaceSubrace, getRaceData, applySubrace } from '@/lib/raceData'
import { FEAT_FIXED_SPELLS } from '@/lib/featData'
import { getSpellDetail, getAllSpells, formatSpellComponents, formatSpellDescription } from '@/lib/dnd5e'
import { getSpellcasting2024, getWarlockPactMagic } from '@/lib/spellcastingData'
import { getClassLevels as getMulticlassLevels, getMulticlassCasterLevel, getMulticlassSpellSlots, isMulticlassed } from '@/lib/multiclass'
import { JoinCampaignModal } from '@/components/campaign/JoinCampaignModal'
import { CampaignPanel } from '@/components/campaign/CampaignPanel'
import type { CharacterUpdate, SpellInsert, SpellUpdate } from '@/lib/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const activeTab = useUIStore((s) => s.activeTab)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showJoinCampaign, setShowJoinCampaign] = useState(false)
  const [restType, setRestType] = useState<'short' | 'long' | null>(null)

  const { character, isLoading: charLoading, updateCharacter } = useCharacter(user?.id)
  const { spells, isLoading: spellsLoading, addSpell, updateSpell, deleteSpell } = useSpells(character?.id)
  const { spellSlots, isLoading: slotsLoading, upsertSlots, expendSlot, restoreSlot, longRest } = useSpellSlots(character?.id)
  const { items, addItem, updateItem, deleteItem } = useInventory(character?.id)
  const { effects, addEffect, removeEffect } = useActiveEffects(character?.id)
  const { sessions, addSession, updateSession, deleteSession } = useSessionLogs(user?.id, character?.id)
  const { entries: loreEntries, addEntry: addLore, updateEntry: updateLore, deleteEntry: deleteLore } = useLoreEntries(user?.id, character?.id)
  const { notes, addNote, updateNote, deleteNote } = useNotes(user?.id, character?.id)
  const { messages, isLoading: aiLoading, sendMessage, clearMessages } = useAI()

  // Auto-update AC when equipped armor changes
  const prevACRef = useRef<number | null>(null)
  useEffect(() => {
    if (!character || !items) return
    const equippedItems = items.filter((i) => i.is_equipped)
    const effectsAcMod = effects.reduce((sum, e) => sum + (e.ac_modifier ?? 0), 0)
    const newAC = calculateAC(
      abilityModifier(character.dexterity),
      equippedItems,
      character.features,
      abilityModifier(character.constitution),
      abilityModifier(character.wisdom),
      effectsAcMod,
      {
        strength: abilityModifier(character.strength),
        dexterity: abilityModifier(character.dexterity),
        constitution: abilityModifier(character.constitution),
        intelligence: abilityModifier(character.intelligence),
        wisdom: abilityModifier(character.wisdom),
        charisma: abilityModifier(character.charisma),
      },
    )
    if (newAC !== character.armor_class && prevACRef.current !== newAC) {
      prevACRef.current = newAC
      updateCharacter({ id: character.id, updates: { armor_class: newAC } })
    }
  }, [items, effects, character?.dexterity, character?.strength, character?.constitution, character?.intelligence, character?.wisdom, character?.charisma, character?.armor_class, character?.id, updateCharacter])

  // Auto-refresh stale feature descriptions from latest class data
  const featureRefreshDone = useRef(false)
  useEffect(() => {
    if (!character || featureRefreshDone.current) return
    featureRefreshDone.current = true
    const { refreshed, changed } = refreshFeatureDescriptions(
      character.class.toLowerCase(),
      character.level,
      character.features,
      character.subclass,
    )
    if (changed) {
      updateCharacter({ id: character.id, updates: { features: refreshed } })
    }
  }, [character?.id])

  // Auto-add missing subclass spells (separate effect so spells are loaded)
  const spellRefreshDone = useRef(false)
  useEffect(() => {
    if (!character || !character.subclass || spellRefreshDone.current) return
    // Wait until both character and spells have been fetched
    if (charLoading || spellsLoading) return
    spellRefreshDone.current = true

    // Try each class the character might have (for multiclass support)
    const classNames = character.class.split(' / ').map(c => c.replace(/\s+\d+$/, '').toLowerCase())
    for (const classLower of classNames) {
      const classChoices = getClassChoiceData(classLower)
      if (!classChoices) continue
      const subEntry = classChoices.subclasses.find(s =>
        s.name === character.subclass || s.index === character.subclass!.toLowerCase().replace(/\s+/g, '-')
      )
      if (!subEntry) continue

      const grantedSpells = getSubclassSpells(classLower, subEntry.index, character.level)
      if (grantedSpells.length === 0) continue

      const existingSpellNames = new Set(spells.map(s => s.name.toLowerCase()))
      const missing = grantedSpells.filter(gs => !existingSpellNames.has(gs.name.toLowerCase()))
      if (missing.length === 0) continue

      ;(async () => {
        for (const granted of missing) {
          try {
            const detail = await getSpellDetail(granted.index)
            await addSpell({
              character_id: character.id,
              name: detail.name,
              level: detail.level,
              school: detail.school?.name ?? '',
              casting_time: detail.casting_time ?? '',
              range: detail.range ?? '',
              components: formatSpellComponents(detail.components, detail.material),
              duration: detail.duration ?? '',
              is_concentration: detail.concentration ?? false,
              is_ritual: detail.ritual ?? false,
              is_prepared: true,
              description: formatSpellDescription(detail.desc),
              higher_levels: detail.higher_level?.join('\n\n') ?? '',
              source: 'Subclass',
            })
          } catch (err) {
            console.error('Failed to add subclass spell:', granted.name, err)
          }
        }
      })()
      break // Only process first matching class
    }
  }, [character?.id, spells.length])

  // Auto-add missing race-granted (Species) and feat-granted spells.
  // Race legacy spells (e.g. Tiefling Infernal's Darkness@5) and feat spells are
  // only inserted at creation/level-up; this reconciles them on load like subclass spells.
  const extraSpellsRefreshDone = useRef(false)
  useEffect(() => {
    if (!character || extraSpellsRefreshDone.current) return
    if (charLoading || spellsLoading) return
    extraSpellsRefreshDone.current = true

    const existingSpellNames = new Set(spells.map(s => s.name.toLowerCase()))
    const slugToName = (slug: string) =>
      slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    // Collect { slug, source } for anything missing, pre-deduped by name.
    const toAdd: { slug: string; source: string }[] = []
    const seen = new Set(existingSpellNames)

    // 1) Race-granted spells unlocked at or below the character's level
    const { race, subrace } = parseRaceSubrace(character.race)
    const baseRace = getRaceData(race)
    if (baseRace) {
      const subraceData = subrace && baseRace.subraces?.find(s => s.name === subrace)
      const effective = subraceData ? applySubrace(baseRace, subraceData) : baseRace
      for (const gs of effective.grantedSpells ?? []) {
        if (gs.grantedAtLevel > character.level) continue
        if (seen.has(gs.name.toLowerCase())) continue
        seen.add(gs.name.toLowerCase())
        toAdd.push({ slug: gs.index, source: 'Species' })
      }
    }

    // 2) Feat-granted fixed spells for feats the character has taken
    for (const feat of character.features ?? []) {
      if (!feat.source || !feat.source.startsWith('Feat')) continue
      const slugs = FEAT_FIXED_SPELLS[feat.name]
      if (!slugs) continue
      for (const slug of slugs) {
        const guessedName = slugToName(slug).toLowerCase()
        if (seen.has(guessedName)) continue
        seen.add(guessedName)
        toAdd.push({ slug, source: `Feat (${feat.name})` })
      }
    }

    if (toAdd.length === 0) return

    ;(async () => {
      for (const { slug, source } of toAdd) {
        try {
          const detail = await getSpellDetail(slug)
          if (existingSpellNames.has(detail.name.toLowerCase())) continue
          await addSpell({
            character_id: character.id,
            name: detail.name,
            level: detail.level,
            school: detail.school?.name ?? '',
            casting_time: detail.casting_time ?? '',
            range: detail.range ?? '',
            components: formatSpellComponents(detail.components, detail.material),
            duration: detail.duration ?? '',
            is_concentration: detail.concentration ?? false,
            is_ritual: detail.ritual ?? false,
            is_prepared: true,
            description: formatSpellDescription(detail.desc),
            higher_levels: detail.higher_level?.join('\n\n') ?? '',
            source,
          })
        } catch (err) {
          console.error('Failed to add missing granted spell:', slug, err)
        }
      }
    })()
  }, [character?.id, spells.length])

  // One-time 2024 refresh of stored spell TEXT. Spell mechanics are copied onto the
  // character at add-time, so spells added before the 2024 SRD data migration keep their
  // old (2014) text until refreshed here. Idempotent: matches by name, only writes when the
  // 2024 detail genuinely differs, and never overwrites good data with a placeholder/mismatch.
  const spellTextRefreshDone = useRef(false)
  useEffect(() => {
    if (!character || spellTextRefreshDone.current) return
    if (charLoading || spellsLoading || spells.length === 0) return
    spellTextRefreshDone.current = true

    const nameToSlug = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    ;(async () => {
      // Warm the 2024 spell cache once so per-spell lookups resolve in-memory.
      try { await getAllSpells() } catch { /* fall back to per-spell fetch */ }

      for (const spell of spells) {
        try {
          const detail = await getSpellDetail(nameToSlug(spell.name))
          // Guard: require a real description and an exact name match so a mis-resolved
          // or placeholder result can never clobber the stored spell.
          if (!detail.desc?.length) continue
          if (detail.name.toLowerCase() !== spell.name.toLowerCase()) continue

          const updates: SpellUpdate = {}
          const newDesc = formatSpellDescription(detail.desc)
          const newComponents = formatSpellComponents(detail.components, detail.material)
          const newHigher = detail.higher_level?.join('\n\n') ?? ''
          if (newDesc && newDesc !== spell.description) updates.description = newDesc
          if (detail.range && detail.range !== spell.range) updates.range = detail.range
          if (newComponents && newComponents !== spell.components) updates.components = newComponents
          if (detail.duration && detail.duration !== spell.duration) updates.duration = detail.duration
          if (detail.casting_time && detail.casting_time !== spell.casting_time) updates.casting_time = detail.casting_time
          if (detail.school?.name && detail.school.name !== spell.school) updates.school = detail.school.name
          if (typeof detail.concentration === 'boolean' && detail.concentration !== spell.is_concentration) updates.is_concentration = detail.concentration
          if (typeof detail.ritual === 'boolean' && detail.ritual !== spell.is_ritual) updates.is_ritual = detail.ritual
          if (typeof detail.level === 'number' && detail.level !== spell.level) updates.level = detail.level
          if (newHigher !== spell.higher_levels) updates.higher_levels = newHigher

          if (Object.keys(updates).length > 0) {
            await updateSpell({ id: spell.id, updates })
          }
        } catch (err) {
          console.error('Failed to refresh spell to 2024:', spell.name, err)
        }
      }
    })()
  }, [character?.id, spells.length])

  // Auto-sync spell slots: insert missing slots and update totals on level change
  const slotSyncDone = useRef(false)
  useEffect(() => {
    if (!character || slotSyncDone.current || charLoading || slotsLoading) return
    slotSyncDone.current = true

    let expectedSlots: { level: number; total: number }[] = []

    if (isMulticlassed(character)) {
      const classLevels = getMulticlassLevels(character)
      const casterLevel = getMulticlassCasterLevel(classLevels)
      if (casterLevel === 0) return
      const slotCounts = getMulticlassSpellSlots(casterLevel)
      expectedSlots = slotCounts
        .map((total, i) => ({ level: i + 1, total }))
        .filter(s => s.total > 0)
    } else {
      const classLower = character.class.toLowerCase()
      if (classLower === 'warlock') {
        const pact = getWarlockPactMagic(character.level)
        expectedSlots = [{ level: pact.slotLevel, total: pact.pactSlots }]
      } else {
        const progression = getSpellcasting2024(classLower, character.level)
        if (!progression) return
        expectedSlots = progression.spellSlots
          .map((total, i) => ({ level: i + 1, total }))
          .filter(s => s.total > 0)
      }
    }

    if (expectedSlots.length === 0) return

    // Find slots that are missing or have wrong totals
    const slotsToUpsert = expectedSlots.filter(expected => {
      const existing = spellSlots.find(s => s.slot_level === expected.level)
      return !existing || existing.total !== expected.total
    })

    if (slotsToUpsert.length === 0) return
    upsertSlots(slotsToUpsert.map(s => ({
      character_id: character.id,
      slot_level: s.level,
      total: s.total,
      expended: spellSlots.find(e => e.slot_level === s.level)?.expended ?? 0,
    }))).catch(err => console.error('Failed to auto-sync spell slots:', err))
  }, [character?.id, character?.level, spellSlots.length, charLoading, slotsLoading])

  if (charLoading) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-parchment-200 flex items-center justify-center">
        <div className="text-center">
          <EmptyState
            icon={<UserPlus size={48} />}
            title="No Character Found"
            description="Create your first character to get started with Squire."
            action={{ label: 'Create Character', onClick: () => navigate('/new-character') }}
          />
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>
    )
  }

  // Sound and toast side-effects for user-driven sheet edits live here. Background
  // writers (the AC recalc effect, feature refresh, spell-slot sync) must keep calling
  // updateCharacter directly, or they'll start firing damage sounds on page load.
  function handleCharacterUpdate(updates: Parameters<typeof updateCharacter>[0]['updates']) {
    if (!character) return

    const hpChange = classifyHpChange(character, updates)
    const before = { current_hp: character.current_hp, temp_hp: character.temp_hp }
    const characterId = character.id

    updateCharacter({ id: characterId, updates })

    if (hpChange.kind !== 'none') {
      playSound(hpChange.kind === 'damage' ? 'damage' : hpChange.kind === 'heal' ? 'heal' : 'tempHp')
      pushToast({
        tag: 'hp',
        tone: hpChange.kind === 'damage' ? 'danger' : 'heal',
        message: describeHpChange(hpChange),
        // Restores both fields, so undoing a hit also gives back temp HP it burned.
        action: {
          label: 'Undo',
          onClick: () => updateCharacter({ id: characterId, updates: before }),
        },
      })
    }

    // Only on increase — the pips can be un-toggled too.
    if ((updates.death_save_successes ?? -1) > character.death_save_successes) {
      playSound('deathSaveSuccess')
    }
    if ((updates.death_save_failures ?? -1) > character.death_save_failures) {
      playSound('deathSaveFail')
    }
  }

  async function handleLevelUp(
    characterUpdates: CharacterUpdate,
    newSpellSlots: { level: number; total: number }[],
    newSpells?: { name: string; level: number; school: string; casting_time: string; range: string; components: string; duration: string; is_concentration: boolean; is_ritual: boolean; description: string; higher_levels: string; source: string }[],
  ) {
    if (!character) return
    await updateCharacter({ id: character.id, updates: characterUpdates })
    if (newSpellSlots.length > 0) {
      await upsertSlots(
        newSpellSlots.map((s) => ({
          character_id: character.id,
          slot_level: s.level,
          total: s.total,
          expended: 0,
        }))
      )
    }
    if (newSpells && newSpells.length > 0) {
      for (const spell of newSpells) {
        await addSpell({
          character_id: character.id,
          ...spell,
          is_prepared: true,
        })
      }
    }
    playSound('levelUp')
  }

  async function handleSubclassChange(classIndex: string, subclassIndex: string) {
    if (!character) return

    // Remove any existing subclass-granted spells
    const subclassSpells = spells.filter((s) => s.source === 'Subclass')
    for (const spell of subclassSpells) {
      await deleteSpell(spell.id)
    }

    // Get the spells granted by this subclass at the character's current level
    const grantedSpells = getSubclassSpells(classIndex, subclassIndex, character.level)
    if (grantedSpells.length === 0) return

    // Fetch each spell's details from SRD and add to the character
    for (const granted of grantedSpells) {
      try {
        const detail = await getSpellDetail(granted.index)
        const spell: SpellInsert = {
          character_id: character.id,
          name: detail.name,
          level: detail.level,
          school: detail.school.name,
          casting_time: detail.casting_time,
          range: detail.range,
          components: formatSpellComponents(detail.components, detail.material),
          duration: detail.duration,
          is_concentration: detail.concentration,
          is_ritual: detail.ritual,
          is_prepared: true,
          description: formatSpellDescription(detail.desc),
          higher_levels: detail.higher_level ? detail.higher_level.join('\n\n') : '',
          source: 'Subclass',
        }
        await addSpell(spell)
      } catch {
        // SRD API doesn't have this spell — add with basic info
        const spell: SpellInsert = {
          character_id: character.id,
          name: granted.name,
          level: granted.level,
          school: '',
          casting_time: '',
          range: '',
          components: '',
          duration: '',
          is_concentration: false,
          is_ritual: false,
          is_prepared: true,
          description: `Granted by subclass at level ${granted.grantedAtLevel}.`,
          higher_levels: '',
          source: 'Subclass',
        }
        await addSpell(spell)
      }
    }
  }

  async function handleSubclassRemove() {
    // Remove all subclass-granted spells
    const subclassSpells = spells.filter((s) => s.source === 'Subclass')
    for (const spell of subclassSpells) {
      await deleteSpell(spell.id)
    }
  }

  function handleShortRest(hitDiceToSpend: number) {
    if (!character) return
    const hitDie = parseInt(character.hit_dice_total.match(/d(\d+)/)?.[1] ?? '8')
    const conMod = abilityModifier(character.constitution)
    let totalHeal = 0
    for (let i = 0; i < hitDiceToSpend; i++) {
      totalHeal += Math.max(1, Math.floor(Math.random() * hitDie) + 1 + conMod)
    }
    const newHp = Math.min(character.max_hp, character.current_hp + totalHeal)
    const updates: Parameters<typeof updateCharacter>[0]['updates'] = {
      current_hp: newHp,
      hit_dice_remaining: Math.max(0, character.hit_dice_remaining - hitDiceToSpend),
    }
    // Restore short rest features
    const features = character.features.map((f) => {
      if (f.rechargeOn === 'short_rest' && f.usesMax != null) {
        return { ...f, usesRemaining: f.usesMax }
      }
      return f
    })
    if (features.some((f, i) => f !== character.features[i])) {
      updates.features = features
    }
    updateCharacter({ id: character.id, updates })
    playSound('rest')
  }

  function handleLongRest() {
    if (!character) return
    const maxHitDice = parseInt(character.hit_dice_total?.match(/(\d+)/)?.[1] ?? '0') || character.level
    const hitDiceToRestore = Math.max(1, Math.floor(character.level / 2))
    const newHitDice = Math.min(maxHitDice, character.hit_dice_remaining + hitDiceToRestore)
    const updates: Parameters<typeof updateCharacter>[0]['updates'] = {
      current_hp: character.max_hp,
      temp_hp: 0,
      hit_dice_remaining: newHitDice,
      death_save_successes: 0,
      death_save_failures: 0,
    }
    // Restore all rest-rechargeable features
    const features = character.features.map((f) => {
      if (f.rechargeOn && f.usesMax != null) {
        return { ...f, usesRemaining: f.usesMax }
      }
      return f
    })
    if (features.some((f, i) => f !== character.features[i])) {
      updates.features = features
    }
    // Restore dragon companion HP on long rest
    if (character.class.toLowerCase() === 'dragon-rider') {
      const dragonData = getDragonData(character.appearance)
      if (dragonData) {
        const dragonMax = getCompanionStats(character.level).maxHp
        updates.appearance = updateDragonData(character.appearance, { dragonCurrentHp: dragonMax })
      }
    }
    updateCharacter({ id: character.id, updates })
    longRest() // Restore spell slots
    playSound('rest')
  }

  function handleAISendMessage(message: string) {
    sendMessage(message, {
      character,
      activeEffects: effects,
      spells,
      spellSlots,
      equippedItems: items.filter((i) => i.is_equipped),
      recentSessions: sessions.slice(0, 3),
      relevantLore: loreEntries.filter((l) => l.is_pinned).slice(0, 10),
    })
  }

  return (
    <AppShell character={character} activeEffects={effects} onLogout={signOut} onJoinCampaign={() => setShowJoinCampaign(true)}>
      {activeTab === 'character' && (
        <CharacterSheet
          character={character}
          onUpdate={handleCharacterUpdate}
          onLevelUp={() => setShowLevelUp(true)}
          onSubclassChange={handleSubclassChange}
          onSubclassRemove={handleSubclassRemove}
          onShortRest={() => setRestType('short')}
          onLongRest={() => setRestType('long')}
          onDeleteCharacter={() => updateCharacter({ id: character.id, updates: { is_active: false } })}
          spells={spells}
          spellSlots={spellSlots}
          items={items}
          effects={effects}
          onAddEffect={(effect) => {
            playSound('conditionApplied')
            addEffect(effect)
          }}
          onRemoveEffect={removeEffect}
          onExpendSlot={expendSlot}
        />
      )}

      {restType && (
        <RestModal
          open={!!restType}
          onClose={() => setRestType(null)}
          character={character}
          restType={restType}
          onShortRest={handleShortRest}
          onLongRest={handleLongRest}
        />
      )}

      <LevelUpWizard
        open={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        character={character}
        currentSpellSlots={spellSlots}
        existingSpells={spells.map(s => ({ name: s.name, level: s.level }))}
        onLevelUp={handleLevelUp}
      />

      {activeTab === 'spells' && (() => {
        // Prepared-spell max comes from the 2024 rules (fixed class-table count), not a
        // local ability-mod + level formula. Only prepared casters show a max.
        const classLower = character.class.toLowerCase()
        const spellAbility = classLower === 'paladin' || classLower === 'barriomancer' ? 'charisma'
          : classLower === 'artificer' || classLower === 'wizard' ? 'intelligence'
          : 'wisdom'
        const scMod = abilityModifier((character[spellAbility as keyof typeof character] as number) ?? 10)
        const spellRules = getSpellSelectionRules(character.class, undefined, scMod, character.level)
        const preparedMax = spellRules.isPreparedCaster ? spellRules.preparedCount : undefined
        return (
        <SpellsPanel
          spells={spells}
          spellSlots={spellSlots}
          characterId={character.id}
          characterClass={character.class}
          characterLevel={character.level}
          preparedMax={preparedMax}
          spellSaveDC={character.spell_save_dc}
          spellAttackBonus={character.spell_attack_bonus}
          spellcastingAbility={character.spellcasting_ability}
          onAddSpell={addSpell}
          onUpdateSpell={(id, updates) => updateSpell({ id, updates })}
          onDeleteSpell={deleteSpell}
          onExpendSlot={expendSlot}
          onRestoreSlot={restoreSlot}
          onLongRest={longRest}
        />
        )
      })()}

      {activeTab === 'inventory' && (
        <InventoryPanel
          items={items}
          characterId={character.id}
          currency={{
            copper: character.copper,
            silver: character.silver,
            electrum: character.electrum,
            gold: character.gold,
            platinum: character.platinum,
          }}
          onAddItem={addItem}
          onUpdateItem={(id, updates) => updateItem({ id, updates })}
          onDeleteItem={deleteItem}
          onUpdateCurrency={(currency) => handleCharacterUpdate(currency)}
        />
      )}

      {activeTab === 'ai' && (
        <AIChatPanel
          messages={messages}
          isLoading={aiLoading}
          onSendMessage={handleAISendMessage}
          onClear={clearMessages}
        />
      )}

      {activeTab === 'sessions' && (
        <SessionLogPanel
          sessions={sessions}
          userId={user!.id}
          characterId={character.id}
          onAdd={addSession}
          onUpdate={(id, updates) => updateSession({ id, updates })}
          onDelete={deleteSession}
        />
      )}

      {activeTab === 'lore' && (
        <LorePanel
          entries={loreEntries}
          userId={user!.id}
          characterId={character.id}
          onAdd={addLore}
          onUpdate={(id, updates) => updateLore({ id, updates })}
          onDelete={deleteLore}
        />
      )}

      {activeTab === 'notes' && (
        <NotesPanel
          notes={notes}
          userId={user!.id}
          characterId={character.id}
          onAdd={addNote}
          onUpdate={(id, updates) => updateNote({ id, updates })}
          onDelete={deleteNote}
        />
      )}

      {activeTab === 'campaign' && <CampaignPanel userId={user!.id} />}

      <JoinCampaignModal
        open={showJoinCampaign}
        onClose={() => setShowJoinCampaign(false)}
      />
    </AppShell>
  )
}
