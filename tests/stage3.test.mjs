import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './harness.mjs';

export async function runStage3Tests(browser, baseUrl) {
  const results = [];

  // Milestone 3.1: docs/levels/level-2.md exists with map, four gates in order, gifts, hint lines, berries, and arena
  {
    const name = '3.1: docs/levels/level-2.md defines map, 4 gates in order with gifts & hints, berries, and arena';
    const mdPath = path.join(REPO_ROOT, 'docs/levels/level-2.md');
    assert.ok(fs.existsSync(mdPath), 'docs/levels/level-2.md must exist');
    const md = fs.readFileSync(mdPath, 'utf8');

    const requiredGates = [
      { id: 'l2_gate_overgrowth', hero: 'Daniel', gift: 'Fire', hint: 'hint_daniel_fire' },
      { id: 'l2_gate_bridge', hero: 'Michael', gift: 'Strength', hint: 'hint_michael_strength' },
      { id: 'l2_gate_waterfall', hero: 'Vanessa', gift: 'Ice', hint: 'hint_vanessa_ice' },
      { id: 'l2_gate_leap', hero: 'Joshua', gift: 'Speed', hint: 'hint_joshua_speed' },
    ];

    let lastIdx = -1;
    for (const g of requiredGates) {
      const idx = md.indexOf(g.id);
      assert.ok(idx > lastIdx, `Gate ${g.id} missing or out of order in level-2.md`);
      lastIdx = idx;
      assert.ok(md.includes(g.hero), `Missing hero ${g.hero} in level-2.md`);
      assert.ok(md.includes(g.gift), `Missing gift ${g.gift} in level-2.md`);
      assert.ok(md.includes(g.hint), `Missing hint dialogue id ${g.hint} in level-2.md`);
    }
    assert.ok(md.includes('Gold Berries') && md.includes('l2_g1') && md.includes('l2_g2') && md.includes('l2_g3'), 'Missing 3 gold berries');
    assert.ok(md.includes('Old Vine') && md.includes('Green Egg'), 'Missing Old Vine arena / Green Egg');
    results.push({ name, pass: true });
  }

  return results;
}
