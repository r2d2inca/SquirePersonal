export type FeatCategory = 'origin' | 'general' | 'fighting-style' | 'epic-boon'

export interface FeatData {
  name: string
  category: FeatCategory
  description: string
  prerequisite?: string
  repeatable?: boolean
  abilityScoreIncrease?: string  // e.g. "Increase your Strength or Dexterity by 1, to a maximum of 20"
  maxAbilityScore?: number       // 20 for general, 30 for epic boons
}

// ─── Origin Feats ───

export const ORIGIN_FEATS: FeatData[] = [
  {
    name: 'Alert',
    category: 'origin',
    description: 'Initiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.\n\nInitiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can\'t make this swap if you or the ally has the Incapacitated condition.',
  },
  {
    name: 'Crafter',
    category: 'origin',
    description: 'Tool Proficiency. You gain proficiency with three different Artisan\'s Tools of your choice from the Fast Crafting table.\n\nDiscount. Whenever you buy a nonmagical item, you receive a 20 percent discount on it.\n\nFast Crafting. When you finish a Long Rest, you can craft one piece of gear from the Fast Crafting table, provided you have the Artisan\'s Tools associated with that item and have proficiency with those tools. The item lasts until you finish another Long Rest, at which point the item falls apart.',
  },
  {
    name: 'Healer',
    category: 'origin',
    description: 'Battle Medic. If you have a Healer\'s Kit, you can expend one use of it and tend to a creature within 5 feet of yourself as a Utilize action. That creature can expend one of its Hit Point Dice, and you then roll that die. The creature regains a number of Hit Points equal to the roll plus your Proficiency Bonus.\n\nHealing Rerolls. Whenever you roll a die to determine the number of Hit Points you restore with a spell or with this feat\'s Battle Medic benefit, you can reroll the die if it rolls a 1, and you must use the new roll.',
  },
  {
    name: 'Lucky',
    category: 'origin',
    description: 'Luck Points. You have a number of Luck Points equal to your Proficiency Bonus and can spend the points on the benefits below. You regain your expended Luck Points when you finish a Long Rest.\n\nAdvantage. When you roll a d20 for a D20 Test, you can spend 1 Luck Point to give yourself Advantage on the roll.\n\nDisadvantage. When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to impose Disadvantage on that roll.',
  },
  {
    name: 'Magic Initiate (Cleric)',
    category: 'origin',
    description: 'Two Cantrips. You learn two cantrips of your choice from the Cleric spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
    repeatable: true,
  },
  {
    name: 'Magic Initiate (Druid)',
    category: 'origin',
    description: 'Two Cantrips. You learn two cantrips of your choice from the Druid spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
    repeatable: true,
  },
  {
    name: 'Magic Initiate (Wizard)',
    category: 'origin',
    description: 'Two Cantrips. You learn two cantrips of your choice from the Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
    repeatable: true,
  },
  {
    name: 'Musician',
    category: 'origin',
    description: 'Instrument Training. You gain proficiency with three Musical Instruments of your choice.\n\nEncouraging Song. As you finish a Short or Long Rest, you can play a song on a Musical Instrument with which you have proficiency and give Heroic Inspiration to allies who hear the song. The number of allies you can affect in this way equals your Proficiency Bonus.',
  },
  {
    name: 'Savage Attacker',
    category: 'origin',
    description: 'You\'ve trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon\'s damage dice twice and use either roll against the target.',
  },
  {
    name: 'Skilled',
    category: 'origin',
    description: 'You gain proficiency in any combination of three skills or tools of your choice.',
    repeatable: true,
  },
  {
    name: 'Tavern Brawler',
    category: 'origin',
    description: 'Enhanced Unarmed Strike. When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d4 plus your Strength modifier instead of the normal damage of an Unarmed Strike.\n\nDamage Rerolls. Whenever you roll a damage die for your Unarmed Strike, you can reroll the die if it rolls a 1, and you must use the new roll.\n\nImprovised Weaponry. You have proficiency with improvised weapons.\n\nPush. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can deal damage to the target and also push it 5 feet away from you. You can use this benefit only once per turn.',
  },
  {
    name: 'Tough',
    category: 'origin',
    description: 'Your Hit Point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a character level thereafter, your Hit Point maximum increases by an additional 2 Hit Points.',
  },
]

