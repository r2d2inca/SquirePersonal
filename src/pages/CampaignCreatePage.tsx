import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useCampaigns } from '@/hooks/useCampaigns'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Divider } from '@/components/ui/Divider'
import {
  Swords, ChevronRight, ChevronLeft, Check, BookOpen, Map,
  Shield, Users, Sparkles, Copy, Loader2, Scroll, Crown,
} from 'lucide-react'
import { CAMPAIGN_TEMPLATES, TONE_OPTIONS, type CampaignTemplate } from '@/lib/campaignTemplates'
import { generateSessionRecap } from '@/hooks/useAI'

type Step = 'type' | 'details' | 'tone' | 'rules' | 'session0' | 'content' | 'invite'

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'type', label: 'Type', icon: <BookOpen size={14} /> },
  { id: 'details', label: 'Details', icon: <Scroll size={14} /> },
  { id: 'tone', label: 'Tone', icon: <Sparkles size={14} /> },
  { id: 'rules', label: 'Rules', icon: <Shield size={14} /> },
  { id: 'session0', label: 'Session 0', icon: <Users size={14} /> },
  { id: 'content', label: 'Content', icon: <Map size={14} /> },
  { id: 'invite', label: 'Invite', icon: <Crown size={14} /> },
]

export function CampaignCreatePage() {
  const { user } = useAuth()
  const { addCampaign } = useCampaigns(user?.id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('type')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  // Wizard state
  const [campaignType, setCampaignType] = useState<'module' | 'homebrew'>('homebrew')
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [setting, setSetting] = useState('')
  const [tones, setTones] = useState<string[]>([])
  const [contentBoundaries, setContentBoundaries] = useState('')
  const [startingLevel, setStartingLevel] = useState(1)
  const [houseRules, setHouseRules] = useState('')
  const [schedule, setSchedule] = useState('')
  const [sessionLength, setSessionLength] = useState('3hrs')
  const [sessionZeroNotes, setSessionZeroNotes] = useState('')
  const [starterQuests, setStarterQuests] = useState<{ title: string; description: string; objectives: string[] }[]>([])
  const [starterLore, setStarterLore] = useState<{ name: string; category: string; description: string }[]>([])
  const [generatingAI, setGeneratingAI] = useState(false)
  const [copied, setCopied] = useState(false)

  function selectTemplate(template: CampaignTemplate) {
    setSelectedTemplate(template)
    setName(template.name)
    setDescription(template.description)
    setSetting(template.setting)
    setTones(template.tone)
    setStartingLevel(template.startingLevel)
    setStarterQuests(template.starterQuests)
    setStarterLore(template.starterLore)
  }

  function toggleTone(tone: string) {
    setTones(prev => prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone])
  }

  async function generateDescription() {
    setGeneratingAI(true)
    try {
      const recap = await generateSessionRecap({
        previousSessions: [],
        characterName: name || 'New Campaign',
        campaignName: name,
        notes: `Generate a compelling campaign description for a D&D campaign called "${name || 'Untitled'}". Setting: ${setting || 'fantasy world'}. Tone: ${tones.join(', ') || 'high fantasy'}. Starting level: ${startingLevel}. Return JSON with title and summary fields. The summary should be the campaign description (2-3 paragraphs).`,
      })
      if (recap.summary) setDescription(recap.summary)
    } catch { /* silently fail */ }
    setGeneratingAI(false)
  }

  async function generateSession0() {
    setGeneratingAI(true)
    try {
      const recap = await generateSessionRecap({
        previousSessions: [],
        campaignName: name,
        notes: `Generate a Session 0 summary for a D&D campaign called "${name}". Setting: ${setting}. Tone: ${tones.join(', ')}. Starting level: ${startingLevel}. Schedule: ${schedule || 'TBD'}. Session length: ${sessionLength}. House rules: ${houseRules || 'none'}. Content boundaries: ${contentBoundaries || 'none'}. Return JSON with title and summary fields. The summary should cover expectations, tone, rules reminders, and what players should prepare.`,
      })
      if (recap.summary) setSessionZeroNotes(recap.summary)
    } catch { /* silently fail */ }
    setGeneratingAI(false)
  }

  function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    setError(null)
    try {
      const code = generateInviteCode()
      const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description,
          invite_code: code,
          is_active: true,
          setting,
          tone: tones,
          starting_level: startingLevel,
          house_rules: houseRules,
          schedule: `${schedule}${sessionLength ? ` (${sessionLength})` : ''}`,
          session_zero_notes: sessionZeroNotes,
          module_template: selectedTemplate?.id ?? null,
          content_boundaries: contentBoundaries,
        })
        .select()
        .single()
      if (createError) throw createError

      // Add DM as campaign member
      await supabase.from('campaign_members').insert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: 'dm',
        character_id: null,
      })

      // Create starter quests
      for (const quest of starterQuests) {
        await supabase.from('campaign_quests').insert({
          campaign_id: campaign.id,
          user_id: user.id,
          title: quest.title,
          description: quest.description,
          objectives: quest.objectives.map(o => ({ text: o, completed: false })),
          status: 'active',
          sort_order: 0,
        })
      }

      // Create starter lore
      for (const lore of starterLore) {
        await supabase.from('campaign_lore').insert({
          campaign_id: campaign.id,
          user_id: user.id,
          name: lore.name,
          category: lore.category,
          description: lore.description,
          tags: [],
          is_pinned: false,
        })
      }

      // Invalidate campaigns query so the list refreshes on DM Dashboard
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })

      setInviteCode(code)
      setStep('invite')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  function copyInviteCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const stepIndex = STEPS.findIndex(s => s.id === step)
  const canGoBack = stepIndex > 0 && step !== 'invite'
  const canGoNext = stepIndex < STEPS.length - 1

  function nextStep() {
    if (step === 'content') {
      handleCreate()
      return
    }
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
  }

  function prevStep() {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx > 0) setStep(STEPS[idx - 1].id)
  }

  function canProceed(): boolean {
    switch (step) {
      case 'type': return campaignType === 'module' ? !!selectedTemplate : true
      case 'details': return name.trim().length > 0
      case 'tone': return true
      case 'rules': return true
      case 'session0': return true
      case 'content': return true
      case 'invite': return true
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-parchment-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Swords size={28} className="text-gold-400" />
          <h1 className="font-display text-3xl text-ink-900">Create Campaign</h1>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display uppercase transition-colors ${
                i <= stepIndex ? 'bg-gold-400 text-ink-900' : 'bg-parchment-300 text-ink-400'
              }`}>
                {i < stepIndex ? <Check size={12} /> : s.icon}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="text-ink-300 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>
        )}

        {/* ─── STEP: TYPE ─── */}
        {step === 'type' && (
          <div className="space-y-6">
            <SectionHeader>Choose Campaign Type</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => { setCampaignType('module'); setSelectedTemplate(null) }}
                className={`p-6 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  campaignType === 'module' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300 hover:border-parchment-400'
                }`}
              >
                <BookOpen size={32} className="text-gold-500 mb-3" />
                <div className="font-display text-lg text-ink-900">Official Module</div>
                <p className="text-sm text-ink-500 mt-1">Choose a published adventure. Pre-fills campaign details, quests, and lore.</p>
              </button>
              <button
                onClick={() => { setCampaignType('homebrew'); setSelectedTemplate(null); setName(''); setDescription(''); setSetting(''); setTones([]); setStarterQuests([]); setStarterLore([]) }}
                className={`p-6 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  campaignType === 'homebrew' ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300 hover:border-parchment-400'
                }`}
              >
                <Sparkles size={32} className="text-arcane-500 mb-3" />
                <div className="font-display text-lg text-ink-900">Homebrew</div>
                <p className="text-sm text-ink-500 mt-1">Build your own world from scratch. AI assistance available at every step.</p>
              </button>
            </div>

            {campaignType === 'module' && (
              <>
                <Divider />
                <SectionHeader>Select a Module</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CAMPAIGN_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all ${
                        selectedTemplate?.id === t.id ? 'border-gold-400 bg-gold-100/50' : 'border-parchment-300 hover:border-parchment-400'
                      }`}
                    >
                      <div className="font-display text-sm text-ink-900">{t.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-ink-400">Levels {t.levelRange}</span>
                        <span className="text-xs text-ink-400">·</span>
                        <span className="text-xs text-ink-400">{t.setting}</span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {t.tone.map(tone => (
                          <Badge key={tone} variant="default">{tone}</Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── STEP: DETAILS ─── */}
        {step === 'details' && (
          <div className="space-y-4">
            <SectionHeader>Campaign Details</SectionHeader>
            <Input
              label="Campaign Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="The Lost Kingdom..."
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-display uppercase text-ink-500">Description</label>
                {campaignType === 'homebrew' && (
                  <Button size="sm" variant="ghost" onClick={generateDescription} disabled={generatingAI}>
                    {generatingAI ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                    AI Generate
                  </Button>
                )}
              </div>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your campaign's premise..."
              />
            </div>
            <Input
              label="World / Setting"
              value={setting}
              onChange={e => setSetting(e.target.value)}
              placeholder="e.g., Forgotten Realms, Eberron, or your homebrew world"
            />
          </div>
        )}

        {/* ─── STEP: TONE ─── */}
        {step === 'tone' && (
          <div className="space-y-4">
            <SectionHeader>Tone & Themes</SectionHeader>
            <p className="text-sm text-ink-500">Select the tones that best describe your campaign. This helps set expectations for players.</p>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map(tone => (
                <button
                  key={tone}
                  onClick={() => toggleTone(tone)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-display cursor-pointer transition-all ${
                    tones.includes(tone) ? 'border-gold-400 bg-gold-100/50 text-ink-900' : 'border-parchment-300 text-ink-500 hover:border-parchment-400'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <Textarea
              label="Content Boundaries (optional)"
              value={contentBoundaries}
              onChange={e => setContentBoundaries(e.target.value)}
              rows={2}
              placeholder="e.g., PG-13 content, no graphic violence, fade-to-black..."
            />
          </div>
        )}

        {/* ─── STEP: RULES ─── */}
        {step === 'rules' && (
          <div className="space-y-4">
            <SectionHeader>Rules & Settings</SectionHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display uppercase text-ink-500 mb-1">Starting Level</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={startingLevel}
                  onChange={e => setStartingLevel(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg font-mono text-center text-lg focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>
            <Textarea
              label="House Rules (optional)"
              value={houseRules}
              onChange={e => setHouseRules(e.target.value)}
              rows={4}
              placeholder="Any campaign-specific rules, variant rules, or homebrew mechanics..."
            />
          </div>
        )}

        {/* ─── STEP: SESSION 0 ─── */}
        {step === 'session0' && (
          <div className="space-y-4">
            <SectionHeader>Session 0 Notes</SectionHeader>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Schedule"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                placeholder="e.g., Every Saturday 6-10pm EST"
              />
              <div>
                <label className="block text-xs font-display uppercase text-ink-500 mb-1">Session Length</label>
                <select
                  value={sessionLength}
                  onChange={e => setSessionLength(e.target.value)}
                  className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-lg text-sm focus:outline-none focus:border-gold-400"
                >
                  <option value="2hrs">2 hours</option>
                  <option value="3hrs">3 hours</option>
                  <option value="4hrs">4 hours</option>
                  <option value="open">Open-ended</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-display uppercase text-ink-500">Session 0 Summary</label>
                <Button size="sm" variant="ghost" onClick={generateSession0} disabled={generatingAI}>
                  {generatingAI ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                  AI Generate
                </Button>
              </div>
              <Textarea
                value={sessionZeroNotes}
                onChange={e => setSessionZeroNotes(e.target.value)}
                rows={6}
                placeholder="Expectations, tone, what players should prepare..."
              />
            </div>
          </div>
        )}

        {/* ─── STEP: CONTENT ─── */}
        {step === 'content' && (
          <div className="space-y-6">
            <SectionHeader>Initial Content (Optional)</SectionHeader>
            <p className="text-sm text-ink-500">These will be automatically added to your campaign's quests and lore. You can edit them later.</p>

            {starterQuests.length > 0 && (
              <div>
                <h3 className="font-display text-sm uppercase text-ink-500 mb-2">Starter Quests</h3>
                <div className="space-y-2">
                  {starterQuests.map((q, i) => (
                    <Card key={i}>
                      <div className="font-display text-sm text-ink-900">{q.title}</div>
                      <p className="text-xs text-ink-600 mt-1">{q.description}</p>
                      {q.objectives.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {q.objectives.map((o, j) => (
                            <li key={j} className="text-xs text-ink-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {starterLore.length > 0 && (
              <div>
                <h3 className="font-display text-sm uppercase text-ink-500 mb-2">World Lore</h3>
                <div className="space-y-2">
                  {starterLore.map((l, i) => (
                    <Card key={i}>
                      <div className="flex items-center gap-2">
                        <div className="font-display text-sm text-ink-900">{l.name}</div>
                        <Badge variant="default">{l.category}</Badge>
                      </div>
                      <p className="text-xs text-ink-600 mt-1">{l.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {starterQuests.length === 0 && starterLore.length === 0 && (
              <Card>
                <p className="text-sm text-ink-400 text-center py-4">No starter content. You can add quests and lore after creating the campaign.</p>
              </Card>
            )}
          </div>
        )}

        {/* ─── STEP: INVITE ─── */}
        {step === 'invite' && inviteCode && (
          <div className="space-y-6 text-center">
            <div>
              <Crown size={48} className="text-gold-400 mx-auto mb-4" />
              <h2 className="font-display text-2xl text-ink-900">Campaign Created!</h2>
              <p className="text-sm text-ink-500 mt-2">Share this invite code with your players so they can join.</p>
            </div>

            <Card className="max-w-sm mx-auto">
              <div className="text-center">
                <div className="font-mono text-4xl tracking-[0.3em] text-gold-500 font-bold mb-3">
                  {inviteCode}
                </div>
                <Button onClick={copyInviteCode} variant="secondary">
                  <Copy size={14} className="mr-1" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </Card>

            <Button onClick={() => { sessionStorage.setItem('campaign-just-created', '1'); navigate('/dm') }} className="mx-auto">
              Go to DM Dashboard
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step !== 'invite' && (
          <>
            <Divider />
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={canGoBack ? prevStep : () => navigate(-1)}>
                {canGoBack ? <><ChevronLeft size={14} className="mr-1" /> Back</> : 'Cancel'}
              </Button>
              {step === 'content' ? (
                <Button onClick={handleCreate} disabled={creating || !canProceed()}>
                  {creating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Swords size={14} className="mr-1" />}
                  {creating ? 'Creating...' : 'Create Campaign'}
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={!canProceed()}>
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
