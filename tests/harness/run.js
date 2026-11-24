// `npm test`: run every test file in tests/ with Node's built-in test runner.
// Pass file names or a name filter to run a subset:
//   npm test -- tests/01-smoke.test.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const files = args.filter((a) => a.endsWith('.js'));
const rest = args.filter((a) => !a.endsWith('.js'));
const targets = files.length
  ? files
  : fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort().map((f) => path.join('tests', f));
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=3', '--test-timeout=1800000', ...rest, ...targets], {
  stdio: 'inherit', cwd: path.resolve(dir, '..'),
});
process.exit(r.status === null ? 1 : r.status);
