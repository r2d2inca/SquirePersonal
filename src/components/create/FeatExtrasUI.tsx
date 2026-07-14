/**
 * Shared feat extras UI — used by both FeatSelectionStep (creation) and LevelUpWizard.
 * Renders the appropriate sub-choice UI based on feat name.
 */
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ABILITY_SCORES, ABILITY_LABELS, type AbilityScore } from '@/lib/constants'
import { SKILLS } from '@/lib/constants'
import { getSpellsBySchool, getSpellsByClass, getRitualSpells, type SRDSpellSummary } from '@/lib/dnd5e'
import type { FeatLevelChoice } from './FeatSelectionStep'

type FeatExtras = NonNullable<FeatLevelChoice['featExtras']>

const KEEN_MIND_SKILLS = ['Arcana', 'History', 'Investigation', 'Nature', 'Religion']
const OBSERVANT_SKILLS = ['Insight', 'Investigation', 'Perception']
const DAMAGE_TYPES = ['Acid', 'Cold', 'Fire', 'Lightning', 'Thunder']
const ENERGY_RESISTANCE_TYPES = ['Acid', 'Cold', 'Fire', 'Lightning', 'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder']
const ARTISAN_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools",
  "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools",
  "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
]
const MUSICAL_INSTRUMENTS = [
  'Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Horn', 'Pan Flute',
  'Shawm', 'Viol',
]
const ALL_SKILLS_AND_TOOLS = [
  ...SKILLS.map(s => s.name),
  ...ARTISAN_TOOLS,
  "Disguise Kit", "Forgery Kit", "Herbalism Kit", "Navigator's Tools",
  "Poisoner's Kit", "Thieves' Tools",
]

const selectClass = "w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-body text-sm focus:outline-none focus:border-gold-400"

interface FeatExtrasUIProps {
  featName: string
  extras: FeatExtras
  onExtrasChange: (extras: FeatExtras) => void
  existingSkills?: string[]
  proficiencyBonus?: number
}

