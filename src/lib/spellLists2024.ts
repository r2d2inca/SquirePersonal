/**
 * 2024 PHB class spell lists from D&D 5e wikidot.
 * Used for determining which spells each class can learn per 2024 PHB rules.
 * Spell details (description, components, etc.) are still fetched from the SRD API.
 *
 * Format: class name → array of { name, level, index }
 * The 'index' is the SRD-compatible slug used to fetch details from the API.
 */

export interface SpellListEntry {
  name: string
  level: number  // 0 = cantrip
  index: string  // SRD-compatible slug for API lookup
}

function toIndex(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[:/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function spells(level: number, names: string[]): SpellListEntry[] {
  return names.map(name => ({ name, level, index: toIndex(name) }))
}

// ─── WIZARD ───

const WIZARD_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite', 'Gust', 'Light', 'Lightning Lure', 'Mage Hand', 'Mending', 'Message', 'Mind Sliver', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Sword Burst', 'Thunderclap', 'Toll the Dead', 'True Strike']),
  ...spells(1, ['Absorb Elements', 'Alarm', 'Burning Hands', 'Catapult', 'Cause Fear', 'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self', 'Earth Tremor', 'Expeditious Retreat', 'False Life', 'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Frost Fingers', 'Grease', 'Ice Knife', 'Identify', 'Illusory Script', 'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile', 'Protection from Evil and Good', 'Ray of Sickness', 'Shield', 'Silent Image', 'Silvery Barbs', 'Sleep', 'Snare', "Tasha's Caustic Brew", "Tasha's Hideous Laughter", "Tenser's Floating Disk", 'Thunderwave', 'Unseen Servant', 'Witch Bolt']),
  ...spells(2, ["Aganazzar's Scorcher", 'Alter Self', 'Arcane Lock', 'Augury', 'Blindness/Deafness', 'Blur', 'Cloud of Daggers', 'Continual Flame', 'Crown of Madness', 'Darkness', 'Darkvision', 'Detect Thoughts', "Dragon's Breath", 'Dust Devil', 'Earthbind', 'Enhance Ability', 'Enlarge/Reduce', 'Flaming Sphere', 'Gentle Repose', 'Gust of Wind', 'Hold Person', 'Invisibility', 'Kinetic Jaunt', 'Knock', 'Levitate', 'Locate Object', 'Magic Mouth', 'Magic Weapon', "Maximillian's Earthen Grasp", "Melf's Acid Arrow", 'Mind Spike', 'Mirror Image', 'Misty Step', "Nathair's Mischief", "Nystul's Magic Aura", 'Phantasmal Force', 'Pyrotechnics', 'Ray of Enfeeblement', "Rime's Binding Ice", 'Rope Trick', 'Scorching Ray', 'See Invisibility', 'Shadow Blade', 'Shatter', "Snilloc's Snowball Swarm", 'Spider Climb', 'Suggestion', "Tasha's Mind Whip", 'Vortex Warp', 'Warding Wind', 'Web', 'Wither and Bloom']),
  ...spells(3, ['Animate Dead', 'Bestow Curse', 'Blink', 'Catnap', 'Clairvoyance', 'Counterspell', 'Dispel Magic', 'Enemies Abound', 'Erupting Earth', 'Fear', 'Feign Death', 'Fireball', 'Flame Arrows', 'Fly', 'Gaseous Form', 'Glyph of Warding', 'Haste', 'Hypnotic Pattern', 'Intellect Fortress', "Leomund's Tiny Hut", 'Life Transference', 'Lightning Bolt', 'Magic Circle', 'Major Image', "Melf's Minute Meteors", 'Nondetection', 'Phantom Steed', 'Protection from Energy', 'Remove Curse', 'Sending', 'Sleet Storm', 'Slow', 'Speak with Dead', 'Spirit Shroud', 'Stinking Cloud', 'Summon Fey', 'Summon Shadowspawn', 'Summon Undead', 'Thunder Step', 'Tidal Wave', 'Tiny Servant', 'Tongues', 'Vampiric Touch', 'Wall of Sand', 'Wall of Water', 'Water Breathing']),
  ...spells(4, ['Arcane Eye', 'Banishment', 'Blight', 'Charm Monster', 'Confusion', 'Control Water', 'Dimension Door', 'Divination', "Evard's Black Tentacles", 'Fabricate', 'Fire Shield', 'Greater Invisibility', 'Hallucinatory Terrain', 'Ice Storm', "Leomund's Secret Chest", 'Locate Creature', "Mordenkainen's Faithful Hound", "Mordenkainen's Private Sanctum", "Otiluke's Resilient Sphere", 'Phantasmal Killer', 'Polymorph', "Raulothim's Psychic Lance", 'Sickening Radiance', 'Stone Shape', 'Stoneskin', 'Storm Sphere', 'Summon Aberration', 'Summon Construct', 'Summon Elemental', 'Vitriolic Sphere', 'Wall of Fire', 'Watery Sphere']),
  ...spells(5, ['Animate Objects', "Bigby's Hand", 'Cloudkill', 'Cone of Cold', 'Conjure Elemental', 'Contact Other Plane', 'Control Winds', 'Creation', 'Dawn', 'Dominate Person', 'Dream', 'Enervation', 'Far Step', 'Geas', 'Hold Monster', 'Immolation', 'Legend Lore', 'Mislead', 'Modify Memory', 'Passwall', 'Planar Binding', "Rary's Telepathic Bond", 'Scrying', 'Seeming', 'Steel Wind Strike', 'Summon Draconic Spirit', 'Synaptic Static', 'Telekinesis', 'Teleportation Circle', 'Transmute Rock', 'Wall of Force', 'Wall of Light', 'Wall of Stone']),
  ...spells(6, ['Arcane Gate', 'Chain Lightning', 'Circle of Death', 'Contingency', 'Create Undead', 'Disintegrate', "Drawmij's Instant Summons", 'Eyebite', "Fizban's Platinum Shield", 'Flesh to Stone', 'Globe of Invulnerability', 'Guards and Wards', 'Magic Jar', 'Mass Suggestion', 'Mental Prison', 'Move Earth', "Otiluke's Freezing Sphere", "Otto's Irresistible Dance", 'Programmed Illusion', 'Scatter', 'Soul Cage', 'Summon Fiend', 'Sunbeam', "Tasha's Otherworldly Guise", "Tenser's Transformation", 'True Seeing', 'Wall of Ice']),
  ...spells(7, ['Crown of Stars', 'Delayed Blast Fireball', 'Draconic Transformation', 'Etherealness', 'Finger of Death', 'Forcecage', 'Mirage Arcane', "Mordenkainen's Magnificent Mansion", "Mordenkainen's Sword", 'Plane Shift', 'Prismatic Spray', 'Project Image', 'Reverse Gravity', 'Sequester', 'Simulacrum', 'Symbol', 'Teleport', 'Whirlwind']),
  ...spells(8, ["Abi-Dalzim's Horrid Wilting", 'Antimagic Field', 'Antipathy/Sympathy', 'Clone', 'Control Weather', 'Demiplane', 'Dominate Monster', 'Feeblemind', 'Incendiary Cloud', 'Maze', 'Mind Blank', 'Power Word: Stun', 'Sunburst', 'Telepathy']),
  ...spells(9, ['Astral Projection', 'Blade of Disaster', 'Foresight', 'Gate', 'Imprisonment', 'Mass Polymorph', 'Meteor Swarm', 'Power Word: Kill', 'Prismatic Wall', 'Psychic Scream', 'Shapechange', 'Time Stop', 'True Polymorph', 'Weird', 'Wish']),
]

