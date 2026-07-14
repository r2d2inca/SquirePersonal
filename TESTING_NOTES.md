# Squire — Testing Notes

A running log of changes for testers (newest round first). Each round lists what
changed and how to test it. Items marked **(needs migration)** require a database
migration to be applied before they work.

---

## Round 2 — Party Overview fix & per-player lore (June 2026)

### 👥 DM Party Overview now shows your players
Previously the DM's Party Overview could come up empty even with players in the
campaign. Players who have a character now appear, and the link self-corrects
going forward (if someone joins before making a character, or swaps characters
later, they show up once they have an active character).
- **Test:** As DM, open Party Overview — you should see all party members who have
  characters. Have a player create or swap their character and confirm the party
  list updates for you.
- **Note:** The DM's own entry won't appear in the party list (by design), and a
  player with no character yet won't show until they make one.

### 📖 Lore can be shared with specific players **(needs migration)**
The lore reveal toggle is now three options the DM sets per entry:
- **Everyone** — all party members see it
- **Select players** — pick exactly which players can see it (checkboxes of your party)
- **Hidden** — DM only

Each entry shows its status ("Shared with 2", "Hidden", etc.). Visibility is
enforced server-side, so a player who isn't included genuinely can't see the entry.
- **Test:** As DM, set a lore entry to **Select players** and check just one player.
  Confirm that player sees it and the others don't. Switch to **Everyone** (all see
  it) and **Hidden** (players don't).

---

## Round 1 — Beta fixes, realtime, conditions & DM tools (June 2026)

### 🔮 Spells & character data
- **Racial spells appear automatically** — e.g. a Tiefling who leveled past 5 now
  gets **Darkness** (and Hellish Rebuke at 3) added on its own when the sheet opens.
- **Legacy spells no longer inflate the spell count** — free racial spells don't
  count toward "Spells Known".
- **Feat-granted spells auto-appear** (Fey Touched → Misty Step, Shadow Touched →
  Invisibility, etc.) if they were missing.
- **Artificer gets spells now** (previously showed zero).
- **Spell levels fixed** — Phantasmal Force is 2nd-level, Dissonant Whispers is 1st.
- **Missing subclass features added** at level 3 for all Barbarian paths and Bard
  colleges.
- **Spell slots self-correct** — e.g. a level 10 full caster missing 5th-level slots
  gets them on load.

### 🛡️ Armor & magic items
- **AC-boosting magic items now stack correctly** — Bracers of Defense, Cloak/Ring
  of Protection, magic helmets. *(Test: add an item with "+X bonus to AC" in its
  description and confirm AC rises, including over Unarmored Defense.)*

### ⚔️ Combat tracker
- **Updates live** — initiative, HP, and adding/removing combatants sync to players
  in real time (no refresh).
- **Conditions banner on the character sheet** — apply/remove the 14 standard
  conditions with one tap; hover for the rules text.
- **Concentration prompt** — mark what you're concentrating on; taking damage fires
  a CON-save prompt at the correct DC, with one click to drop concentration.

### 💬 Messaging
- **Campaign chat is real-time** — group and direct messages appear within a second
  instead of needing repeated refreshes.

### 🎲 DM tools **(needs migration)**
- **Award XP** (Party Overview → Award XP) — give XP to one player or the whole
  party; a "Level Up" badge appears when someone crosses a threshold. Players still
  run the level-up wizard themselves.
- **Reveal lore to players** — DM can hide/reveal lore entries. *(Superseded in
  Round 2 by the three-way Everyone / Select players / Hidden control.)*

### ✨ Smaller fixes
- Header **speed** reflects bonuses (not always 30 ft).
- **Temp HP** uses a high-visibility color.
- **AI session recaps** are factual and third-person (no invented thoughts/dialogue).
