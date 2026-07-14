import { useState } from 'react'
import { Plus, X, Sparkles, AlertTriangle, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CONDITION_NAMES, CONDITION_INFO, type ConditionName } from '@/lib/conditions'
import type { ActiveEffect, ActiveEffectInsert } from '@/lib/types/database'

/** Common temporary AC buffs — quick-add templates. ac is a flat modifier that stacks with
 *  the current AC (Mage Armor is modeled as +3, valid while not wearing armor). */
const BUFF_TEMPLATES: { name: string; ac: number; duration: string; description?: string }[] = [
  { name: 'Mage Armor', ac: 3, duration: '8 hours', description: 'Base AC becomes 13 + Dex (while not wearing armor).' },
  { name: 'Shield of Faith', ac: 2, duration: 'Concentration, up to 10 minutes' },
  { name: 'Shield', ac: 5, duration: 'Until the start of your next turn' },
  { name: 'Haste', ac: 2, duration: 'Concentration, up to 1 minute' },
]

interface ConditionsBannerProps {
  characterId: string
  effects: ActiveEffect[]
  onAddEffect: (effect: ActiveEffectInsert) => void
  onRemoveEffect: (id: string) => void
}

export function ConditionsBanner({ characterId, effects, onAddEffect, onRemoveEffect }: ConditionsBannerProps) {
  const [picking, setPicking] = useState(false)
  const [concInput, setConcInput] = useState(false)
  const [concName, setConcName] = useState('')
  const [buffing, setBuffing] = useState(false)
  const [buffName, setBuffName] = useState('')
  const [buffAc, setBuffAc] = useState('')

  const conditions = effects.filter((e) => e.effect_type === 'condition')
  const buffs = effects.filter((e) => e.effect_type === 'buff')
  const concentration = effects.find((e) => e.is_concentration)
  const activeNames = new Set(conditions.map((c) => c.name))
  const available = CONDITION_NAMES.filter((n) => !activeNames.has(n))

  function addBuff(name: string, ac: number, duration = '', description = '') {
    const trimmed = name.trim()
    if (!trimmed) return
    onAddEffect({
      character_id: characterId,
      name: trimmed,
      effect_type: 'buff',
      description,
      is_concentration: false,
      duration,
      source: 'Manual',
      ac_modifier: ac,
    })
    setBuffName('')
    setBuffAc('')
    setBuffing(false)
  }

  function addCondition(name: ConditionName) {
    onAddEffect({
      character_id: characterId,
      name,
      effect_type: 'condition',
      description: CONDITION_INFO[name] ?? '',
      is_concentration: false,
      duration: '',
      source: 'Manual',
      ac_modifier: 0,
    })
    setPicking(false)
  }

  function startConcentration() {
    const name = concName.trim()
    if (!name) return
    onAddEffect({
      character_id: characterId,
      name,
      effect_type: 'concentration',
      description: '',
      is_concentration: true,
      duration: '',
      source: 'Manual',
      ac_modifier: 0,
    })
    setConcName('')
    setConcInput(false)
  }

  return (
    <Card className="!p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-xs uppercase tracking-wider text-ink-500">Conditions</span>

        {/* Concentration */}
        {concentration ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider bg-arcane-400/20 text-arcane-600">
            <Sparkles size={10} />
            Conc: {concentration.name}
            <button
              onClick={() => onRemoveEffect(concentration.id)}
              className="ml-0.5 hover:text-danger transition-colors cursor-pointer"
              title="Stop concentrating"
            >
              <X size={11} />
            </button>
          </span>
        ) : concInput ? (
          <span className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={concName}
              onChange={(e) => setConcName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startConcentration(); if (e.key === 'Escape') { setConcInput(false); setConcName('') } }}
              placeholder="Spell name…"
              className="w-32 text-xs px-2 py-0.5 border border-parchment-400 rounded-sm bg-parchment-50 text-ink-900"
            />
            <button onClick={startConcentration} className="text-xs text-arcane-600 hover:text-arcane-700 cursor-pointer">Set</button>
            <button onClick={() => { setConcInput(false); setConcName('') }} className="text-ink-400 hover:text-ink-600 cursor-pointer"><X size={12} /></button>
          </span>
        ) : (
          <button
            onClick={() => setConcInput(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider border border-parchment-300 text-ink-400 hover:border-arcane-400 hover:text-arcane-600 transition-colors cursor-pointer"
          >
            <Sparkles size={10} /> Concentrate
          </button>
        )}

        {/* Active conditions */}
        {conditions.map((c) => (
          <span
            key={c.id}
            title={CONDITION_INFO[c.name as keyof typeof CONDITION_INFO] ?? c.description}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider bg-danger/10 text-danger"
          >
            {c.name}
            <button
              onClick={() => onRemoveEffect(c.id)}
              className="ml-0.5 hover:text-ink-900 transition-colors cursor-pointer"
              title="Remove"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Add condition */}
        <div className="relative">
          <button
            onClick={() => setPicking((p) => !p)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider border border-parchment-300 text-ink-400 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
          >
            <Plus size={11} /> Condition
          </button>
          {picking && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPicking(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 w-52 max-h-64 overflow-y-auto bg-parchment-50 border border-parchment-300 rounded-lg shadow-lg p-1">
                {available.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-ink-400">All conditions applied</div>
                )}
                {available.map((name) => (
                  <button
                    key={name}
                    onClick={() => addCondition(name)}
                    title={CONDITION_INFO[name]}
                    className="w-full text-left px-2 py-1.5 text-sm text-ink-700 hover:bg-parchment-200 rounded transition-colors cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active buffs */}
        {buffs.map((b) => (
          <span
            key={b.id}
            title={b.description || b.duration || ''}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider bg-gold-400/20 text-gold-700"
          >
            <Shield size={10} />
            {b.name}{b.ac_modifier ? ` ${b.ac_modifier > 0 ? '+' : ''}${b.ac_modifier} AC` : ''}
            <button
              onClick={() => onRemoveEffect(b.id)}
              className="ml-0.5 hover:text-danger transition-colors cursor-pointer"
              title="End effect"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Add buff */}
        <div className="relative">
          <button
            onClick={() => setBuffing((b) => !b)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display uppercase tracking-wider border border-parchment-300 text-ink-400 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
          >
            <Plus size={11} /> Buff
          </button>
          {buffing && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBuffing(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 w-60 bg-parchment-50 border border-parchment-300 rounded-lg shadow-lg p-2 space-y-2">
                <div className="text-[10px] font-display uppercase tracking-wider text-ink-400">Quick add</div>
                <div className="flex flex-wrap gap-1">
                  {BUFF_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => addBuff(t.name, t.ac, t.duration, t.description ?? '')}
                      title={`${t.description ? t.description + ' ' : ''}(+${t.ac} AC, ${t.duration})`}
                      className="px-2 py-1 text-xs text-ink-700 bg-parchment-200 hover:bg-gold-400/30 rounded transition-colors cursor-pointer"
                    >
                      {t.name} +{t.ac}
                    </button>
                  ))}
                </div>
                <div className="border-t border-parchment-200 pt-2 space-y-1.5">
                  <div className="text-[10px] font-display uppercase tracking-wider text-ink-400">Custom</div>
                  <input
                    autoFocus
                    value={buffName}
                    onChange={(e) => setBuffName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBuff(buffName, Number(buffAc) || 0); if (e.key === 'Escape') setBuffing(false) }}
                    placeholder="Effect name…"
                    className="w-full text-xs px-2 py-1 border border-parchment-400 rounded-sm bg-parchment-50 text-ink-900"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-ink-500">AC</label>
                    <input
                      type="number"
                      value={buffAc}
                      onChange={(e) => setBuffAc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addBuff(buffName, Number(buffAc) || 0); if (e.key === 'Escape') setBuffing(false) }}
                      placeholder="0"
                      className="w-16 text-xs px-2 py-1 border border-parchment-400 rounded-sm bg-parchment-50 text-ink-900"
                    />
                    <button
                      onClick={() => addBuff(buffName, Number(buffAc) || 0)}
                      className="ml-auto px-2 py-1 text-xs font-display uppercase tracking-wider bg-gold-400 text-ink-900 rounded-sm hover:bg-gold-500 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {conditions.length === 0 && buffs.length === 0 && !concentration && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-300">
            <AlertTriangle size={11} /> none active
          </span>
        )}
      </div>
    </Card>
  )
}