// ─── CLERIC ───

const CLERIC_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Guidance', 'Light', 'Mending', 'Resistance', 'Sacred Flame', 'Spare the Dying', 'Thaumaturgy', 'Toll the Dead', 'Word of Radiance']),
  ...spells(1, ['Bane', 'Bless', 'Ceremony', 'Command', 'Create or Destroy Water', 'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease', 'Guiding Bolt', 'Healing Word', 'Inflict Wounds', 'Protection from Evil and Good', 'Purify Food and Drink', 'Sanctuary', 'Shield of Faith']),
  ...spells(2, ['Aid', 'Augury', 'Blindness/Deafness', 'Calm Emotions', 'Continual Flame', 'Enhance Ability', 'Find Traps', 'Gentle Repose', 'Hold Person', 'Lesser Restoration', 'Locate Object', 'Prayer of Healing', 'Protection from Poison', 'Silence', 'Spiritual Weapon', 'Warding Bond', 'Zone of Truth']),
  ...spells(3, ['Animate Dead', 'Aura of Vitality', 'Beacon of Hope', 'Bestow Curse', 'Clairvoyance', 'Create Food and Water', 'Daylight', 'Dispel Magic', 'Feign Death', 'Glyph of Warding', 'Life Transference', 'Magic Circle', 'Mass Healing Word', 'Meld into Stone', 'Protection from Energy', 'Remove Curse', 'Revivify', 'Sending', 'Speak with Dead', 'Spirit Guardians', 'Spirit Shroud', 'Tongues', 'Water Walk']),
  ...spells(4, ['Aura of Life', 'Aura of Purity', 'Banishment', 'Control Water', 'Death Ward', 'Divination', 'Freedom of Movement', 'Guardian of Faith', 'Locate Creature', 'Stone Shape']),
  ...spells(5, ['Commune', 'Contagion', 'Dawn', 'Dispel Evil and Good', 'Flame Strike', 'Geas', 'Greater Restoration', 'Hallow', 'Holy Weapon', 'Insect Plague', 'Legend Lore', 'Mass Cure Wounds', 'Planar Binding', 'Raise Dead', 'Scrying', 'Summon Celestial']),
  ...spells(6, ['Blade Barrier', 'Create Undead', 'Find the Path', 'Forbiddance', 'Harm', 'Heal', "Heroes' Feast", 'Planar Ally', 'Sunbeam', 'True Seeing', 'Word of Recall']),
  ...spells(7, ['Conjure Celestial', 'Divine Word', 'Etherealness', 'Fire Storm', 'Plane Shift', 'Regenerate', 'Resurrection', 'Symbol', 'Temple of the Gods']),
  ...spells(8, ['Antimagic Field', 'Control Weather', 'Earthquake', 'Holy Aura', 'Sunburst']),
  ...spells(9, ['Astral Projection', 'Gate', 'Mass Heal', 'Power Word: Heal', 'True Resurrection']),
]

