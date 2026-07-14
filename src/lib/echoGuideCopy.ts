/**
 * Echo's per-step explainers for the character creation wizard.
 *
 * Keyed by the wizard's Step union rather than by index: four steps (asi,
 * feature-choices, weapon-mastery, spells) only appear for some characters, so
 * positions shift.
 */

export type EchoStep =
  | 'species'
  | 'class'
  | 'background'
  | 'abilities'
  | 'skills'
  | 'asi'
  | 'feature-choices'
  | 'weapon-mastery'
  | 'equipment'
  | 'spells'
  | 'details'
  | 'review'

export interface EchoLine {
  title: string
  body: string
}

export const ECHO_INTRO: EchoLine = {
  title: 'ECHO online',
  body: "Greetings, adventurer. I am ECHO — the Enhanced Character & History Organizer. I'll walk you through building this character, one step at a time. Nothing here is permanent; you can change almost all of it later. Lets boogie.",
}

export const ECHO_STEP_COPY: Record<EchoStep, EchoLine> = {
  species: {
    title: 'Species',
    body: 'Your species is the body you were born into. It sets your size and speed, and grants a few innate traits — darkvision, a breath weapon, resistance to a damage type. It no longer changes your ability scores in the 2024 rules, so pick the one you want to play, not the one that "optimizes" your class.',
  },
  class: {
    title: 'Class',
    body: "Your class is what you actually do at the table — the biggest decision here. It determines your hit points, your proficiencies, whether you cast spells, and nearly every button you'll press in combat. If you're starting out: Fighter and Rogue are the easiest to play well.",
  },
  background: {
    title: 'Background',
    body: 'Your background is who you were before the adventuring started. In the 2024 rules it does real mechanical work: it grants your ability score increases, two skills, a tool, and an origin feat. This is where your +2/+1 to abilities comes from, so choose it with your class in mind.',
  },
  abilities: {
    title: 'Ability Scores',
    body: "Six numbers that underpin everything you roll. Put your highest score in your class's primary ability — Strength or Dexterity for a fighter, Intelligence for a wizard, Charisma for a bard. Constitution is never a wasted point; it's your hit points and your concentration saves.",
  },
  skills: {
    title: 'Skills',
    body: "Skills are what you're trained at outside combat, and proficiency adds your proficiency bonus to those checks. Your class and background have already claimed some of these for you — you're choosing the rest. Perception is the single most-rolled skill in the game.",
  },
  asi: {
    title: 'Feats',
    body: "You've reached a level that grants an Ability Score Improvement. You can raise your scores, or take a feat instead — a named package of abilities that's usually more interesting than +1 to a number. Your call.",
  },
  'feature-choices': {
    title: 'Feature Choices',
    body: 'Your class gives you options here — a fighting style, a subclass, a divine order, or similar. These define how your class specifically expresses itself. Read them properly; some are much harder to change later than others.',
  },
  'weapon-mastery': {
    title: 'Weapon Mastery',
    body: "New in the 2024 rules: each weapon has a mastery property that triggers when you hit with it — Topple knocks prone, Vex grants advantage, Graze deals damage even on a miss. You're choosing which weapons you've mastered. Pick the ones you'll actually be swinging.",
  },
  equipment: {
    title: 'Equipment',
    body: "Your starting gear. You can take your class's standard package or spend the gold yourself, and armor matters most here — it sets your Armor Class, which is how hard you are to hit. Don't leave without a weapon you can actually use.",
  },
  spells: {
    title: 'Spells',
    body: "Choose the magic you carry. Cantrips are unlimited and cost nothing — always have a reliable damage cantrip. Levelled spells consume slots, so balance combat spells against utility. If you're a prepared caster, you'll be able to swap these out after each long rest.",
  },
  details: {
    title: 'Details',
    body: "The part the dice can't give you: name, appearance, and the personality your character carries into the room. It's also the part I'll draw on when you ask me for advice in-character later. Even a sentence of backstory pays for itself.",
  },
  review: {
    title: 'Review',
    body: "Last look. Check your hit points, your Armor Class, and that your class and species features are all present. Once you create the character I'll be waiting on the dashboard — and everything here stays editable from your sheet.",
  },
}
