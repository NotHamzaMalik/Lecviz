import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { examples } from '../src/scene/engine.ts';

test('both voices have nonempty WAV audio matching every example sentence', () => {
  const directory = new URL('../public/narration/', import.meta.url);
  const script = JSON.parse(readFileSync(new URL('script.json', directory), 'utf8'));
  const expected = examples.flatMap(example => example.steps.map((step, index) => ({ file: `${example.id}-${index + 1}.wav`, text: step.text })));
  assert.deepEqual(script, expected);
  for (const voice of ['david', 'zira']) for (const line of expected) {
    const wav = readFileSync(new URL(`${voice}/${line.file}`, directory));
    assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
    assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
    assert.ok(wav.length > 10000, `${voice}/${line.file} contains audio`);
  }
});

function luminance(hex: string) {
  const channels = hex.replace('#', '').match(/.{2}/g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
test('normal text and key state colors meet 4.5:1 contrast in both themes', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  for (const block of css.matchAll(/:root(?:\[data-theme='dark'\])?\s*\{([^}]+)\}/g)) {
    const tokens = Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map(match => [match[1], match[2]]));
    for (const [text, background] of [['text', 'panel'], ['secondary', 'panel'], ['muted', 'bg'], ['accent', 'panel'], ['green', 'green-soft'], ['amber', 'amber-soft'], ['button-text', 'button-bg']]) {
      const a = luminance(tokens[text]), b = luminance(tokens[background]);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      assert.ok(ratio >= 4.5, `${text} on ${background}: ${ratio.toFixed(2)}:1`);
    }
  }
});