// ─── BARD ───

const BARD_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Blade Ward', 'Dancing Lights', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Prestidigitation', 'Thunderclap', 'True Strike', 'Vicious Mockery']),
  ...spells(1, ['Animal Friendship', 'Bane', 'Charm Person', 'Color Spray', 'Command', 'Comprehend Languages', 'Cure Wounds', 'Detect Magic', 'Disguise Self', 'Dissonant Whispers', 'Earth Tremor', 'Faerie Fire', 'Feather Fall', 'Healing Word', 'Heroism', 'Identify', 'Illusory Script', 'Longstrider', 'Silent Image', 'Silvery Barbs', 'Sleep', 'Speak with Animals', "Tasha's Hideous Laughter", 'Thunderwave', 'Unseen Servant']),
  ...spells(2, ['Aid', 'Animal Messenger', 'Blindness/Deafness', 'Calm Emotions', 'Cloud of Daggers', 'Crown of Madness', 'Detect Thoughts', 'Enhance Ability', 'Enlarge/Reduce', 'Enthrall', 'Heat Metal', 'Hold Person', 'Invisibility', 'Kinetic Jaunt', 'Knock', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Magic Mouth', 'Mirror Image', "Nathair's Mischief", 'Phantasmal Force', 'Pyrotechnics', 'See Invisibility', 'Shatter', 'Silence', 'Suggestion', 'Warding Wind', 'Zone of Truth']),
  ...spells(3, ['Bestow Curse', 'Catnap', 'Clairvoyance', 'Dispel Magic', 'Enemies Abound', 'Fear', 'Feign Death', 'Glyph of Warding', 'Hypnotic Pattern', 'Intellect Fortress', "Leomund's Tiny Hut", 'Major Image', 'Mass Healing Word', 'Nondetection', 'Plant Growth', 'Sending', 'Slow', 'Speak with Dead', 'Speak with Plants', 'Stinking Cloud', 'Tongues']),
  ...spells(4, ['Charm Monster', 'Compulsion', 'Confusion', 'Dimension Door', 'Freedom of Movement', 'Greater Invisibility', 'Hallucinatory Terrain', 'Locate Creature', 'Phantasmal Killer', 'Polymorph', "Raulothim's Psychic Lance"]),
  ...spells(5, ['Animate Objects', 'Awaken', 'Dominate Person', 'Dream', 'Geas', 'Greater Restoration', 'Hold Monster', 'Legend Lore', 'Mass Cure Wounds', 'Mislead', 'Modify Memory', 'Planar Binding', 'Raise Dead', "Rary's Telepathic Bond", 'Scrying', 'Seeming', 'Synaptic Static', 'Teleportation Circle']),
  ...spells(6, ['Eyebite', 'Find the Path', 'Guards and Wards', "Heroes' Feast", 'Mass Suggestion', "Otto's Irresistible Dance", 'Programmed Illusion', 'True Seeing']),
  ...spells(7, ['Etherealness', 'Forcecage', 'Mirage Arcane', "Mordenkainen's Magnificent Mansion", "Mordenkainen's Sword", 'Prismatic Spray', 'Project Image', 'Regenerate', 'Resurrection', 'Symbol', 'Teleport']),
  ...spells(8, ['Antipathy/Sympathy', 'Dominate Monster', 'Feeblemind', 'Glibness', 'Mind Blank', 'Power Word: Stun']),
  ...spells(9, ['Foresight', 'Mass Polymorph', 'Power Word: Heal', 'Power Word: Kill', 'Prismatic Wall', 'Psychic Scream', 'True Polymorph']),
]

// ─── DRUID ───

const DRUID_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Druidcraft', 'Frostbite', 'Guidance', 'Gust', 'Infestation', 'Magic Stone', 'Mending', 'Poison Spray', 'Primal Savagery', 'Produce Flame', 'Resistance', 'Shillelagh', 'Thorn Whip', 'Thunderclap']),
  ...spells(1, ['Absorb Elements', 'Animal Friendship', 'Beast Bond', 'Charm Person', 'Create or Destroy Water', 'Cure Wounds', 'Detect Magic', 'Detect Poison and Disease', 'Earth Tremor', 'Entangle', 'Faerie Fire', 'Fog Cloud', 'Goodberry', 'Healing Word', 'Ice Knife', 'Jump', 'Longstrider', 'Protection from Evil and Good', 'Purify Food and Drink', 'Snare', 'Speak with Animals', 'Thunderwave']),
  ...spells(2, ['Animal Messenger', 'Augury', 'Barkskin', 'Beast Sense', 'Continual Flame', 'Darkvision', 'Dust Devil', 'Earthbind', 'Enhance Ability', 'Enlarge/Reduce', 'Find Traps', 'Flame Blade', 'Flaming Sphere', 'Gust of Wind', 'Heat Metal', 'Hold Person', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Moonbeam', 'Pass Without Trace', 'Protection from Poison', 'Spike Growth', 'Summon Beast', 'Warding Wind', 'Wither and Bloom']),
  ...spells(3, ['Aura of Vitality', 'Call Lightning', 'Conjure Animals', 'Daylight', 'Dispel Magic', 'Elemental Weapon', 'Erupting Earth', 'Feign Death', 'Flame Arrows', 'Meld into Stone', 'Plant Growth', 'Protection from Energy', 'Revivify', 'Sleet Storm', 'Speak with Plants', 'Summon Fey', 'Tidal Wave', 'Wall of Water', 'Water Breathing', 'Water Walk', 'Wind Wall']),
  ...spells(4, ['Blight', 'Charm Monster', 'Confusion', 'Conjure Minor Elementals', 'Conjure Woodland Beings', 'Control Water', 'Divination', 'Dominate Beast', 'Elemental Bane', 'Fire Shield', 'Freedom of Movement', 'Giant Insect', 'Grasping Vine', 'Guardian of Nature', 'Hallucinatory Terrain', 'Ice Storm', 'Locate Creature', 'Polymorph', 'Stone Shape', 'Stoneskin', 'Summon Elemental', 'Wall of Fire', 'Watery Sphere']),
  ...spells(5, ['Antilife Shell', 'Awaken', 'Commune with Nature', 'Cone of Cold', 'Conjure Elemental', 'Contagion', 'Control Winds', 'Geas', 'Greater Restoration', 'Insect Plague', 'Maelstrom', 'Mass Cure Wounds', 'Planar Binding', 'Reincarnate', 'Scrying', 'Summon Draconic Spirit', 'Transmute Rock', 'Tree Stride', 'Wall of Stone', 'Wrath of Nature']),
  ...spells(6, ['Bones of the Earth', 'Conjure Fey', 'Druid Grove', 'Find the Path', 'Flesh to Stone', 'Heal', "Heroes' Feast", 'Move Earth', 'Primordial Ward', 'Sunbeam', 'Transport via Plants', 'Wall of Thorns', 'Wind Walk']),
  ...spells(7, ['Draconic Transformation', 'Fire Storm', 'Mirage Arcane', 'Plane Shift', 'Regenerate', 'Reverse Gravity', 'Symbol', 'Whirlwind']),
  ...spells(8, ['Animal Shapes', 'Antipathy/Sympathy', 'Control Weather', 'Earthquake', 'Feeblemind', 'Incendiary Cloud', 'Sunburst', 'Tsunami']),
  ...spells(9, ['Foresight', 'Shapechange', 'Storm of Vengeance', 'True Resurrection']),
]

// ─── SORCERER ───

const SORCERER_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite', 'Gust', 'Infestation', 'Light', 'Lightning Lure', 'Mage Hand', 'Mending', 'Message', 'Mind Sliver', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Sword Burst', 'Thunderclap', 'True Strike']),
  ...spells(1, ['Absorb Elements', 'Burning Hands', 'Catapult', 'Chaos Bolt', 'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self', 'Earth Tremor', 'Expeditious Retreat', 'False Life', 'Feather Fall', 'Fog Cloud', 'Grease', 'Ice Knife', 'Jump', 'Mage Armor', 'Magic Missile', 'Ray of Sickness', 'Shield', 'Silent Image', 'Silvery Barbs', 'Sleep', "Tasha's Caustic Brew", 'Thunderwave', 'Witch Bolt']),
  ...spells(2, ["Aganazzar's Scorcher", 'Alter Self', 'Blindness/Deafness', 'Blur', 'Cloud of Daggers', 'Crown of Madness', 'Darkness', 'Darkvision', 'Detect Thoughts', "Dragon's Breath", 'Dust Devil', 'Earthbind', 'Enhance Ability', 'Enlarge/Reduce', 'Flame Blade', 'Flaming Sphere', 'Gust of Wind', 'Hold Person', "Icingdeath's Frost", 'Invisibility', 'Kinetic Jaunt', 'Knock', 'Levitate', 'Magic Weapon', "Maximillian's Earthen Grasp", 'Mind Spike', 'Mirror Image', 'Misty Step', "Nathair's Mischief", 'Phantasmal Force', 'Pyrotechnics', "Rime's Binding Ice", 'Scorching Ray', 'See Invisibility', 'Shadow Blade', 'Shatter', "Snilloc's Snowball Swarm", 'Spider Climb', 'Suggestion', "Tasha's Mind Whip", 'Vortex Warp', 'Warding Wind', 'Web', 'Wither and Bloom']),
  ...spells(3, ['Blink', 'Catnap', 'Clairvoyance', 'Counterspell', 'Daylight', 'Dispel Magic', 'Enemies Abound', 'Erupting Earth', 'Fear', 'Fireball', 'Flame Arrows', 'Fly', 'Gaseous Form', 'Haste', 'Hypnotic Pattern', 'Intellect Fortress', 'Lightning Bolt', 'Major Image', "Melf's Minute Meteors", 'Protection from Energy', 'Sleet Storm', 'Slow', 'Stinking Cloud', 'Thunder Step', 'Tidal Wave', 'Tongues', 'Vampiric Touch', 'Wall of Water', 'Water Breathing', 'Water Walk']),
  ...spells(4, ['Banishment', 'Blight', 'Charm Monster', 'Confusion', 'Dimension Door', 'Dominate Beast', 'Fire Shield', 'Greater Invisibility', 'Ice Storm', 'Polymorph', "Raulothim's Psychic Lance", 'Sickening Radiance', 'Stoneskin', 'Storm Sphere', 'Vitriolic Sphere', 'Wall of Fire', 'Watery Sphere']),
  ...spells(5, ['Animate Objects', "Bigby's Hand", 'Cloudkill', 'Cone of Cold', 'Control Winds', 'Creation', 'Dominate Person', 'Enervation', 'Far Step', 'Hold Monster', 'Immolation', 'Insect Plague', 'Seeming', 'Summon Draconic Spirit', 'Synaptic Static', 'Telekinesis', 'Teleportation Circle', 'Wall of Light', 'Wall of Stone']),
  ...spells(6, ['Arcane Gate', 'Chain Lightning', 'Circle of Death', 'Disintegrate', 'Eyebite', "Fizban's Platinum Shield", 'Flesh to Stone', 'Globe of Invulnerability', 'Mass Suggestion', 'Mental Prison', 'Move Earth', "Otiluke's Freezing Sphere", 'Scatter', 'Sunbeam', "Tasha's Otherworldly Guise", 'True Seeing']),
  ...spells(7, ['Crown of Stars', 'Delayed Blast Fireball', 'Draconic Transformation', 'Etherealness', 'Finger of Death', 'Fire Storm', 'Plane Shift', 'Prismatic Spray', 'Reverse Gravity', 'Teleport']),
  ...spells(8, ["Abi-Dalzim's Horrid Wilting", 'Demiplane', 'Dominate Monster', 'Earthquake', 'Incendiary Cloud', 'Power Word: Stun', 'Sunburst']),
  ...spells(9, ['Blade of Disaster', 'Gate', 'Mass Polymorph', 'Meteor Swarm', 'Power Word: Kill', 'Psychic Scream', 'Time Stop', 'Wish']),
]

