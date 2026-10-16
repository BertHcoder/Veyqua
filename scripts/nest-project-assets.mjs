import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = 'dist';
const appDir = join(outputDir, 'projecten');

await mkdir(appDir, { recursive: true });

for (const entry of await readdir(outputDir, { withFileTypes: true })) {
  if (entry.name === 'projecten') continue;
  await cp(join(outputDir, entry.name), join(appDir, entry.name), { recursive: true });
}
