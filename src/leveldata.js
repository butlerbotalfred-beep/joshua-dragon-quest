// The levels of the game. Each one is a course of sections (see levels.js) and
// the story lines that belong to it. Levels are added here as they are built.

import { registerLevel, LEVELS } from './levels.js';
import { LEVEL2 } from './levels/level2.js';

registerLevel(LEVEL2);

export { LEVELS, registerLevel };
