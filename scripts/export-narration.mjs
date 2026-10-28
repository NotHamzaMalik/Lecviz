import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { examples } from '../src/scene/engine.ts';

const directory = new URL('../public/narration/', import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL('script.json', directory), JSON.stringify(examples.flatMap(example =>
  example.steps.map((step, index) => ({ file: `${example.id}-${index + 1}.wav`, text: step.text }))), null, 2));
console.log(`Narration script saved to ${fileURLToPath(directory)}`);
