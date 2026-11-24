// Every spoken line in the game, in one place. `node tools/make-dialogue.mjs`
// turns this into data/dialogue.json, adding each sound file's length.
//
// Lines marked `story` are from docs/STORY.md and are word for word.
// Lines marked `added` are hints the build plan asks for and the story draft
// does not give: each names the family member a gate needs.

export const VOICES = {
  keeper: { name: 'The Keeper of the Forest', voice: 'story teller old grandfather', voiceId: '86d2e997840443a1832c999ee71468b2', standIn: false },
  narrator: { name: 'Narrator', voice: 'story teller old grandfather', voiceId: '86d2e997840443a1832c999ee71468b2', standIn: false, note: 'The family chose the Keeper as the Narrator, so they share one voice.' },
  renee: { name: 'Renee, the Ward', voice: 'Grandma', voiceId: 'fb4f0464f53e4f939d00a7c20d17d143', standIn: false },
  dragon: { name: 'The Great Black Dragon', voice: 'Yuji', voiceId: '6e294c216f1e4b4c94449341a5db5da9', standIn: false },
  joshua: { name: 'Joshua', voice: 'Energetic Child', voiceId: '4fcb3a423c61415fb35604eba567d95f', standIn: true },
  daniel: { name: 'Daniel', voice: 'Kid', voiceId: 'b9011feb3c6f46ddaeb90043fab0eb4a', standIn: true },
  vanessa: { name: 'Vanessa', voice: 'Laura', voiceId: 'e3cd384158934cc9a01029cd7d278634', standIn: true },
  michael: { name: 'Michael', voice: 'Warm Male Friend', voiceId: 'f292c81d563f47799b7e411f1c1e68a9', standIn: true },
};

const S = (id, speaker, text, scene) => ({ id, speaker, text, scene, from: 'story' });
const A = (id, text, scene) => ({ id, speaker: 'keeper', text, scene, from: 'added' });
const WEB = "I'm stuck! Somebody swap in! Hee hee, stop it!";

