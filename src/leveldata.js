// The levels of the game. Each one is a course of sections (see levels.js) and
// the story lines that belong to it. Levels are added here as they are built.
//
// Numbers 1 to 6 are the levels on the map. 0 is the prologue and 7 is the
// festival: places with a scene and no play.

import { registerLevel, LEVELS } from './levels.js';
import { PROLOGUE } from './levels/prologue.js';
import { LEVEL2 } from './levels/level2.js';
import { FESTIVAL } from './levels/festival.js';

registerLevel(PROLOGUE);
registerLevel(LEVEL2);
registerLevel(FESTIVAL);

export { LEVELS, registerLevel };
