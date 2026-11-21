// Takes the 4 dossier screenshots for the GTA VI trophy guide: serves app/
// on port 8126, opens each shots.json view at 1280x800 in Chromium, waits
// until the page sets window.rendered, then saves a JPEG screenshot.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/tools/rig/node_modules/playwright');

const here = fileURLToPath(new URL('..', import.meta.url));
const node = '/home/hatch/workspace/scratch/node-root/usr/local/bin/node';
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

mkdirSync(join(here, 'screenshots'), { recursive: true });

const server = spawn(node, ['serve.ts', '--port', '8126'], { cwd: here, stdio: 'ignore' });
await new Promise((resolve) => setTimeout(resolve, 1500));

try {
  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
      await page.goto(`http://localhost:8126/${shot.query}`);
      await page.waitForFunction(() => window.rendered === true, null, { timeout: 20000 });
      await page.waitForTimeout(400);
      const path = join(here, 'screenshots', shot.name);
      await page.screenshot({ path, type: 'jpeg', quality: 82 });
      console.log(`${shot.name}: ${statSync(path).size} bytes`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
