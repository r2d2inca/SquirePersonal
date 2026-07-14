export interface CampaignTemplate {
  id: string
  name: string
  description: string
  setting: string
  levelRange: string
  startingLevel: number
  tone: string[]
  starterQuests: { title: string; description: string; objectives: string[] }[]
  starterLore: { name: string; category: string; description: string }[]
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'lost-mines-of-phandelver',
    name: 'Lost Mines of Phandelver',
    description: 'A classic introductory adventure set in the Sword Coast. The party is hired to escort a wagon of supplies to the rough-and-tumble settlement of Phandalin. Along the way, they stumble into a conspiracy involving a lost mine and a mysterious villain known as the Black Spider.',
    setting: 'Forgotten Realms (Sword Coast)',
    levelRange: '1-5',
    startingLevel: 1,
    tone: ['High Fantasy', 'Exploration'],
    starterQuests: [
      { title: 'Escort the Wagon', description: 'Deliver supplies from Neverwinter to Phandalin for Gundren Rockseeker.', objectives: ['Meet Gundren in Neverwinter', 'Travel the Triboar Trail', 'Deliver supplies to Barthen\'s Provisions'] },
      { title: 'Find Gundren Rockseeker', description: 'Gundren has gone missing on the road. Investigate what happened.', objectives: ['Search the ambush site', 'Track the goblins', 'Rescue Gundren'] },
    ],
    starterLore: [
      { name: 'Phandalin', category: 'location', description: 'A small frontier town nestled in the foothills of the Sword Mountains. Once a prosperous mining settlement, it fell to ruin centuries ago and has only recently been resettled.' },
      { name: 'Gundren Rockseeker', category: 'npc', description: 'A dwarf entrepreneur who believes he\'s found the entrance to the legendary Wave Echo Cave and its lost mine.' },
    ],
  },
  {
    id: 'curse-of-strahd',
    name: 'Curse of Strahd',
    description: 'A gothic horror adventure set in the mist-shrouded land of Barovia. The players are drawn into a dark realm ruled by the vampire lord Strahd von Zarovich, who has trapped the land in eternal darkness. To escape, they must confront Strahd in his castle and break his curse.',
    setting: 'Barovia (Ravenloft)',
    levelRange: '1-10',
    startingLevel: 1,
    tone: ['Horror', 'Dark/Gritty', 'Mystery'],
    starterQuests: [
      { title: 'Escape the Mists', description: 'Strange mists have pulled you into the land of Barovia. Find a way to escape this cursed realm.', objectives: ['Explore the village of Barovia', 'Seek allies among the Vistani', 'Learn about Strahd von Zarovich'] },
      { title: 'The Fortunes of Ravenloft', description: 'A mysterious fortune teller has insights into how Strahd might be defeated.', objectives: ['Find Madam Eva', 'Receive the Tarokka reading', 'Locate the three treasures'] },
    ],
    starterLore: [
      { name: 'Barovia', category: 'location', description: 'A gloomy valley surrounded by impenetrable mist and towering mountains. The sun never fully shines here, and the people live in constant fear of the vampire lord in Castle Ravenloft.' },
      { name: 'Strahd von Zarovich', category: 'npc', description: 'The vampire lord of Barovia. Once a conqueror and nobleman, he made a dark pact for immortality and has ruled this cursed land for centuries.' },
    ],
  },
  {
    id: 'storm-kings-thunder',
    name: "Storm King's Thunder",
    description: 'Giants have emerged from their strongholds to threaten civilization. The ordning — the ancient caste system of the giants — has been shattered, and giants of all types are rampaging across the land. Heroes must navigate giant politics and find a way to restore order.',
    setting: 'Forgotten Realms (Sword Coast & North)',
    levelRange: '1-11',
    startingLevel: 1,
    tone: ['High Fantasy', 'Exploration', 'War'],
    starterQuests: [
      { title: 'Nightstone Under Siege', description: 'The village of Nightstone has been attacked by cloud giants. Investigate the aftermath and help the survivors.', objectives: ['Reach Nightstone', 'Clear the village of invaders', 'Find the missing villagers'] },
    ],
    starterLore: [
      { name: 'The Ordning', category: 'plot_point', description: 'The ancient hierarchy of giantkind, ordained by their god Annam. It has been shattered, throwing all giant society into chaos as each type vies for supremacy.' },
    ],
  },
  {
    id: 'tomb-of-annihilation',
    name: 'Tomb of Annihilation',
    description: 'A death curse has befallen the world — anyone who has ever been raised from the dead is slowly wasting away. The source of the curse lies deep in the jungles of Chult, in a tomb built by an archlich. The party must brave the jungle, find the tomb, and destroy the Soulmonger.',
    setting: 'Forgotten Realms (Chult)',
    levelRange: '1-11',
    startingLevel: 1,
    tone: ['Exploration', 'Dark/Gritty'],
    starterQuests: [
      { title: 'The Death Curse', description: 'Syndra Silvane, a wealthy merchant, is dying from a mysterious curse and hires the party to find its source in Chult.', objectives: ['Travel to Port Nyanzaru', 'Hire a guide', 'Venture into the jungle'] },
    ],
    starterLore: [
      { name: 'Chult', category: 'location', description: 'A vast, dinosaur-filled jungle peninsula on the southern coast of Faerûn. Ancient ruins and undead horrors lurk beneath its canopy.' },
    ],
  },
  {
    id: 'waterdeep-dragon-heist',
    name: 'Waterdeep: Dragon Heist',
    description: 'An urban treasure hunt through the greatest city in the Forgotten Realms. Half a million gold pieces are hidden somewhere in Waterdeep, and everyone wants them — including a cast of infamous villains. The party must navigate city politics, criminal organizations, and deadly traps.',
    setting: 'Forgotten Realms (Waterdeep)',
    levelRange: '1-5',
    startingLevel: 1,
    tone: ['Political Intrigue', 'Mystery'],
    starterQuests: [
      { title: 'A Friend in Need', description: 'A patron offers the party a rundown tavern in exchange for rescuing a friend from the clutches of a gang.', objectives: ['Visit the Yawning Portal', 'Rescue Floon Blagmaar', 'Claim Trollskull Manor'] },
    ],
    starterLore: [
      { name: 'Waterdeep', category: 'location', description: 'The City of Splendors, the greatest and most cosmopolitan city in all of Faerûn. Home to over a million souls, it is a hub of commerce, intrigue, and adventure.' },
    ],
  },
  {
    id: 'descent-into-avernus',
    name: "Baldur's Gate: Descent into Avernus",
    description: 'The holy city of Elturel has been dragged into the Nine Hells. The party must venture from Baldur\'s Gate into Avernus — the first layer of Hell — to save the city and its people from eternal damnation. Deals with devils, infernal war machines, and demonic armies await.',
    setting: "Forgotten Realms (Baldur's Gate → Avernus)",
    levelRange: '1-13',
    startingLevel: 1,
    tone: ['Dark/Gritty', 'High Fantasy', 'War'],
    starterQuests: [
      { title: 'The Fall of Elturel', description: "Investigate the disappearance of Elturel and the growing corruption in Baldur's Gate.", objectives: ["Navigate Baldur's Gate politics", 'Discover what happened to Elturel', 'Find a way into Avernus'] },
    ],
    starterLore: [
      { name: 'Avernus', category: 'location', description: 'The first layer of the Nine Hells. A blasted, war-torn wasteland where the Blood War between devils and demons rages eternally. Rivers of lava and mountains of bone define the landscape.' },
    ],
  },
  {
    id: 'rime-of-the-frostmaiden',
    name: 'Rime of the Frostmaiden',
    description: 'Icewind Dale has been trapped in perpetual winter by the frost goddess Auril. The sun never rises, and the people of Ten-Towns struggle to survive. The party must uncover the secrets of the Dale, confront eldritch horrors, and challenge the Frostmaiden herself.',
    setting: 'Forgotten Realms (Icewind Dale)',
    levelRange: '1-12',
    startingLevel: 1,
    tone: ['Horror', 'Exploration', 'Mystery'],
    starterQuests: [
      { title: 'Cold Open', description: 'Arrive in Ten-Towns during the endless winter. The towns need help with immediate threats.', objectives: ['Choose a starting town', 'Complete a local quest', 'Learn about the Rime'] },
    ],
    starterLore: [
      { name: 'Icewind Dale', category: 'location', description: 'A frigid, remote region in the far north of Faerûn. Ten small towns cluster around three lakes, their residents hardy folk who endure brutal winters.' },
    ],
  },
  {
    id: 'vecna-eve-of-ruin',
    name: 'Vecna: Eve of Ruin',
    description: 'The archlich Vecna threatens to reshape the multiverse itself. High-level heroes must travel across iconic D&D worlds — Greyhawk, Ravenloft, Planescape, Spelljammer, Eberron, and Dragonlance — to gather artifacts powerful enough to stop Vecna before he rewrites reality.',
    setting: 'Multiverse',
    levelRange: '10-20',
    startingLevel: 10,
    tone: ['High Fantasy', 'Exploration'],
    starterQuests: [
      { title: 'The Ritual Begins', description: 'Vecna has set a multiverse-spanning ritual in motion. Gather the Rod of Seven Parts to stop him.', objectives: ['Learn of Vecna\'s plan', 'Locate the first piece of the Rod', 'Travel to Sigil'] },
    ],
    starterLore: [
      { name: 'Vecna', category: 'npc', description: 'The Archlich, the Whispered One. Once a mortal wizard, now a god of secrets and undeath who seeks to remake all of reality in his image.' },
    ],
  },
  {
    id: 'wild-beyond-the-witchlight',
    name: 'The Wild Beyond the Witchlight',
    description: 'A whimsical adventure that takes the party from a mysterious traveling carnival into the Feywild. Lost memories, hag bargains, and the enchanting courts of the archfey await. Uniquely, this adventure can be completed entirely without combat.',
    setting: 'Feywild',
    levelRange: '1-8',
    startingLevel: 1,
    tone: ['Comedy', 'Exploration', 'Mystery'],
    starterQuests: [
      { title: 'The Witchlight Carnival', description: 'A magical carnival has arrived in town. Something was stolen from you here long ago — can you get it back?', objectives: ['Explore the carnival', 'Find the secret entrance to the Feywild', 'Recover your lost possession'] },
    ],
    starterLore: [
      { name: 'Prismeer', category: 'location', description: 'A Feywild domain divided into three splinter realms by the hag coven Hourglass. Once a place of wonder, it has fallen to darkness and decay.' },
    ],
  },
  {
    id: 'dragonlance-shadow-of-the-dragon-queen',
    name: 'Dragonlance: Shadow of the Dragon Queen',
    description: 'War has come to the world of Krynn. The Dragon Armies march under the banner of the Dragon Queen Takhisis, and the heroes must rally the people of Solamnia to stand against the tide. A war-focused adventure with mass combat and legendary dragons.',
    setting: 'Krynn (Dragonlance)',
    levelRange: '1-11',
    startingLevel: 1,
    tone: ['War', 'High Fantasy'],
    starterQuests: [
      { title: 'Prelude to War', description: 'The Dragon Army approaches the city of Vogler. Prepare its defenses and rally the townspeople.', objectives: ['Arrive in Vogler', 'Uncover the Dragon Army threat', 'Prepare the town for battle'] },
    ],
    starterLore: [
      { name: 'Krynn', category: 'location', description: 'A world recovering from the Cataclysm, a divine punishment that reshaped continents. The gods withdrew, and now dark forces fill the void.' },
    ],
  },
]

export const TONE_OPTIONS = [
  'High Fantasy',
  'Dark/Gritty',
  'Comedy',
  'Political Intrigue',
  'Horror',
  'Exploration',
  'War',
  'Mystery',
] as const

export function getCampaignTemplate(id: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find(t => t.id === id)
}
