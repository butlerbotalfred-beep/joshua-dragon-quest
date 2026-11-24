# Recording script

Every line spoken in The Royal Dragon Rescue, by speaker. This file is written by `node tools/recording-script.mjs` from `data/dialogue.json`, the list the game itself plays from, so the two always agree.

There are **79 lines** for 8 speakers.

| Speaker | Lines | Voice in the game today |
| --- | --- | --- |
| Joshua | 6 | Stand-in: Fish Audio voice "Energetic Child", until the family's recording arrives |
| Daniel | 7 | Stand-in: Fish Audio voice "Kid", until the family's recording arrives |
| Vanessa | 6 | Stand-in: Fish Audio voice "Laura", until the family's recording arrives |
| Michael | 5 | Stand-in: Fish Audio voice "Warm Male Friend", until the family's recording arrives |
| Renee, the Ward | 1 | Fish Audio voice "Grandma" |
| The Keeper of the Forest | 48 | Fish Audio voice "story teller old grandfather" |
| Narrator | 1 | Fish Audio voice "story teller old grandfather" |
| The Great Black Dragon | 5 | Fish Audio voice "Yuji" |

## How to record

- The four family voices (Joshua, Daniel, Vanessa and Michael) are stand-ins today. Everyone else already has their voice.
- **One recording for each person is enough.** Read your own list below aloud, once, in one go. Fish Audio copies a voice best from 10 to 60 seconds of clear speech by one speaker, and each of the four family lists is that long (15 to 32 seconds).
- The voice is then copied in Fish Audio, and each of that person's lines is made from the copy and saved under the name in the "File name" column. All speech in the game is made with Fish Audio, so the recording itself is the sample, not the sound the game plays.
- A quiet room, the phone or microphone a hand's width from the mouth, no music or television behind, and nobody else talking. For Joshua, a grown-up can whisper each line for him to say back; only his voice should be loud enough to hear.
- Say the lines the way they would be said to a six-year-old: clear, warm, not rushed, with a breath of quiet between them.
- Any common sound format is fine (m4a, wav or mp3). Name the file after the person, for example `joshua.m4a`.
- Each person (a parent, for the boys) needs to say yes to their voice being copied. Fish Audio may also ask the speaker to read one short sentence to confirm the voice is theirs.
- The finished lines are trimmed and set to the same loudness as the rest by `node tools/make-audio.mjs`.

## Joshua

6 lines, about 21 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `pro_joshua_stars.mp3` | Prologue | "Dad, look! Shooting stars! In the daytime!" |  |
| 2 | `web_joshua.mp3` | Level 1 | "I'm stuck! Somebody swap in! Hee hee, stop it!" | Calling for help, and giggling. |
| 3 | `l2_joshua_hatch.mp3` | Level 2 | "Hi. I'm Joshua. I'll look after you. I promise." | Tender. This is the first hatching. |
| 4 | `l3_joshua_both.mp3` | Level 3 | "Now we both have one! Speedy, say hi!" |  |
| 5 | `l5_joshua_three.mp3` | Level 5 | "Three dragons. One more. Come on, Dad, it's your turn!" |  |
| 6 | `l6_joshua_friends.mp3` | Level 6 | "They don't follow us. They're our friends." |  |

## Daniel

7 lines, about 22 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `pro_daniel_teacher.mp3` | Prologue | "Our teacher did that?" |  |
| 2 | `web_daniel.mp3` | Level 1 | "I'm stuck! Somebody swap in! Hee hee, stop it!" | Calling for help, and giggling. |
| 3 | `l1_daniel_smile.mp3` | Level 1 | "He's smiling! Can a bear smile?" |  |
| 4 | `l3_daniel_hot.mp3` | Level 3 | "It's so hot in here. Mommy, can you make it snow?" |  |
| 5 | `l3_daniel_hatch.mp3` | Level 3 | "You're warm. Hello, Ember. I'm Daniel. I've got you." |  |
| 6 | `l4_daniel_mommy.mp3` | Level 4 | "Mommy has a dragon! Mommy has a dragon!" |  |
| 7 | `fest_daniel_stay.mp3` | The festival | "Can the dragons stay?" |  |

## Vanessa

