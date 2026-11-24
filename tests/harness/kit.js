// Shared by the test files: open the game and wait for the title screen.
const { openGame } = require('./browser');

async function openReady(opts = {}) {
  const g = await openGame(opts);
  await g.page.waitForFunction(() => window.game && window.game.state === 'menu', null, { timeout: 180000 });
  return g;
}

module.exports = { openReady };
