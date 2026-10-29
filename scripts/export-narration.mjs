import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lessons } from '../src/demo/lessons.ts';

const directory = new URL('../public/narration/', import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL('script.json', directory), JSON.stringify(lessons.flatMap(lesson =>
  lesson.steps.map((step, index) => ({ file: `${lesson.id}-${index + 1}.mp3`, text: step.text }))), null, 2));
console.log(`Narration script saved to ${fileURLToPath(directory)}`);
