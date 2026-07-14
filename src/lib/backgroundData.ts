import type { Feature } from '@/lib/types/database'

export interface BackgroundData {
  description: string
  skillProficiencies: string[]
  toolProficiency: string
  abilityScores: { options: string[] }  // 3 ability scores to choose from for +2/+1/+1 or +1/+1/+1
  originFeat: Feature
  equipment: string
}

export const BACKGROUND_DATA: Record<string, BackgroundData> = {
  Acolyte: {
    description: 'You devoted yourself to service in a temple, either nestled in a town or secluded in a sacred grove. There, you performed rites in honor of a god or pantheon. You served under a priest and studied religion. Thanks to your priest\'s instruction and your own devotion, you also learned how to channel a modicum of divine power in service to your place of worship and the people who prayed there.',
    skillProficiencies: ['Insight', 'Religion'],
    toolProficiency: "Calligrapher's Supplies",
    abilityScores: { options: ['intelligence', 'wisdom', 'charisma'] },
    originFeat: {
      name: 'Magic Initiate (Cleric)',
      description: 'Two Cantrips. You learn two cantrips of your choice from the Cleric spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list you selected for this feat\'s cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
      source: 'Background',
    },
    equipment: "Calligrapher's Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP",
  },
  Artisan: {
    description: 'You began mopping floors and scrubbing counters in an artisan\'s workshop for a few coppers per day as soon as you were strong enough to carry a bucket. When you were old enough to apprentice, you learned to create basic crafts of your own, as well as how to sweet-talk the occasional demanding customer. Your trade has also given you a keen eye for detail.',
    skillProficiencies: ['Investigation', 'Persuasion'],
    toolProficiency: "Artisan's Tools",
    abilityScores: { options: ['strength', 'dexterity', 'intelligence'] },
    originFeat: {
      name: 'Crafter',
      description: 'Tool Proficiency. You gain proficiency with three different Artisan\'s Tools of your choice.\n\nDiscount. Whenever you buy a nonmagical item, you receive a 20 percent discount on it.\n\nFast Crafting. When you finish a Long Rest, you can craft one piece of gear from the Fast Crafting table, provided you have the Artisan\'s Tools associated with that item and have proficiency with those tools. The item lasts until you finish another Long Rest, at which point the item falls apart.',
      source: 'Background',
    },
    equipment: "Artisan's Tools (same as above), 2 Pouches, Traveler's Clothes, 32 GP",
  },
  Charlatan: {
    description: 'Once you were old enough to order an ale, you soon had a favorite stool in every tavern within ten miles of where you were born. As you traveled the circuit from public house to watering hole, you learned to prey on unfortunates who were in the market for a comforting lie or two—perhaps a sham potion or forged ancestry records.',
    skillProficiencies: ['Deception', 'Sleight of Hand'],
    toolProficiency: 'Forgery Kit',
    abilityScores: { options: ['dexterity', 'constitution', 'charisma'] },
    originFeat: {
      name: 'Skilled',
      description: 'You gain proficiency in any combination of three skills or tools of your choice.\n\nRepeatable. You can take this feat more than once.',
      source: 'Background',
    },
    equipment: "Forgery Kit, Costume, Fine Clothes, 15 GP",
  },
  Criminal: {
    description: 'You eked out a living in dark alleyways, cutting purses or burgling shops. Perhaps you were part of a small gang of like-minded wrongdoers who looked out for each other. Or maybe you were a lone wolf, fending for yourself against the local thieves\' guild and more fearsome lawbreakers.',
    skillProficiencies: ['Sleight of Hand', 'Stealth'],
    toolProficiency: "Thieves' Tools",
    abilityScores: { options: ['dexterity', 'constitution', 'intelligence'] },
    originFeat: {
      name: 'Alert',
      description: 'Initiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.\n\nInitiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can\'t make this swap if you or the ally has the Incapacitated condition.',
      source: 'Background',
    },
    equipment: "2 Daggers, Thieves' Tools, Crowbar, 2 Pouches, Traveler's Clothes, 16 GP",
  },
  Entertainer: {
    description: 'You spent much of your youth following roving fairs and carnivals, performing odd jobs for musicians and acrobats in exchange for lessons. You may have learned how to walk a tightrope, how to play a lute in a distinct style, or how to recite poetry with impeccable diction. To this day, you thrive on applause and long for the stage.',
    skillProficiencies: ['Acrobatics', 'Performance'],
    toolProficiency: 'Musical Instrument',
    abilityScores: { options: ['strength', 'dexterity', 'charisma'] },
    originFeat: {
      name: 'Musician',
      description: 'Instrument Training. You gain proficiency with three Musical Instruments of your choice.\n\nEncouraging Song. As you finish a Short or Long Rest, you can play a song on a Musical Instrument with which you have proficiency and give Heroic Inspiration to allies who hear the song. The number of allies you can affect in this way equals your Proficiency Bonus.',
      source: 'Background',
    },
    equipment: "Musical Instrument (same as above), 2 Costumes, Mirror, Perfume, Traveler's Clothes, 11 GP",
  },
  Farmer: {
    description: 'You grew up close to the land. Years tending animals and cultivating the earth rewarded you with patience and good health. You have a keen appreciation for nature\'s bounty alongside a healthy respect for nature\'s wrath.',
    skillProficiencies: ['Animal Handling', 'Nature'],
    toolProficiency: "Carpenter's Tools",
    abilityScores: { options: ['strength', 'constitution', 'wisdom'] },
    originFeat: {
      name: 'Tough',
      description: 'Your Hit Point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a character level thereafter, your Hit Point maximum increases by an additional 2 Hit Points.',
      source: 'Background',
    },
    equipment: "Sickle, Carpenter's Tools, Healer's Kit, Iron Pot, Shovel, Traveler's Clothes, 30 GP",
  },
  Guard: {
    description: 'Your feet ache when you remember the countless hours you spent at your post in the tower. You were trained to keep one eye looking outside the wall, watching for marauders sweeping from the nearby forest, and your other eye looking inside the wall, searching for cutpurses and troublemakers.',
    skillProficiencies: ['Athletics', 'Perception'],
    toolProficiency: 'Gaming Set',
    abilityScores: { options: ['strength', 'intelligence', 'wisdom'] },
    originFeat: {
      name: 'Alert',
      description: 'Initiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.\n\nInitiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can\'t make this swap if you or the ally has the Incapacitated condition.',
      source: 'Background',
    },
    equipment: "Spear, Light Crossbow, 20 Bolts, Gaming Set (same as above), Hooded Lantern, Manacles, Quiver, Traveler's Clothes, 12 GP",
  },
  Guide: {
    description: 'You came of age outdoors, far from settled lands. Your home was anywhere you chose to spread your bedroll. There are wonders in the wilderness—strange monsters, pristine forests and streams, overgrown ruins of great halls once trod by giants—and you learned to fend for yourself as you explored them.',
    skillProficiencies: ['Stealth', 'Survival'],
    toolProficiency: "Cartographer's Tools",
    abilityScores: { options: ['dexterity', 'constitution', 'wisdom'] },
    originFeat: {
      name: 'Magic Initiate (Druid)',
      description: 'Two Cantrips. You learn two cantrips of your choice from the Druid spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list you selected for this feat\'s cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
      source: 'Background',
    },
    equipment: "Shortbow, 20 Arrows, Cartographer's Tools, Bedroll, Quiver, Tent, Traveler's Clothes, 3 GP",
  },
  Hermit: {
    description: 'You spent your early years secluded in a hut or monastery located well beyond the outskirts of the nearest settlement. In those days, your only companions were the creatures of the forest and those who would occasionally visit to bring news of the outside world and supplies. The solitude allowed you to spend many hours pondering the mysteries of creation.',
    skillProficiencies: ['Medicine', 'Religion'],
    toolProficiency: 'Herbalism Kit',
    abilityScores: { options: ['constitution', 'wisdom', 'charisma'] },
    originFeat: {
      name: 'Healer',
      description: 'Battle Medic. If you have a Healer\'s Kit, you can expend one use of it and tend to a creature within 5 feet of yourself as a Utilize action. That creature can expend one of its Hit Point Dice, and you then roll that die. The creature regains a number of Hit Points equal to the roll plus your Proficiency Bonus.\n\nHealing Rerolls. Whenever you roll a die to determine the number of Hit Points you restore with a spell or with this feat\'s Battle Medic benefit, you can reroll the die if it rolls a 1, and you must use the new roll.',
      source: 'Background',
    },
    equipment: "Quarterstaff, Herbalism Kit, Bedroll, Book (philosophy), Lamp, Oil (3 flasks), Traveler's Clothes, 16 GP",
  },
  Merchant: {
    description: 'You were apprenticed to a trader, caravan master, or shopkeeper, learning the fundamentals of commerce. You traveled broadly, and you earned a living by buying and selling the raw materials artisans need to practice their craft or finished works from such crafters.',
    skillProficiencies: ['Animal Handling', 'Persuasion'],
    toolProficiency: "Navigator's Tools",
    abilityScores: { options: ['constitution', 'intelligence', 'charisma'] },
    originFeat: {
      name: 'Lucky',
      description: 'Luck Points. You have a number of Luck Points equal to your Proficiency Bonus and can spend the points on the benefits below. You regain your expended Luck Points when you finish a Long Rest.\n\nAdvantage. When you roll a d20 for a D20 Test, you can spend 1 Luck Point to give yourself Advantage on the roll.\n\nDisadvantage. When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to impose Disadvantage on that roll.',
      source: 'Background',
    },
    equipment: "Navigator's Tools, 2 Pouches, Traveler's Clothes, 22 GP",
  },
  Noble: {
    description: 'You were raised in a castle, surrounded by wealth, power, and privilege. Your family of minor aristocrats ensured that you received a first-class education, some of which you appreciated and some of which you resented. Your time in the castle, especially the many hours you spent observing your family at court, also taught you a great deal about leadership.',
    skillProficiencies: ['History', 'Persuasion'],
    toolProficiency: 'Gaming Set',
    abilityScores: { options: ['strength', 'intelligence', 'charisma'] },
    originFeat: {
      name: 'Skilled',
      description: 'You gain proficiency in any combination of three skills or tools of your choice.\n\nRepeatable. You can take this feat more than once.',
      source: 'Background',
    },
    equipment: "Gaming Set (same as above), Fine Clothes, Perfume, 29 GP",
  },
  Sage: {
    description: 'You spent your formative years traveling between manors and monasteries, performing various odd jobs and services in exchange for access to their libraries. You whiled away many a long evening studying books and scrolls, learning the lore of the multiverse—even the rudiments of magic—and your mind yearns for more.',
    skillProficiencies: ['Arcana', 'History'],
    toolProficiency: "Calligrapher's Supplies",
    abilityScores: { options: ['constitution', 'intelligence', 'wisdom'] },
    originFeat: {
      name: 'Magic Initiate (Wizard)',
      description: 'Two Cantrips. You learn two cantrips of your choice from the Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list you selected for this feat\'s cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
      source: 'Background',
    },
    equipment: "Quarterstaff, Calligrapher's Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP",
  },
  Sailor: {
    description: 'You lived as a seafarer, wind at your back and decks swaying beneath your feet. You\'ve perched on barstools in more ports of call than you can remember, faced mighty storms, and swapped stories with folk who live beneath the waves.',
    skillProficiencies: ['Acrobatics', 'Perception'],
    toolProficiency: "Navigator's Tools",
    abilityScores: { options: ['strength', 'dexterity', 'wisdom'] },
    originFeat: {
      name: 'Tavern Brawler',
      description: 'Enhanced Unarmed Strike. When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d4 plus your Strength modifier instead of the normal damage of an Unarmed Strike.\n\nDamage Rerolls. Whenever you roll a damage die for your Unarmed Strike, you can reroll the die if it rolls a 1, and you must use the new roll.\n\nImprovised Weaponry. You have proficiency with improvised weapons.\n\nPush. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can deal damage to the target and also push it 5 feet away from you. You can use this benefit only once per turn.',
      source: 'Background',
    },
    equipment: "Dagger, Navigator's Tools, Rope, Traveler's Clothes, 20 GP",
  },
  Scribe: {
    description: 'You spent formative years in a scriptorium, a monastery dedicated to the preservation of knowledge, or a government agency, where you learned to write with a clear hand and produce finely written texts. Perhaps you scribed government documents or copied tomes of literature.',
    skillProficiencies: ['Investigation', 'Perception'],
    toolProficiency: "Calligrapher's Supplies",
    abilityScores: { options: ['dexterity', 'intelligence', 'wisdom'] },
    originFeat: {
      name: 'Skilled',
      description: 'You gain proficiency in any combination of three skills or tools of your choice.\n\nRepeatable. You can take this feat more than once.',
      source: 'Background',
    },
    equipment: "Calligrapher's Supplies, Fine Clothes, Lamp, Oil (3 flasks), Parchment (12 sheets), 23 GP",
  },
  Soldier: {
    description: 'You began training for war as soon as you reached adulthood and carry precious few memories of life before you took up arms. Battle is in your blood. Sometimes you catch yourself reflexively performing the basic fighting exercises you learned first. Eventually, you put that training to use on the battlefield, protecting the realm by waging war.',
    skillProficiencies: ['Athletics', 'Intimidation'],
    toolProficiency: 'Gaming Set',
    abilityScores: { options: ['strength', 'dexterity', 'constitution'] },
    originFeat: {
      name: 'Savage Attacker',
      description: 'You\'ve trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon\'s damage dice twice and use either roll against the target.',
      source: 'Background',
    },
    equipment: "Spear, Shortbow, 20 Arrows, Gaming Set (same as above), Healer's Kit, Quiver, Traveler's Clothes, 14 GP",
  },
  Wayfarer: {
    description: 'You grew up on the streets surrounded by similarly ill-fated castoffs, a few of them friends and a few of them rivals. You slept where you could and did odd jobs for food. At times, when the hunger became unbearable, you resorted to theft. Still, you never lost your pride and never abandoned hope. Fate is not yet finished with you.',
    skillProficiencies: ['Insight', 'Stealth'],
    toolProficiency: "Thieves' Tools",
    abilityScores: { options: ['dexterity', 'wisdom', 'charisma'] },
    originFeat: {
      name: 'Lucky',
      description: 'Luck Points. You have a number of Luck Points equal to your Proficiency Bonus and can spend the points on the benefits below. You regain your expended Luck Points when you finish a Long Rest.\n\nAdvantage. When you roll a d20 for a D20 Test, you can spend 1 Luck Point to give yourself Advantage on the roll.\n\nDisadvantage. When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to impose Disadvantage on that roll.',
      source: 'Background',
    },
    equipment: "2 Daggers, Thieves' Tools, Gaming Set (any), Bedroll, 2 Pouches, Traveler's Clothes, 16 GP",
  },
}

export function getBackgroundData(background: string): BackgroundData | undefined {
  return BACKGROUND_DATA[background]
}