// ─── WARLOCK ───

const WARLOCK_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Blade Ward', 'Chill Touch', 'Create Bonfire', 'Eldritch Blast', 'Friends', 'Frostbite', 'Infestation', 'Lightning Lure', 'Mage Hand', 'Magic Stone', 'Mind Sliver', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Sword Burst', 'Thunderclap', 'Toll the Dead', 'True Strike']),
  ...spells(1, ['Armor of Agathys', 'Arms of Hadar', 'Cause Fear', 'Charm Person', 'Comprehend Languages', 'Expeditious Retreat', 'Hellish Rebuke', 'Hex', 'Illusory Script', 'Protection from Evil and Good', 'Unseen Servant', 'Witch Bolt']),
  ...spells(2, ['Cloud of Daggers', 'Crown of Madness', 'Darkness', 'Earthbind', 'Enthrall', 'Hold Person', 'Invisibility', 'Mind Spike', 'Mirror Image', 'Misty Step', 'Ray of Enfeeblement', 'Shadow Blade', 'Shatter', 'Spider Climb', 'Suggestion']),
  ...spells(3, ['Counterspell', 'Dispel Magic', 'Enemies Abound', 'Fear', 'Fly', 'Gaseous Form', 'Hunger of Hadar', 'Hypnotic Pattern', 'Intellect Fortress', 'Magic Circle', 'Major Image', 'Remove Curse', 'Spirit Shroud', 'Summon Fey', 'Summon Shadowspawn', 'Summon Undead', 'Thunder Step', 'Tongues', 'Vampiric Touch']),
  ...spells(4, ['Banishment', 'Blight', 'Charm Monster', 'Dimension Door', 'Elemental Bane', 'Hallucinatory Terrain', "Raulothim's Psychic Lance", 'Shadow of Moil', 'Sickening Radiance', 'Summon Aberration', 'Summon Greater Demon']),
  ...spells(5, ['Contact Other Plane', 'Danse Macabre', 'Dream', 'Enervation', 'Far Step', 'Hold Monster', 'Infernal Calling', 'Mislead', 'Negative Energy Flood', 'Planar Binding', 'Scrying', 'Synaptic Static', 'Teleportation Circle', 'Wall of Light']),
  ...spells(6, ['Arcane Gate', 'Circle of Death', 'Conjure Fey', 'Create Undead', 'Eyebite', 'Flesh to Stone', 'Mass Suggestion', 'Mental Prison', 'Scatter', 'Soul Cage', 'Summon Fiend', "Tasha's Otherworldly Guise", 'True Seeing']),
  ...spells(7, ['Crown of Stars', 'Etherealness', 'Finger of Death', 'Forcecage', 'Plane Shift']),
  ...spells(8, ['Demiplane', 'Dominate Monster', 'Feeblemind', 'Glibness', 'Maddening Darkness', 'Power Word: Stun']),
  ...spells(9, ['Astral Projection', 'Blade of Disaster', 'Foresight', 'Gate', 'Imprisonment', 'Power Word: Kill', 'Psychic Scream', 'True Polymorph', 'Weird']),
]