6 lines, about 32 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `web_vanessa.mp3` | Level 1 | "I'm stuck! Somebody swap in! Hee hee, stop it!" | Calling for help, and giggling. |
| 2 | `vanessa_freeing.mp3` | Level 1 | "Got you. Up you come." |  |
| 3 | `l4_vanessa_hatch.mp3` | Level 4 | "Hello, little one. I'm Vanessa. You're safe with us." |  |
| 4 | `l5_vanessa_home.mp3` | Level 5 | "Four eggs, four dragons. Now let's go home." |  |
| 5 | `l6_vanessa_kind.mp3` | Level 6 | "You can't force people to love you, but you can choose to be kind, you can choose how to treat others, and in return you'll find love, friends, and maybe a family of your own." |  |
| 6 | `l6_vanessa_stay.mp3` | Level 6 | "Have you tried being kind to others? Why don't you stay? Come to the festival, meet the people who live here, spend time with the baby dragons, you might realize you can have everything you want when you treat others with kindness and respect." |  |

## Michael

5 lines, about 15 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `pro_michael_day.mp3` | Prologue | "Then we had better make it a good day. Stay close, boys." |  |
| 2 | `web_michael.mp3` | Level 1 | "I'm stuck! Somebody swap in! Hee hee, stop it!" | Calling for help, and giggling. |
| 3 | `l2_michael_friend.mp3` | Level 2 | "I think you have a friend for life, son." |  |
| 4 | `l4_michael_warm.mp3` | Level 4 | "Everyone warm enough? Daniel, stay near your mother." |  |
| 5 | `l5_michael_hatch.mp3` | Level 5 | "Well, hello there. I'm Michael. Strong little fellow, aren't you?" |  |

## Renee, the Ward

1 line, about 5 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `fest_renee_home.mp3` | The festival | "The eggs and the family are safe, my dear. It's time for me to come home." | Warm and glad. |

## The Keeper of the Forest