// ─── General Feats ───

export const GENERAL_FEATS: FeatData[] = [
  {
    name: 'Ability Score Improvement',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Increase one ability score of your choice by 2, or increase two ability scores of your choice by 1. This feat can\'t increase an ability score above 20.',
    repeatable: true,
    abilityScoreIncrease: 'Increase one ability score by 2, or two ability scores by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Actor',
    category: 'general',
    prerequisite: 'Level 4+, Charisma 13+',
    description: 'Ability Score Increase. Increase your Charisma score by 1, to a maximum of 20.\n\nImpersonation. While you\'re disguised as a real or fictional person, you have Advantage on Charisma (Deception or Performance) checks to convince others that you are that person.\n\nMimicry. You can mimic the sounds of other creatures, including speech. A creature that hears the mimicry must succeed on a Wisdom (Insight) check to determine the effect is faked (DC 8 plus your Charisma modifier and Proficiency Bonus).',
    abilityScoreIncrease: 'Increase your Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Athlete',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nClimb Speed. You gain a Climb Speed equal to your Speed.\n\nHop Up. When you have the Prone condition, you can right yourself with only 5 feet of movement.\n\nJumping. You can make a running Long or High Jump after moving only 5 feet.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Charger',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nImproved Dash. When you take the Dash action, your Speed increases by 10 feet for that action.\n\nCharge Attack. If you move at least 10 feet in a straight line toward a target immediately before hitting it with a melee attack roll as part of the Attack action, choose one of the following effects: gain a 1d8 bonus to the attack\'s damage roll, or push the target up to 10 feet away if it is no more than one size larger than you. You can use this benefit only once on each of your turns.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Chef',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Constitution or Wisdom score by 1, to a maximum of 20.\n\nCook\'s Utensils. You gain proficiency with Cook\'s Utensils if you don\'t already have it.\n\nReplenishing Meal. As part of a Short Rest, you can cook special food if you have ingredients and Cook\'s Utensils on hand. You can prepare enough of this food for a number of creatures equal to 4 plus your Proficiency Bonus. At the end of the Short Rest, any creature who eats the food and spends one or more Hit Dice to regain Hit Points regains an extra 1d8 Hit Points.\n\nBolstering Treats. With 1 hour of work or when you finish a Long Rest, you can cook a number of treats equal to your Proficiency Bonus. These special treats last 8 hours after being made. A creature can use a Bonus Action to eat one of those treats to gain a number of Temporary Hit Points equal to your Proficiency Bonus.',
    abilityScoreIncrease: 'Increase your Constitution or Wisdom by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Crossbow Expert',
    category: 'general',
    prerequisite: 'Level 4+, Dexterity 13+',
    description: 'Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n\nIgnore Loading. You ignore the Loading property of crossbows. If you\'re holding one, you can load ammunition even without a free hand.\n\nFiring in Melee. Being within 5 feet of an enemy doesn\'t impose Disadvantage on your attack rolls with crossbows.\n\nDual Wielding. When you make the extra attack of the Light property, you can add your ability modifier to the damage of the extra attack if that attack is with a crossbow that has the Light property.',
    abilityScoreIncrease: 'Increase your Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Crusher',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Constitution score by 1, to a maximum of 20.\n\nPush. Once per turn, when you hit a creature with an attack that deals Bludgeoning damage, you can move it 5 feet to an unoccupied space if the target is no more than one size larger than you.\n\nEnhanced Critical. When you score a Critical Hit that deals Bludgeoning damage to a creature, attack rolls against that creature have Advantage until the start of your next turn.',
    abilityScoreIncrease: 'Increase your Strength or Constitution by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Defensive Duelist',
    category: 'general',
    prerequisite: 'Level 4+, Dexterity 13+',
    description: 'Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n\nParry. If you\'re holding a Finesse weapon and another creature hits you with a melee attack, you can take a Reaction to add your Proficiency Bonus to your Armor Class, potentially causing the attack to miss you. You gain this bonus to your AC against melee attacks until the start of your next turn.',
    abilityScoreIncrease: 'Increase your Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Dual Wielder',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nEnhanced Dual Wielding. When you take the Attack action on your turn and attack with a weapon that has the Light property, you can make one extra attack as a Bonus Action later on the same turn with a different weapon, which must be a Melee weapon that lacks the Two-Handed property.\n\nQuick Draw. You can draw or stow two weapons that lack the Two-Handed property when you would normally be able to draw or stow only one.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Durable',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Constitution score by 1, to a maximum of 20.\n\nDefy Death. You have Advantage on Death Saving Throws.\n\nSpeedy Recovery. As a Bonus Action, you can expend one of your Hit Point Dice, roll the die, and regain a number of Hit Points equal to the roll.',
    abilityScoreIncrease: 'Increase your Constitution by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Elemental Adept',
    category: 'general',
    prerequisite: 'Level 4+, Spellcasting or Pact Magic Feature',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nEnergy Mastery. Choose one of the following damage types: Acid, Cold, Fire, Lightning, or Thunder. Spells you cast ignore Resistance to damage of the chosen type. In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.',
    repeatable: true,
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Fey Touched',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nFey Magic. Choose one level 1 spell from the Divination or Enchantment school of magic. You always have that spell and the Misty Step spell prepared. You can cast each of these spells without expending a spell slot. Once you cast either spell in this way, you can\'t cast that spell in this way again until you finish a Long Rest. You can also cast these spells using spell slots you have of the appropriate level.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Grappler',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nPunch and Grab. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Grapple option. You can use this benefit only once per turn.\n\nAttack Advantage. You have Advantage on attack rolls against a creature Grappled by you.\n\nFast Wrestler. You don\'t have to spend extra movement to move a creature Grappled by you if the creature is your size or smaller.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Great Weapon Master',
    category: 'general',
    prerequisite: 'Level 4+, Strength 13+',
    description: 'Ability Score Increase. Increase your Strength score by 1, to a maximum of 20.\n\nHeavy Weapon Mastery. When you hit a creature with a weapon that has the Heavy property as part of the Attack action on your turn, you can cause the weapon to deal extra damage to the target. The extra damage equals your Proficiency Bonus.\n\nHew. Immediately after you score a Critical Hit with a Melee weapon or reduce a creature to 0 Hit Points with one, you can make one attack with the same weapon as a Bonus Action.',
    abilityScoreIncrease: 'Increase your Strength by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Heavily Armored',
    category: 'general',
    prerequisite: 'Level 4+, Medium Armor Training',
    description: 'Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.\n\nArmor Training. You gain training with Heavy armor.',
    abilityScoreIncrease: 'Increase your Constitution or Strength by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Heavy Armor Master',
    category: 'general',
    prerequisite: 'Level 4+, Heavy Armor Training',
    description: 'Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.\n\nDamage Reduction. When you\'re hit by an attack while you\'re wearing Heavy armor, any Bludgeoning, Piercing, and Slashing damage dealt to you by that attack is reduced by an amount equal to your Proficiency Bonus.',
    abilityScoreIncrease: 'Increase your Constitution or Strength by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Inspiring Leader',
    category: 'general',
    prerequisite: 'Level 4+, Wisdom or Charisma 13+',
    description: 'Ability Score Increase. Increase your Wisdom or Charisma score by 1, to a maximum of 20.\n\nBolstering Performance. When you finish a Short or Long Rest, you can give an inspiring performance: a speech, song, or dance. When you do so, choose up to six allies (which can include yourself) within 30 feet of yourself who witness the performance. The chosen creatures each gain Temporary Hit Points equal to your character level plus the modifier of the ability you increased with this feat.',
    abilityScoreIncrease: 'Increase your Wisdom or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Keen Mind',
    category: 'general',
    prerequisite: 'Level 4+, Intelligence 13+',
    description: 'Ability Score Increase. Increase your Intelligence score by 1, to a maximum of 20.\n\nLore Knowledge. Choose one of the following skills: Arcana, History, Investigation, Nature, or Religion. If you lack proficiency in the chosen skill, you gain proficiency in it, and if you already have proficiency in it, you gain Expertise in it.\n\nQuick Study. You can take the Study action as a Bonus Action.',
    abilityScoreIncrease: 'Increase your Intelligence by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Lightly Armored',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nArmor Training. You gain training with Light armor and Shields.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Mage Slayer',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nConcentration Breaker. When you damage a creature that is concentrating, it has Disadvantage on the saving throw it makes to maintain Concentration.\n\nGuarded Mind. If you fail an Intelligence, a Wisdom, or a Charisma saving throw, you can cause yourself to succeed instead. Once you use this benefit, you can\'t use it again until you finish a Short or Long Rest.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Martial Weapons Training',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nWeapon Proficiency. You gain proficiency with Martial weapons.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Medium Armor Master',
    category: 'general',
    prerequisite: 'Level 4+, Medium Armor Training',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nDexterous Wearer. While you\'re wearing Medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity score of 16 or higher.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Moderately Armored',
    category: 'general',
    prerequisite: 'Level 4+, Light Armor Training',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nArmor Training. You gain training with Medium armor.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Mounted Combatant',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength, Dexterity, or Wisdom score by 1, to a maximum of 20.\n\nMounted Strike. While mounted, you have Advantage on attack rolls against any unmounted creature within 5 feet of your mount that is at least one size smaller than the mount.\n\nLeap Aside. If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw and only half damage if it fails.\n\nVeer. While mounted, you can force an attack that hits your mount to hit you instead if you don\'t have the Incapacitated condition.',
    abilityScoreIncrease: 'Increase your Strength, Dexterity, or Wisdom by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Observant',
    category: 'general',
    prerequisite: 'Level 4+, Intelligence or Wisdom 13+',
    description: 'Ability Score Increase. Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n\nKeen Observer. Choose one of the following skills: Insight, Investigation, or Perception. If you lack proficiency with the chosen skill, you gain proficiency in it, and if you already have proficiency in it, you gain Expertise in it.\n\nQuick Search. You can take the Search action as a Bonus Action.',
    abilityScoreIncrease: 'Increase your Intelligence or Wisdom by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Piercer',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity by 1, to a maximum of 20.\n\nPuncture. Once per turn, when you hit a creature with an attack that deals Piercing damage, you can reroll one of the attack\'s damage dice, and you must use the new roll.\n\nEnhanced Critical. When you score a Critical Hit that deals Piercing damage to a creature, you can roll one additional damage die when determining the extra Piercing damage the target takes.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Poisoner',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Dexterity or Intelligence score by 1, to a maximum of 20.\n\nPotent Poison. When you make a damage roll that deals Poison damage, it ignores Resistance to Poison damage.\n\nBrew Poison. You gain proficiency with the Poisoner\'s Kit. With 1 hour of work using such a kit and expending 50 GP worth of materials, you can create a number of poison doses equal to your Proficiency Bonus. Once applied, the poison retains its potency for 1 minute or until you deal damage with the poisoned item.',
    abilityScoreIncrease: 'Increase your Dexterity or Intelligence by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Polearm Master',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Dexterity or Strength score by 1, to a maximum of 20.\n\nPole Strike. Immediately after you take the Attack action and attack with a Quarterstaff, a Spear, or a weapon that has the Heavy and Reach properties, you can use a Bonus Action to make a melee attack with the opposite end of the weapon. The weapon deals Bludgeoning damage, and the weapon\'s damage die for this attack is a d4.\n\nReactive Strike. While you\'re holding a Quarterstaff, a Spear, or a weapon that has the Heavy and Reach properties, you can take a Reaction to make one melee attack against a creature that enters the reach you have with that weapon.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Resilient',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Choose one ability in which you lack saving throw proficiency. Increase the chosen ability score by 1, to a maximum of 20.\n\nSaving Throw Proficiency. You gain saving throw proficiency with the chosen ability.',
    abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Ritual Caster',
    category: 'general',
    prerequisite: 'Level 4+, Intelligence, Wisdom, or Charisma 13+',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nRitual Spells. Choose a number of level 1 spells equal to your Proficiency Bonus that have the Ritual tag. You always have those spells prepared, and you can cast them with any spell slots you have.\n\nQuick Ritual. You can cast a Ritual spell that you have prepared using its regular casting time rather than the extended time for a Ritual. Doing so doesn\'t require a spell slot. Once you cast the spell in this way, you can\'t use this benefit again until you finish a Long Rest.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Sentinel',
    category: 'general',
    prerequisite: 'Level 4+, Strength or Dexterity 13+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nGuardian. Immediately after a creature within 5 feet of you takes the Disengage action or hits a target other than you with an attack, you can make an Opportunity Attack against that creature.\n\nHalt. When you hit a creature with an Opportunity Attack, the creature\'s Speed becomes 0 for the rest of the current turn.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Shadow Touched',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nShadow Magic. Choose one level 1 spell from the Illusion or Necromancy school of magic. You always have that spell and the Invisibility spell prepared. You can cast each of these spells without expending a spell slot. Once you cast either spell in this way, you can\'t cast that spell in this way again until you finish a Long Rest.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Sharpshooter',
    category: 'general',
    prerequisite: 'Level 4+, Dexterity 13+',
    description: 'Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n\nBypass Cover. Your ranged attacks with weapons ignore Half Cover and Three-Quarters Cover.\n\nFiring in Melee. Being within 5 feet of an enemy doesn\'t impose Disadvantage on your attack rolls with Ranged weapons.\n\nLong Shots. Attacking at long range doesn\'t impose Disadvantage on your attack rolls with Ranged weapons.',
    abilityScoreIncrease: 'Increase your Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Shield Master',
    category: 'general',
    prerequisite: 'Level 4+, Shield Training',
    description: 'Ability Score Increase. Increase your Strength score by 1, to a maximum of 20.\n\nShield Bash. If you attack a creature within 5 feet of you as part of the Attack action and hit with a Melee weapon, you can immediately bash the target with your Shield, forcing the target to make a Strength saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, you either push the target 5 feet from you or cause it to have the Prone condition (your choice).\n\nInterpose Shield. If you\'re subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can take a Reaction to take no damage if you succeed on the saving throw and are holding a Shield.',
    abilityScoreIncrease: 'Increase your Strength by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Skill Expert',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 20.\n\nSkill Proficiency. You gain proficiency in one skill of your choice.\n\nExpertise. Choose one skill in which you have proficiency but lack Expertise. You gain Expertise with that skill.',
    abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Skulker',
    category: 'general',
    prerequisite: 'Level 4+, Dexterity 13+',
    description: 'Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n\nBlindsight. You have Blindsight with a range of 10 feet.\n\nFog of War. You exploit the distractions of battle, gaining Advantage on any Dexterity (Stealth) check you make as part of the Hide action during combat.\n\nSniper. If you make an attack roll while hidden and the roll misses, making the attack roll doesn\'t reveal your location.',
    abilityScoreIncrease: 'Increase your Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Slasher',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nHamstring. Once per turn when you hit a creature with an attack that deals Slashing damage, you can reduce the Speed of that creature by 10 feet until the start of your next turn.\n\nEnhanced Critical. When you score a Critical Hit that deals Slashing damage to a creature, it has Disadvantage on attack rolls until the start of your next turn.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Speedy',
    category: 'general',
    prerequisite: 'Level 4+, Dexterity or Constitution 13+',
    description: 'Ability Score Increase. Increase your Dexterity or Constitution score by 1, to a maximum of 20.\n\nSpeed Increase. Your Speed increases by 10 feet.\n\nDash over Difficult Terrain. When you take the Dash action on your turn, Difficult Terrain doesn\'t cost you extra movement for the rest of that turn.\n\nAgile Movement. Opportunity Attacks have Disadvantage against you.',
    abilityScoreIncrease: 'Increase your Dexterity or Constitution by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Spell Sniper',
    category: 'general',
    prerequisite: 'Level 4+, Spellcasting or Pact Magic Feature',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nBypass Cover. Your attack rolls for spells ignore Half Cover and Three-Quarters Cover.\n\nCasting in Melee. Being within 5 feet of an enemy doesn\'t impose Disadvantage on your attack rolls with spells.\n\nIncreased Range. When you cast a spell that has a range of at least 10 feet and requires you to make an attack roll, you can increase the spell\'s range by 60 feet.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Telekinetic',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nMinor Telekinesis. You learn the Mage Hand spell. You can cast it without Verbal or Somatic components, you can make the spectral hand Invisible, and its range increases by 30 feet.\n\nTelekinetic Shove. As a Bonus Action, you can telekinetically shove one creature you can see within 30 feet of yourself. The target must succeed on a Strength saving throw (DC 8 plus the ability modifier of the score increased by this feat and your Proficiency Bonus) or be moved 5 feet toward or away from you.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Telepathic',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nTelepathic Utterance. You can speak telepathically to any creature you can see within 60 feet of yourself. Your telepathic utterances are in a language you know, and the creature understands you only if it knows that language.\n\nDetect Thoughts. You always have the Detect Thoughts spell prepared. You can cast it without a spell slot or spell components, and you must finish a Long Rest before you can cast it in this way again.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'War Caster',
    category: 'general',
    prerequisite: 'Level 4+, Spellcasting or Pact Magic Feature',
    description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n\nConcentration. You have Advantage on Constitution saving throws that you make to maintain Concentration.\n\nReactive Spell. When a creature provokes an Opportunity Attack from you by leaving your reach, you can take a Reaction to cast a spell at the creature rather than making an Opportunity Attack. The spell must have a casting time of one action and must target only that creature.\n\nSomatic Components. You can perform the Somatic components of spells even when you have weapons or a Shield in one or both hands.',
    abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
  {
    name: 'Weapon Master',
    category: 'general',
    prerequisite: 'Level 4+',
    description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nMastery Property. Your training with weapons allows you to use the mastery property of one kind of Simple or Martial weapon of your choice, provided you have proficiency with it. Whenever you finish a Long Rest, you can change the kind of weapon to another eligible kind.',
    abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 20.',
    maxAbilityScore: 20,
  },
]

// ─── Fighting Style Feats ───

export const FIGHTING_STYLE_FEATS: FeatData[] = [
  { name: 'Archery', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'You gain a +2 bonus to attack rolls you make with Ranged weapons.' },
  { name: 'Blind Fighting', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'You have Blindsight with a range of 10 feet.' },
  { name: 'Defense', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'While you\'re wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.' },
  { name: 'Dueling', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When you\'re holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.' },
  { name: 'Great Weapon Fighting', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When you roll damage for an attack you make with a Melee weapon that you are holding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.' },
  { name: 'Interception', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When a creature you can see hits another creature within 5 feet of you with an attack roll, you can take a Reaction to reduce the damage dealt to the target by 1d10 plus your Proficiency Bonus. You must be holding a Shield or a Simple or Martial weapon to use this Reaction.' },
  { name: 'Protection', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to interpose your Shield if you\'re holding one. You impose Disadvantage on the triggering attack roll and all other attack rolls against the target until the start of your next turn if you remain within 5 feet of the target.' },
  { name: 'Thrown Weapon Fighting', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When you hit with a ranged attack roll using a weapon that has the Thrown property, you gain a +2 bonus to the damage roll.' },
  { name: 'Unarmed Fighting', category: 'fighting-style', prerequisite: 'Fighting Style Feature', description: 'When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d6 plus your Strength modifier instead of the normal damage of an Unarmed Strike. If you aren\'t holding any weapons or a Shield when you make the attack roll, the d6 becomes a d8.\n\nAt the start of each of your turns, you can deal 1d4 Bludgeoning damage to one creature Grappled by you.' },
]

// ─── Epic Boon Feats ───

export const EPIC_BOON_FEATS: FeatData[] = [
  { name: 'Boon of Combat Prowess', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nPeerless Aim. When you miss with an attack roll, you can hit instead. Once you use this benefit, you can\'t use it again until the start of your next turn.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Dimensional Travel', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nBlink Steps. Immediately after you take the Attack action or the Magic action, you can teleport up to 30 feet to an unoccupied space you can see.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Energy Resistance', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nEnergy Resistances. You gain Resistance to two damage types of your choice: Acid, Cold, Fire, Lightning, Necrotic, Poison, Psychic, Radiant, or Thunder. Whenever you finish a Long Rest, you can change your choices.\n\nEnergy Redirection. When you take damage of one of the chosen types, you can take a Reaction to direct damage of the same type toward another creature you can see within 60 feet. That creature must succeed on a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus) or take damage equal to 2d12 plus your Constitution modifier.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Fate', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nImprove Fate. When you or another creature within 60 feet of you succeeds on or fails a D20 Test, you can roll 2d4 and apply the total rolled as a bonus or penalty to the d20 roll. Once you use this benefit, you can\'t use it again until you roll Initiative or finish a Short or Long Rest.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Fortitude', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nFortified Health. Your Hit Point maximum increases by 40. In addition, whenever you regain Hit Points, you can regain additional Hit Points equal to your Constitution modifier. Once you\'ve regained these additional Hit Points, you can\'t do so again until the start of your next turn.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Irresistible Offense', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 30.\n\nOvercome Defenses. The Bludgeoning, Piercing, and Slashing damage you deal always ignores Resistance.\n\nOverwhelming Strike. When you roll a 20 on the d20 for an attack roll, you can deal extra damage to the target equal to the ability score increased by this feat.', abilityScoreIncrease: 'Increase your Strength or Dexterity by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Recovery', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nLast Stand. When you would be reduced to 0 Hit Points, you can drop to 1 Hit Point instead and regain a number of Hit Points equal to half your Hit Point maximum. Once you use this benefit, you can\'t use it again until you finish a Long Rest.\n\nRecover Vitality. You have a pool of ten d10s. As a Bonus Action, you can expend dice from the pool, roll those dice, and regain a number of Hit Points equal to the roll\'s total. You regain all the expended dice when you finish a Long Rest.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Skill', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nAll-Around Adept. You gain proficiency in all skills.\n\nExpertise. Choose one skill in which you lack Expertise. You gain Expertise in that skill.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Speed', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nEscape Artist. As a Bonus Action, you can take the Disengage action, which also ends the Grappled condition on you.\n\nQuickness. Your Speed increases by 30 feet.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Spell Recall', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30.\n\nFree Casting. Whenever you cast a spell with a level 1-4 spell slot, roll 1d4. If the number you roll is the same as the slot\'s level, the slot isn\'t expended.', abilityScoreIncrease: 'Increase your Intelligence, Wisdom, or Charisma by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of the Night Spirit', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nMerge with Shadows. While within Dim Light or Darkness, you can give yourself the Invisible condition as a Bonus Action. The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction.\n\nShadowy Form. While within Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
  { name: 'Boon of Truesight', category: 'epic-boon', prerequisite: 'Level 19+', description: 'Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nTruesight. You have Truesight with a range of 60 feet.', abilityScoreIncrease: 'Increase one ability score by 1, to a maximum of 30.', maxAbilityScore: 30 },
]

// ─── Centralized Feat Grant Data ───
// Single source of truth — used by CharacterCreatePage and LevelUpWizard

/** Feats that always grant specific spells (by SRD slug) */
export const FEAT_FIXED_SPELLS: Record<string, string[]> = {
  'Fey Touched': ['misty-step'],
  'Shadow Touched': ['invisibility'],
  'Telekinetic': ['mage-hand'],
  'Telepathic': ['detect-thoughts'],
}

/** Feats that grant proficiencies by name */
export const FEAT_PROFICIENCY_GRANTS: Record<string, { tools?: string[]; armor?: string[]; weapons?: string[]; allSkills?: boolean }> = {
  'Chef': { tools: ["Cook's Utensils"] },
  'Heavily Armored': { armor: ['Heavy'] },
  'Lightly Armored': { armor: ['Light', 'Shields'] },
  'Moderately Armored': { armor: ['Medium'] },
  'Martial Weapons Training': { weapons: ['Martial'] },
  'Poisoner': { tools: ["Poisoner's Kit"] },
  'Boon of Skill': { allSkills: true },
}

/** Feats that have resource tracking (uses per rest) */
export const FEAT_RESOURCES: Record<string, { usesMax: number | 'proficiency'; rechargeOn: 'short_rest' | 'long_rest' }> = {
  'Lucky': { usesMax: 'proficiency', rechargeOn: 'long_rest' },
  'Boon of Fate': { usesMax: 1, rechargeOn: 'short_rest' },
  'Boon of Combat Prowess': { usesMax: 1, rechargeOn: 'short_rest' },
  'Boon of Recovery': { usesMax: 10, rechargeOn: 'long_rest' },
}

/** Feats that grant a flat HP bonus when taken (not per-level) */
export const FEAT_FLAT_HP: Record<string, number> = {
  'Boon of Fortitude': 40,
}

// ─── Helpers ───

export const ALL_FEATS: FeatData[] = [...ORIGIN_FEATS, ...GENERAL_FEATS, ...FIGHTING_STYLE_FEATS, ...EPIC_BOON_FEATS]

export function getFeatsByCategory(category: FeatCategory): FeatData[] {
  return ALL_FEATS.filter(f => f.category === category)
}

export function getFeatByName(name: string): FeatData | undefined {
  return ALL_FEATS.find(f => f.name === name)
}

export function getFeatsAvailableAtLevel(level: number, hasFightingStyle = false): FeatData[] {
  return ALL_FEATS.filter(f => {
    if (f.category === 'origin') return true
    if (f.category === 'fighting-style') return hasFightingStyle
    if (f.category === 'epic-boon') return level >= 19
    if (f.category === 'general') return level >= 4
    return false
  })
}

// ─── Prerequisite Checking ───

export interface PrerequisiteContext {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  armorProficiencies?: string[]
  weaponProficiencies?: string[]
  hasSpellcasting?: boolean
  hasFightingStyle?: boolean
}

const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const

export function meetsPrerequisites(feat: FeatData, context: PrerequisiteContext): boolean {
  if (!feat.prerequisite) return true
  const prereq = feat.prerequisite.toLowerCase()

  // Check ability score requirements like "Dexterity 13+" or "Strength or Dexterity 13+"
  const abilityMatch = prereq.match(/(\w+(?:\s*(?:,|or)\s*\w+)*)\s+(\d+)\+/)
  if (abilityMatch) {
    const scoreRequired = parseInt(abilityMatch[2])
    const abilitiesStr = abilityMatch[1]
    const mentionedAbilities = ABILITY_NAMES.filter(ab => abilitiesStr.includes(ab))
    if (mentionedAbilities.length > 0) {
      const meetsAny = mentionedAbilities.some(ab => (context[ab] ?? 10) >= scoreRequired)
      if (!meetsAny) return false
    }
  }

  // Check armor training prerequisites
  if (prereq.includes('medium armor training')) {
    if (!context.armorProficiencies?.some(a => a.toLowerCase().includes('medium'))) return false
  }
  if (prereq.includes('heavy armor training')) {
    if (!context.armorProficiencies?.some(a => a.toLowerCase().includes('heavy'))) return false
  }
  if (prereq.includes('light armor training')) {
    if (!context.armorProficiencies?.some(a => a.toLowerCase().includes('light'))) return false
  }
  if (prereq.includes('shield training')) {
    if (!context.armorProficiencies?.some(a => a.toLowerCase().includes('shield'))) return false
  }

  // Check spellcasting
  if (prereq.includes('spellcasting or pact magic feature') || prereq.includes('spellcasting feature')) {
    if (!context.hasSpellcasting) return false
  }

  // Check fighting style
  if (prereq.includes('fighting style feature')) {
    if (!context.hasFightingStyle) return false
  }

  return true
}