// ─── PALADIN ───

const PALADIN_SPELLS: SpellListEntry[] = [
  ...spells(1, ['Bless', 'Ceremony', 'Command', 'Compelled Duel', 'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease', 'Divine Favor', 'Heroism', 'Protection from Evil and Good', 'Purify Food and Drink', 'Searing Smite', 'Shield of Faith', 'Thunderous Smite', 'Wrathful Smite']),
  ...spells(2, ['Aid', 'Branding Smite', 'Find Steed', 'Gentle Repose', 'Lesser Restoration', 'Locate Object', 'Magic Weapon', 'Prayer of Healing', 'Protection from Poison', 'Warding Bond', 'Zone of Truth']),
  ...spells(3, ['Aura of Vitality', 'Blinding Smite', 'Create Food and Water', "Crusader's Mantle", 'Daylight', 'Dispel Magic', 'Elemental Weapon', 'Magic Circle', 'Remove Curse', 'Revivify', 'Spirit Shroud']),
  ...spells(4, ['Aura of Life', 'Aura of Purity', 'Banishment', 'Death Ward', 'Find Greater Steed', 'Locate Creature', 'Staggering Smite']),
  ...spells(5, ['Banishing Smite', 'Circle of Power', 'Destructive Wave', 'Dispel Evil and Good', 'Geas', 'Holy Weapon', 'Raise Dead', 'Summon Celestial']),
]

