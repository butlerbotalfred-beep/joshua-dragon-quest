import { startStaticServer, launchBrowser } from './harness.mjs';
import { runStage0Tests } from './stage0.test.mjs';
import { runStage1Tests } from './stage1.test.mjs';
import { runStage2Tests } from './stage2.test.mjs';
import { runStage3Tests } from './stage3.test.mjs';
import { runStage4Tests } from './stage4.test.mjs';
import { runStage7Tests } from './stage7.test.mjs';

const SUITES = [
  { id: 'stage0', run: runStage0Tests },
  { id: 'stage1', run: runStage1Tests },
  { id: 'stage2', run: runStage2Tests },
  { id: 'stage3', run: runStage3Tests },
  { id: 'stage4', run: runStage4Tests },
  { id: 'stage7', run: runStage7Tests },
];

async function main() {
  const filter = process.argv[2] || null;
  const server = await startStaticServer();
  const browser = await launchBrowser();
  let passed = 0;
  let failed = 0;

  try {
    for (const suite of SUITES) {
      if (filter && suite.id !== filter) continue;
      console.log(`\n=== Running ${suite.id} ===`);
      try {
        const results = await suite.run(browser, server.baseUrl);
        for (const r of results) {
          if (r.pass) {
            passed++;
            console.log(`  PASS  ${r.name}`);
          } else {
            failed++;
            console.error(`  FAIL  ${r.name}: ${r.error}`);
          }
        }
      } catch (err) {
        failed++;
        console.error(`  FAIL  ${suite.id}:`, err && err.stack ? err.stack : err);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
