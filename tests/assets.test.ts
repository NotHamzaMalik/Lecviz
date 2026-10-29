import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { lessons, voices } from '../src/demo/lessons.ts';

test('both neural voices have complete MP3 narration matching all lesson scripts', () => {
  const directory = new URL('../public/narration/', import.meta.url);
  const script = JSON.parse(readFileSync(new URL('script.json', directory), 'utf8'));
  const expected = lessons.flatMap(lesson => lesson.steps.map((step, index) => ({ file: `${lesson.id}-${index + 1}.mp3`, text: step.text })));
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'));
  assert.deepEqual(script, expected);
  assert.equal(Object.keys(manifest.clips).length, expected.length * voices.length);
  for (const voice of voices) for (const line of expected) {
    const path = `${voice.id}/${line.file}`;
    const mp3 = readFileSync(new URL(path, directory));
    assert.ok(mp3.subarray(0, 3).toString() === 'ID3' || (mp3[0] === 255 && (mp3[1] & 224) === 224), `${path} has a valid MPEG header`);
    assert.ok(mp3.length > 10000, `${path} contains audio`);
    assert.equal(manifest.clips[path].bytes, mp3.length);
    assert.equal(manifest.clips[path].text_sha256, createHash('sha256').update(line.text).digest('hex'));
    assert.ok(manifest.clips[path].duration > 1);
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