48 lines, about 201 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `pro_keeper_hello.mp3` | Prologue | "Do not be afraid, little family. I am the Keeper of the Forest." |  |
| 2 | `pro_keeper_dragon.mp3` | Prologue | "That dragon is proud, and she is lonely. She took four eggs to make a family that must follow her." |  |
| 3 | `pro_keeper_renee.mp3` | Prologue | "Your tutor, Renee, is my Ward, and my wife. She threw the eggs far away to keep them safe. Now they need you." |  |
| 4 | `pro_keeper_gifts.mp3` | Prologue | "Hold out your hands. Speed for Joshua. Fire for Daniel. Ice for Vanessa. Strength for Michael." |  |
| 5 | `pro_keeper_task.mp3` | Prologue | "Prove yourselves worthy, and these gifts are yours to keep. First, find your way out of these woods and free the Great Bear." |  |
| 6 | `hint_web.mp3` | Level 1 | "A web is too sticky for one. Call your family." |  |
| 7 | `l1_keeper_freed.mp3` | Level 1 | "There. The spell is gone. He was never angry at you." |  |
| 8 | `l1_keeper_news.mp3` | Level 1 | "Well done. Renee sends word from the castle. The dragon is searching for the eggs. A baby dragon grows up to be like whoever loves it first. Reach each one before her spell does." |  |
| 9 | `l2_keeper_glow.mp3` | Level 2 | "See how it glows? It can hear you coming, Joshua." |  |
| 10 | `l3_keeper_freed.mp3` | Level 3 | "Feel that? He is only warm now, like a hearth. Renee tells me the dragon knows two eggs have hatched. Hurry on." |  |
| 11 | `l4_keeper_thick.mp3` | Level 4 | "That ice is too thick for a small flame. Ask Ember to help." |  |
| 12 | `l5_keeper_freed.mp3` | Level 5 | "Rest now, old friend. Your watch is over." |  |
| 13 | `l6_keeper_look.mp3` | Level 6 | "Look at them. They are not afraid of you. They never were." |  |
| 14 | `fest_keeper_worthy.mp3` | The festival | "You have proved yourselves worthy. The gifts are yours to keep. But your best gift was always each other." |  |
| 15 | `fest_keeper_ask.mp3` | The festival | "Ask them." |  |
| 16 | `fest_keeper_missed.mp3` | The festival | "I have missed you, my love." | Warm. He has waited years to say it. |
| 17 | `hint_l1_brambles.mp3` | Level 1 | "Daniel, your fire can burn those brambles away." |  |
| 18 | `hint_l1_boulder.mp3` | Level 1 | "Michael, you are strong enough to move that boulder." |  |
| 19 | `hint_l1_stream.mp3` | Level 1 | "Vanessa, freeze the stream so everyone can cross." |  |
| 20 | `hint_l1_charge.mp3` | Level 1 | "Joshua, only you can outrun the bear. Run!" |  |
| 21 | `hint_l2_overgrowth.mp3` | Level 2 | "Daniel, burn away the overgrowth with your fire." |  |
| 22 | `hint_l2_bridge.mp3` | Level 2 | "Michael, hold the bridge steady with your strength." |  |
| 23 | `hint_l2_waterfall.mp3` | Level 2 | "Vanessa, freeze the waterfall into steps." |  |
| 24 | `hint_l2_leap.mp3` | Level 2 | "Joshua, run fast and leap to the nest." |  |
| 25 | `hint_l3_slope.mp3` | Level 3 | "Joshua, race up the ash slope with Speedy." |  |
| 26 | `hint_l3_vents.mp3` | Level 3 | "Vanessa, cool the hot vents with your ice." |  |
| 27 | `hint_l3_rock.mp3` | Level 3 | "Michael, lift the fallen rock out of the way." |  |
| 28 | `hint_l3_tunnel.mp3` | Level 3 | "Daniel, light the dark tunnel with your fire." |  |
| 29 | `hint_l4_icewall.mp3` | Level 4 | "Daniel, melt the ice wall with Ember." |  |
| 30 | `hint_l4_key.mp3` | Level 4 | "Joshua, dash across the thin ice with Speedy." |  |
| 31 | `hint_l4_snowdrift.mp3` | Level 4 | "Michael, clear the snowdrift with your strength." |  |
| 32 | `hint_l4_storm.mp3` | Level 4 | "Vanessa, calm the storm with your ice." |  |
| 33 | `hint_l5_chasm.mp3` | Level 5 | "Vanessa, freeze a bridge over the chasm with Frosty." |  |
| 34 | `hint_l5_ramp.mp3` | Level 5 | "Joshua, race up the steep ramp with Speedy." |  |
| 35 | `hint_l5_lamps.mp3` | Level 5 | "Daniel, light the old lamps with Ember." |  |
| 36 | `hint_l5_block.mp3` | Level 5 | "Michael, push the great stone block." |  |
| 37 | `hint_l6_gate.mp3` | Level 6 | "Michael, open the stone gate with Samson." |  |
| 38 | `hint_l6_river.mp3` | Level 6 | "Vanessa, bridge the river with Frosty." |  |
| 39 | `hint_l6_seal.mp3` | Level 6 | "Daniel, melt the ice seal with Ember." |  |
| 40 | `hint_l6_door.mp3` | Level 6 | "Joshua, dash through the door with Speedy." |  |
| 41 | `hint_path.mp3` | Any level | "Keep going along the path." |  |
| 42 | `hint_jump.mp3` | Any level | "Take a little run, and jump across the gap." |  |
| 43 | `hint_ride.mp3` | Any level | "Wait for the platform, then ride it across." |  |
| 44 | `hint_creature.mp3` | Any level | "Use your gift to free that creature." |  |
| 45 | `hint_guardian_near.mp3` | Any level | "The guardian is waiting just ahead." |  |
| 46 | `hint_fight.mp3` | Any level | "Use your gift to break the spell." |  |
| 47 | `hint_dragon.mp3` | Level 6 | "Keep using your gifts until her anger runs out." |  |
| 48 | `hint_egg.mp3` | Any level | "The egg is waiting. Go and say hello." |  |

## Narrator

1 line, about 24 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `fest_narrator.mp3` | The festival | "And so the Dragon did just that. She stayed for the festival, she laughed for the first time in her life and realized how beautiful life can be when we look for the good in the world instead of the darkness. And in the end, she found the family she had been looking for and became the Protector of the Kingdom, loved by everyone, and they all lived happily ever after." |  |

## The Great Black Dragon

5 lines, about 16 seconds in all.

| # | File name | Where | The words | How |
| --- | --- | --- | --- | --- |
| 1 | `pro_dragon_eggs.mp3` | Prologue | "MY eggs! Come back here this instant! Oh, bother." | Grand and grumpy. |
| 2 | `l6_dragon_mine.mp3` | Level 6 | "Those are MY dragons! They were going to follow ME!" | Grand and grumpy. |
| 3 | `l6_dragon_family.mp3` | Level 6 | "I only wanted a family of my own, I only wanted somewhere to live where I feel loved and wanted." | Her anger has run out. Sad and honest. |
| 4 | `l6_dragon_love.mp3` | Level 6 | "I don't think anyone could love me." | Small and unsure. |
| 5 | `fest_dragon_hmph.mp3` | The festival | "Hmph. It is a rather nice festival." | Grand and grumpy, but pleased underneath. |

