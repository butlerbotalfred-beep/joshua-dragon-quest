import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './harness.mjs';

export async function runStage7Tests() {
  const results = [];

  // Milestone 7.1: docs/recording-script.md lists every line by speaker with its file name, matching data/dialogue.json line counts per speaker
  {
    const name = '7.1: docs/recording-script.md lists every line & filename and matches data/dialogue.json counts per speaker';
    const scriptPath = path.join(REPO_ROOT, 'docs/recording-script.md');
    const dialoguePath = path.join(REPO_ROOT, 'data/dialogue.json');
    assert.ok(fs.existsSync(scriptPath), 'docs/recording-script.md must exist');

    const md = fs.readFileSync(scriptPath, 'utf8');
    const dialogue = JSON.parse(fs.readFileSync(dialoguePath, 'utf8'));

    const expectedBySpeaker = new Map();
    for (const line of dialogue.lines) {
      expectedBySpeaker.set(line.speaker, (expectedBySpeaker.get(line.speaker) || 0) + 1);
      assert.ok(md.includes(`\`${line.audio}\``), `Missing file name ${line.audio} in recording-script.md`);
      assert.ok(md.includes(line.text), `Missing spoken text for ${line.id} in recording-script.md`);
    }

    // Parse each "## Speaker (N lines)" section and verify row count matches data/dialogue.json!
    for (const [speaker, expectedCount] of expectedBySpeaker.entries()) {
      const heading = `## ${speaker} (${expectedCount} lines)`;
      assert.ok(md.includes(heading), `Missing heading "${heading}" in recording-script.md`);
      const section = md.split(heading)[1].split('\n## ')[0];
      const dataRows = section
        .split('\n')
        .filter((l) => l.startsWith('| `'));
      assert.equal(
        dataRows.length,
        expectedCount,
        `Speaker ${speaker} row count (${dataRows.length}) does not match data/dialogue.json (${expectedCount})`
      );
    }

    results.push({ name: `${name} (${dialogue.lines.length} lines across ${expectedBySpeaker.size} speakers)`, pass: true });
  }

  return results;
}