// ─── RANGER ───

const RANGER_SPELLS: SpellListEntry[] = [
  ...spells(1, ['Absorb Elements', 'Alarm', 'Animal Friendship', 'Beast Bond', 'Cure Wounds', 'Detect Magic', 'Detect Poison and Disease', 'Ensnaring Strike', 'Entangle', 'Fog Cloud', 'Goodberry', 'Hail of Thorns', "Hunter's Mark", 'Jump', 'Longstrider', 'Searing Smite', 'Snare', 'Speak with Animals', 'Zephyr Strike']),
  ...spells(2, ['Aid', 'Animal Messenger', 'Barkskin', 'Beast Sense', 'Cordon of Arrows', 'Darkvision', 'Enhance Ability', 'Find Traps', 'Gust of Wind', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Magic Weapon', 'Pass Without Trace', 'Protection from Poison', 'Silence', 'Spike Growth', 'Summon Beast']),
  ...spells(3, ["Ashardalon's Stride", 'Conjure Animals', 'Conjure Barrage', 'Daylight', 'Elemental Weapon', 'Flame Arrows', 'Lightning Arrow', 'Meld into Stone', 'Nondetection', 'Plant Growth', 'Protection from Energy', 'Revivify', 'Speak with Plants', 'Summon Fey', 'Water Breathing', 'Water Walk', 'Wind Wall']),
  ...spells(4, ['Conjure Woodland Beings', 'Dominate Beast', 'Freedom of Movement', 'Grasping Vine', 'Guardian of Nature', 'Locate Creature', 'Stoneskin', 'Summon Elemental']),
  ...spells(5, ['Commune with Nature', 'Conjure Volley', 'Greater Restoration', 'Steel Wind Strike', 'Swift Quiver', 'Tree Stride', 'Wrath of Nature']),
]

// ─── LOOKUP ───

// ─── ARTIFICER ───

const ARTIFICER_SPELLS: SpellListEntry[] = [
  ...spells(0, ['Acid Splash', 'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Frostbite', 'Guidance', 'Light', 'Lightning Lure', 'Mage Hand', 'Magic Stone', 'Mending', 'Message', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Resistance', 'Shocking Grasp', 'Spare the Dying', 'Sword Burst', 'Thorn Whip', 'Thunderclap']),
  ...spells(1, ['Absorb Elements', 'Alarm', 'Catapult', 'Cure Wounds', 'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'Faerie Fire', 'False Life', 'Feather Fall', 'Grease', 'Identify', 'Jump', 'Longstrider', 'Purify Food and Drink', 'Sanctuary', "Tasha's Caustic Brew"]),
  ...spells(2, ['Aid', 'Alter Self', 'Arcane Lock', 'Blur', 'Continual Flame', 'Darkvision', 'Enhance Ability', 'Enlarge/Reduce', 'Heat Metal', 'Invisibility', 'Lesser Restoration', 'Levitate', 'Magic Mouth', 'Magic Weapon', 'Protection from Poison', 'Pyrotechnics', 'Rope Trick', 'See Invisibility', 'Skywrite', 'Spider Climb', 'Web']),
  ...spells(3, ['Blink', 'Catnap', 'Create Food and Water', 'Dispel Magic', 'Elemental Weapon', 'Flame Arrows', 'Fly', 'Glyph of Warding', 'Haste', 'Intellect Fortress', 'Protection from Energy', 'Revivify', 'Tiny Servant', 'Water Breathing', 'Water Walk']),
  ...spells(4, ['Arcane Eye', 'Fabricate', 'Freedom of Movement', "Leomund's Secret Chest", "Mordenkainen's Faithful Hound", "Mordenkainen's Private Sanctum", "Otiluke's Resilient Sphere", 'Stone Shape', 'Stoneskin', 'Summon Construct']),
  ...spells(5, ['Animate Objects', 'Bigby\'s Hand', 'Creation', 'Greater Restoration', 'Skill Empowerment', 'Transmute Rock', 'Wall of Stone']),
]

const CLASS_SPELL_LISTS: Record<string, SpellListEntry[]> = {
  artificer: ARTIFICER_SPELLS,
  wizard: WIZARD_SPELLS,
  cleric: CLERIC_SPELLS,
  bard: BARD_SPELLS,
  druid: DRUID_SPELLS,
  sorcerer: SORCERER_SPELLS,
  warlock: WARLOCK_SPELLS,
  paladin: PALADIN_SPELLS,
  ranger: RANGER_SPELLS,
}

/** Get the 2024 spell list for a class. Returns null if class not found. */
export function get2024SpellList(className: string): SpellListEntry[] | null {
  return CLASS_SPELL_LISTS[className.toLowerCase()] ?? null
}

/** Check if a class has a 2024 spell list override */
export function has2024SpellList(className: string): boolean {
  return className.toLowerCase() in CLASS_SPELL_LISTS
}