export function FeatExtrasUI({ featName, extras, onExtrasChange, existingSkills = [], proficiencyBonus = 2 }: FeatExtrasUIProps) {
  const updateExtras = (patch: Partial<FeatExtras>) => onExtrasChange({ ...extras, ...patch })

  // Keen Mind — choose 1 skill (proficiency or expertise if already proficient)
  if (featName === 'Keen Mind') {
    const hasSkill = extras.skill ? existingSkills.includes(extras.skill.toLowerCase()) : false
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose a Skill (Proficiency or Expertise)</label>
        <select value={extras.skill ?? KEEN_MIND_SKILLS[0]} onChange={e => updateExtras({ skill: e.target.value })} className={selectClass}>
          {KEEN_MIND_SKILLS.map(s => <option key={s} value={s}>{s}{existingSkills.includes(s.toLowerCase()) ? ' (Expertise)' : ''}</option>)}
        </select>
        {hasSkill && <p className="text-xs text-arcane-400 mt-1">You already have proficiency — you will gain Expertise instead.</p>}
      </div>
    )
  }

  // Observant — choose 1 skill (proficiency or expertise if already proficient)
  if (featName === 'Observant') {
    const hasSkill = extras.skill ? existingSkills.includes(extras.skill.toLowerCase()) : false
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose a Skill (Proficiency or Expertise)</label>
        <select value={extras.skill ?? OBSERVANT_SKILLS[0]} onChange={e => updateExtras({ skill: e.target.value })} className={selectClass}>
          {OBSERVANT_SKILLS.map(s => <option key={s} value={s}>{s}{existingSkills.includes(s.toLowerCase()) ? ' (Expertise)' : ''}</option>)}
        </select>
        {hasSkill && <p className="text-xs text-arcane-400 mt-1">You already have proficiency — you will gain Expertise instead.</p>}
      </div>
    )
  }

  // Resilient — choose a saving throw (ability score increase is linked)
  if (featName === 'Resilient') {
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose a Saving Throw (also +1 to that ability)</label>
        <select value={extras.savingThrow ?? 'constitution'} onChange={e => updateExtras({ savingThrow: e.target.value })} className={selectClass}>
          {ABILITY_SCORES.map(ab => <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>)}
        </select>
        <p className="text-xs text-ink-400 mt-1">Your {ABILITY_LABELS[(extras.savingThrow ?? 'constitution') as AbilityScore]} score increases by 1 and you gain saving throw proficiency.</p>
      </div>
    )
  }

  if (featName === 'Elemental Adept') {
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose a Damage Type</label>
        <select value={extras.damageType ?? DAMAGE_TYPES[0]} onChange={e => updateExtras({ damageType: e.target.value })} className={selectClass}>
          {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    )
  }

  if (featName === 'Fey Touched') {
    return <SpellSchoolPicker schools={['Divination', 'Enchantment']} label="Choose a Level 1 Divination or Enchantment Spell" note="You also gain Misty Step." extras={extras} updateExtras={updateExtras} />
  }

  if (featName === 'Shadow Touched') {
    return <SpellSchoolPicker schools={['Illusion', 'Necromancy']} label="Choose a Level 1 Illusion or Necromancy Spell" note="You also gain Invisibility." extras={extras} updateExtras={updateExtras} />
  }

  if (featName === 'Ritual Caster') {
    return <RitualSpellPicker extras={extras} updateExtras={updateExtras} proficiencyBonus={proficiencyBonus} />
  }

  if (featName === 'Crafter') {
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose 3 Artisan&apos;s Tools</label>
        {[0, 1, 2].map(i => (
          <select key={i} value={(extras.tools ?? [])[i] ?? ARTISAN_TOOLS[i]} onChange={e => { const tools = [...(extras.tools ?? [ARTISAN_TOOLS[0], ARTISAN_TOOLS[1], ARTISAN_TOOLS[2]])]; tools[i] = e.target.value; updateExtras({ tools }) }} className={`${selectClass} mb-1`}>
            {ARTISAN_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}
      </div>
    )
  }

  if (featName === 'Musician') {
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose 3 Musical Instruments</label>
        {[0, 1, 2].map(i => (
          <select key={i} value={(extras.instruments ?? [])[i] ?? MUSICAL_INSTRUMENTS[i]} onChange={e => { const instruments = [...(extras.instruments ?? [MUSICAL_INSTRUMENTS[0], MUSICAL_INSTRUMENTS[1], MUSICAL_INSTRUMENTS[2]])]; instruments[i] = e.target.value; updateExtras({ instruments }) }} className={`${selectClass} mb-1`}>
            {MUSICAL_INSTRUMENTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}
      </div>
    )
  }

  // Skill Expert — 1 new skill + expertise in 1 proficient skill
  if (featName === 'Skill Expert') {
    const allSkills = SKILLS.map(s => s.name)
    const proficientSkills = existingSkills.length > 0
      ? allSkills.filter(s => existingSkills.includes(s.toLowerCase()))
      : allSkills
    return (
      <div className="mt-2 space-y-2">
        <div>
          <label className="block text-xs font-display uppercase text-ink-500 mb-1">New Skill Proficiency</label>
          <select value={extras.skill ?? allSkills[0]} onChange={e => updateExtras({ skill: e.target.value })} className={selectClass}>
            {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-display uppercase text-ink-500 mb-1">Expertise (choose a proficient skill)</label>
          <select value={extras.expertise ?? proficientSkills[0] ?? allSkills[0]} onChange={e => updateExtras({ expertise: e.target.value })} className={selectClass}>
            {proficientSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    )
  }

  // Skilled — pick 3 skills or tools
  if (featName === 'Skilled') {
    const picks = extras.skills ?? []
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose 3 Skills or Tools ({picks.length}/3)</label>
        {[0, 1, 2].map(i => (
          <select
            key={i}
            value={picks[i] ?? ''}
            onChange={e => {
              const newPicks = [...picks]
              newPicks[i] = e.target.value
              updateExtras({ skills: newPicks.filter(Boolean) })
            }}
            className={`${selectClass} mb-1`}
          >
            <option value="">Choose...</option>
            {ALL_SKILLS_AND_TOOLS.map(s => (
              <option key={s} value={s} disabled={picks.includes(s) && picks[i] !== s}>{s}</option>
            ))}
          </select>
        ))}
      </div>
    )
  }

  // Magic Initiate — 2 cantrips + 1 level 1 spell + spellcasting ability
  if (featName.startsWith('Magic Initiate')) {
    const classMatch = featName.match(/Magic Initiate \((\w+)\)/i)
    const spellClass = classMatch ? classMatch[1].toLowerCase() : null
    if (spellClass) {
      return <MagicInitiatePicker spellClass={spellClass} extras={extras} updateExtras={updateExtras} />
    }
  }

  // Boon of Energy Resistance — choose 2 damage types
  if (featName === 'Boon of Energy Resistance') {
    const picks = extras.damageTypes ?? []
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose 2 Damage Resistances ({picks.length}/2)</label>
        {[0, 1].map(i => (
          <select
            key={i}
            value={picks[i] ?? ''}
            onChange={e => {
              const newPicks = [...picks]
              newPicks[i] = e.target.value
              updateExtras({ damageTypes: newPicks.filter(Boolean) })
            }}
            className={`${selectClass} mb-1`}
          >
            <option value="">Choose...</option>
            {ENERGY_RESISTANCE_TYPES.map(d => (
              <option key={d} value={d} disabled={picks.includes(d) && picks[i] !== d}>{d}</option>
            ))}
          </select>
        ))}
        <p className="text-xs text-ink-400 mt-1">You can change these when you finish a Long Rest.</p>
      </div>
    )
  }

  // Boon of Skill — expertise in 1 skill
  if (featName === 'Boon of Skill') {
    const allSkills = SKILLS.map(s => s.name)
    return (
      <div className="mt-2">
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Choose a Skill for Expertise</label>
        <select value={extras.expertise ?? allSkills[0]} onChange={e => updateExtras({ expertise: e.target.value })} className={selectClass}>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <p className="text-xs text-ink-400 mt-1">You also gain proficiency in all skills.</p>
      </div>
    )
  }

  return null
}

// ─── Spell pickers ───

function SpellSchoolPicker({ schools, label, note, extras, updateExtras }: {
  schools: string[]
  label: string
  note?: string
  extras: FeatExtras
  updateExtras: (patch: Partial<FeatExtras>) => void
}) {
  const [spells, setSpells] = useState<(SRDSpellSummary & { school: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSpellsBySchool(schools, 1).then(setSpells).catch(() => {}).finally(() => setLoading(false))
  }, [schools.join(',')])

  if (loading) return <div className="mt-2 flex items-center gap-2 text-xs text-ink-400"><Loader2 size={12} className="animate-spin" /> Loading spells...</div>

  return (
    <div className="mt-2">
      <label className="block text-xs font-display uppercase text-ink-500 mb-1">{label}</label>
      {note && <p className="text-xs text-ink-400 mb-1">{note}</p>}
      <select value={extras.spellPick ?? ''} onChange={e => updateExtras({ spellPick: e.target.value })} className={selectClass}>
        <option value="">Choose a spell...</option>
        {spells.map(s => <option key={s.index} value={s.index}>{s.name} ({s.school})</option>)}
      </select>
    </div>
  )
}

function RitualSpellPicker({ extras, updateExtras, proficiencyBonus = 2 }: {
  extras: FeatExtras
  updateExtras: (patch: Partial<FeatExtras>) => void
  proficiencyBonus?: number
}) {
  const [spells, setSpells] = useState<SRDSpellSummary[]>([])
  const [loading, setLoading] = useState(true)
  const picks = extras.spellPicks ?? []
  const maxPicks = proficiencyBonus

  useEffect(() => {
    setLoading(true)
    getRitualSpells(1).then(setSpells).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="mt-2 flex items-center gap-2 text-xs text-ink-400"><Loader2 size={12} className="animate-spin" /> Loading ritual spells...</div>

  return (
    <div className="mt-2">
      <label className="block text-xs font-display uppercase text-ink-500 mb-1">
        Choose {maxPicks} Level 1 Ritual Spells ({picks.length}/{maxPicks})
      </label>
      <div className="max-h-40 overflow-y-auto border border-parchment-300 rounded-lg">
        {spells.map(s => {
          const isSelected = picks.includes(s.index)
          const atMax = picks.length >= maxPicks
          return (
            <button
              key={s.index}
              onClick={() => {
                if (isSelected) updateExtras({ spellPicks: picks.filter(p => p !== s.index) })
                else if (!atMax) updateExtras({ spellPicks: [...picks, s.index] })
              }}
              disabled={!isSelected && atMax}
              className={`w-full text-left px-3 py-1.5 text-xs border-b border-parchment-200 last:border-0 cursor-pointer disabled:opacity-40 disabled:cursor-default transition-colors ${
                isSelected ? 'bg-arcane-400/10 text-ink-900' : 'hover:bg-parchment-100 text-ink-700'
              }`}
            >
              {s.name} {isSelected && '\u2713'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MagicInitiatePicker({ spellClass, extras, updateExtras }: {
  spellClass: string
  extras: FeatExtras
  updateExtras: (patch: Partial<FeatExtras>) => void
}) {
  const [spellList, setSpellList] = useState<SRDSpellSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getSpellsByClass(spellClass).then(setSpellList).catch(() => {}).finally(() => setLoading(false))
  }, [spellClass])

  const cantrips = spellList.filter(s => s.level === 0)
  const level1Spells = spellList.filter(s => s.level === 1)
  const selectedCantrips = extras.miCantrips ?? []
  const selectedSpell = extras.miSpell ?? ''

  const filteredCantrips = search ? cantrips.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : cantrips
  const filteredLevel1 = search ? level1Spells.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : level1Spells

  if (loading) return <div className="mt-2 flex items-center gap-2 text-xs text-ink-400"><Loader2 size={12} className="animate-spin" /> Loading spells...</div>

  return (
    <div className="mt-2 space-y-3">
      <div>
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">Spellcasting Ability</label>
        <select
          value={extras.miAbility ?? 'intelligence'}
          onChange={e => updateExtras({ miAbility: e.target.value })}
          className={selectClass}
        >
          <option value="intelligence">Intelligence</option>
          <option value="wisdom">Wisdom</option>
          <option value="charisma">Charisma</option>
        </select>
      </div>

      <input
        type="text"
        placeholder="Search spells..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`${selectClass} mb-1`}
      />

      <div>
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">
          Choose 2 Cantrips ({selectedCantrips.length}/2)
        </label>
        <div className="max-h-32 overflow-y-auto border border-parchment-300 rounded-lg">
          {filteredCantrips.map(s => {
            const isSelected = selectedCantrips.includes(s.index)
            const atMax = selectedCantrips.length >= 2
            return (
              <button
                key={s.index}
                onClick={() => {
                  if (isSelected) updateExtras({ miCantrips: selectedCantrips.filter(c => c !== s.index) })
                  else if (!atMax) updateExtras({ miCantrips: [...selectedCantrips, s.index] })
                }}
                disabled={!isSelected && atMax}
                className={`w-full text-left px-3 py-1.5 text-xs border-b border-parchment-200 last:border-0 cursor-pointer disabled:opacity-40 disabled:cursor-default transition-colors ${
                  isSelected ? 'bg-arcane-400/10 text-ink-900 font-semibold' : 'hover:bg-parchment-100 text-ink-700'
                }`}
              >
                {s.name} {isSelected && '\u2713'}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-display uppercase text-ink-500 mb-1">
          Choose 1 Level 1 Spell
        </label>
        <div className="max-h-32 overflow-y-auto border border-parchment-300 rounded-lg">
          {filteredLevel1.map(s => {
            const isSelected = selectedSpell === s.index
            return (
              <button
                key={s.index}
                onClick={() => updateExtras({ miSpell: isSelected ? '' : s.index })}
                className={`w-full text-left px-3 py-1.5 text-xs border-b border-parchment-200 last:border-0 cursor-pointer transition-colors ${
                  isSelected ? 'bg-arcane-400/10 text-ink-900 font-semibold' : 'hover:bg-parchment-100 text-ink-700'
                }`}
              >
                {s.name} {isSelected && '\u2713'}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
