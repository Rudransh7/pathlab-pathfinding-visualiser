import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'ui.js', 'algorithms.js', 'maps.js', 'playback.js']) {
  await copyFile(new URL(name, root), new URL(name, output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log(`Static demo prepared: ${fileURLToPath(output)}`);