export const LINES = [
  // Prologue: festival morning
  S('pro_joshua_stars', 'joshua', 'Dad, look! Shooting stars! In the daytime!', 'prologue'),
  S('pro_dragon_eggs', 'dragon', 'MY eggs! Come back here this instant! Oh, bother.', 'prologue'),
  S('pro_keeper_hello', 'keeper', 'Do not be afraid, little family. I am the Keeper of the Forest.', 'prologue'),
  S('pro_keeper_dragon', 'keeper', 'That dragon is proud, and she is lonely. She took four eggs to make a family that must follow her.', 'prologue'),
  S('pro_keeper_renee', 'keeper', 'Your tutor, Renee, is my Ward, and my wife. She threw the eggs far away to keep them safe. Now they need you.', 'prologue'),
  S('pro_daniel_teacher', 'daniel', 'Our teacher did that?', 'prologue'),
  S('pro_keeper_gifts', 'keeper', 'Hold out your hands. Speed for Joshua. Fire for Daniel. Ice for Vanessa. Strength for Michael.', 'prologue'),
  S('pro_keeper_task', 'keeper', 'Prove yourselves worthy, and these gifts are yours to keep. First, find your way out of these woods and free the Great Bear.', 'prologue'),
  S('pro_michael_day', 'michael', 'Then we had better make it a good day. Stay close, boys.', 'prologue'),

  // Level 1: The Great Woods
  S('web_joshua', 'joshua', WEB, 'level1'),
  S('web_daniel', 'daniel', WEB, 'level1'),
  S('web_vanessa', 'vanessa', WEB, 'level1'),
  S('web_michael', 'michael', WEB, 'level1'),
  S('hint_web', 'keeper', 'A web is too sticky for one. Call your family.', 'level1'),
  S('vanessa_freeing', 'vanessa', 'Got you. Up you come.', 'level1'),
  S('l1_keeper_freed', 'keeper', 'There. The spell is gone. He was never angry at you.', 'level1'),
  S('l1_daniel_smile', 'daniel', "He's smiling! Can a bear smile?", 'level1'),
  S('l1_keeper_news', 'keeper', 'Well done. Renee sends word from the castle. The dragon is searching for the eggs. A baby dragon grows up to be like whoever loves it first. Reach each one before her spell does.', 'level1'),

  // Level 2: Treetop Canopy
  S('l2_keeper_glow', 'keeper', 'See how it glows? It can hear you coming, Joshua.', 'level2'),
  S('l2_joshua_hatch', 'joshua', "Hi. I'm Joshua. I'll look after you. I promise.", 'level2'),
  S('l2_michael_friend', 'michael', 'I think you have a friend for life, son.', 'level2'),

  // Level 3: Scorched Caverns
  S('l3_daniel_hot', 'daniel', "It's so hot in here. Mommy, can you make it snow?", 'level3'),
  S('l3_keeper_freed', 'keeper', 'Feel that? He is only warm now, like a hearth. Renee tells me the dragon knows two eggs have hatched. Hurry on.', 'level3'),
  S('l3_daniel_hatch', 'daniel', "You're warm. Hello, Ember. I'm Daniel. I've got you.", 'level3'),
  S('l3_joshua_both', 'joshua', 'Now we both have one! Speedy, say hi!', 'level3'),

  // Level 4: Frostpeak Ridge
  S('l4_michael_warm', 'michael', 'Everyone warm enough? Daniel, stay near your mother.', 'level4'),
  S('l4_keeper_thick', 'keeper', 'That ice is too thick for a small flame. Ask Ember to help.', 'level4'),
  S('l4_vanessa_hatch', 'vanessa', "Hello, little one. I'm Vanessa. You're safe with us.", 'level4'),
  S('l4_daniel_mommy', 'daniel', 'Mommy has a dragon! Mommy has a dragon!', 'level4'),

  // Level 5: The Craglands
  S('l5_joshua_three', 'joshua', "Three dragons. One more. Come on, Dad, it's your turn!", 'level5'),
  S('l5_keeper_freed', 'keeper', 'Rest now, old friend. Your watch is over.', 'level5'),
  S('l5_michael_hatch', 'michael', "Well, hello there. I'm Michael. Strong little fellow, aren't you?", 'level5'),
  S('l5_vanessa_home', 'vanessa', "Four eggs, four dragons. Now let's go home.", 'level5'),

  // Level 6: beneath the castle
  S('l6_dragon_mine', 'dragon', 'Those are MY dragons! They were going to follow ME!', 'level6'),
  S('l6_joshua_friends', 'joshua', "They don't follow us. They're our friends.", 'level6'),
  S('l6_keeper_look', 'keeper', 'Look at them. They are not afraid of you. They never were.', 'level6'),
  S('l6_dragon_family', 'dragon', 'I only wanted a family of my own, I only wanted somewhere to live where I feel loved and wanted.', 'level6'),
  S('l6_vanessa_kind', 'vanessa', "You can't force people to love you, but you can choose to be kind, you can choose how to treat others, and in return you'll find love, friends, and maybe a family of your own.", 'level6'),
  S('l6_dragon_love', 'dragon', "I don't think anyone could love me.", 'level6'),
  S('l6_vanessa_stay', 'vanessa', "Have you tried being kind to others? Why don't you stay? Come to the festival, meet the people who live here, spend time with the baby dragons, you might realize you can have everything you want when you treat others with kindness and respect.", 'level6'),

  // The festival
  S('fest_keeper_worthy', 'keeper', 'You have proved yourselves worthy. The gifts are yours to keep. But your best gift was always each other.', 'festival'),
  S('fest_daniel_stay', 'daniel', 'Can the dragons stay?', 'festival'),
  S('fest_keeper_ask', 'keeper', 'Ask them.', 'festival'),
  S('fest_renee_home', 'renee', "The eggs and the family are safe, my dear. It's time for me to come home.", 'festival'),
  S('fest_keeper_missed', 'keeper', 'I have missed you, my love.', 'festival'),
  S('fest_dragon_hmph', 'dragon', 'Hmph. It is a rather nice festival.', 'festival'),
  S('fest_narrator', 'narrator', 'And so the Dragon did just that. She stayed for the festival, she laughed for the first time in her life and realized how beautiful life can be when we look for the good in the world instead of the darkness. And in the end, she found the family she had been looking for and became the Protector of the Kingdom, loved by everyone, and they all lived happily ever after.', 'festival'),

  // Gate hints. One for each of the 24 gates, naming who is needed.
  A('hint_l1_brambles', 'Daniel, your fire can burn those brambles away.', 'level1'),
  A('hint_l1_boulder', 'Michael, you are strong enough to move that boulder.', 'level1'),
  A('hint_l1_stream', 'Vanessa, freeze the stream so everyone can cross.', 'level1'),
  A('hint_l1_charge', 'Joshua, only you can outrun the bear. Run!', 'level1'),
  A('hint_l2_overgrowth', 'Daniel, burn away the overgrowth with your fire.', 'level2'),
  A('hint_l2_bridge', 'Michael, hold the bridge steady with your strength.', 'level2'),
  A('hint_l2_waterfall', 'Vanessa, freeze the waterfall into steps.', 'level2'),
  A('hint_l2_leap', 'Joshua, run fast and leap to the nest.', 'level2'),
  A('hint_l3_slope', 'Joshua, race up the ash slope with Speedy.', 'level3'),
  A('hint_l3_vents', 'Vanessa, cool the hot vents with your ice.', 'level3'),
  A('hint_l3_rock', 'Michael, lift the fallen rock out of the way.', 'level3'),
  A('hint_l3_tunnel', 'Daniel, light the dark tunnel with your fire.', 'level3'),
  A('hint_l4_icewall', 'Daniel, melt the ice wall with Ember.', 'level4'),
  A('hint_l4_key', 'Joshua, dash across the thin ice with Speedy.', 'level4'),
  A('hint_l4_snowdrift', 'Michael, clear the snowdrift with your strength.', 'level4'),
  A('hint_l4_storm', 'Vanessa, calm the storm with your ice.', 'level4'),
  A('hint_l5_chasm', 'Vanessa, freeze a bridge over the chasm with Frosty.', 'level5'),
  A('hint_l5_ramp', 'Joshua, race up the steep ramp with Speedy.', 'level5'),
  A('hint_l5_lamps', 'Daniel, light the old lamps with Ember.', 'level5'),
  A('hint_l5_block', 'Michael, push the great stone block.', 'level5'),
  A('hint_l6_gate', 'Michael, open the stone gate with Samson.', 'level6'),
  A('hint_l6_river', 'Vanessa, bridge the river with Frosty.', 'level6'),
  A('hint_l6_seal', 'Daniel, melt the ice seal with Ember.', 'level6'),
  A('hint_l6_door', 'Joshua, dash through the door with Speedy.', 'level6'),

  // Other hints, for the moments between gates.
  A('hint_path', 'Keep going along the path.', 'any'),
  A('hint_jump', 'Take a little run, and jump across the gap.', 'any'),
  A('hint_ride', 'Wait for the platform, then ride it across.', 'any'),
  A('hint_creature', 'Use your gift to free that creature.', 'any'),
  A('hint_guardian_near', 'The guardian is waiting just ahead.', 'any'),
  A('hint_fight', 'Use your gift to break the spell.', 'any'),
  A('hint_dragon', 'Keep using your gifts until her anger runs out.', 'level6'),
  A('hint_egg', 'The egg is waiting. Go and say hello.', 'any'),
];

// Sound effects. Each is from Fish Audio: a ready-made clip from its sound
// library, or one made with its sound effect generator.
// `tools/sounds.json` records which clip each one came from.
export const SOUND_NAMES = [
  'jump', 'dash', 'fire', 'ice', 'slam', 'hit', 'target', 'wrong', 'gate_open', 'hurt', 'dizzy', 'fall',
  'caught', 'pop', 'call', 'swap', 'berry', 'gold', 'creature_freed', 'knot', 'warning', 'strike', 'web',
  'guardian_freed', 'level_done', 'menu_ok', 'menu_back', 'chirp', 'chirps', 'hatch', 'roar', 'whoosh',
];
