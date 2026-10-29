import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Server-side component checks, not browser automation or a visual-layout substitute.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
after(() => server.close());

test('the demo renders its four views without microphone or command-input controls', async () => {
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const html = renderToStaticMarkup(createElement(App));
  for (const label of ['Classroom', 'System architecture', 'Product workflow', 'Beyond IT', 'Aria', 'Guy']) assert.ok(html.includes(label));
  assert.doesNotMatch(html, /Type a command|Use mic|Commands|Start microphone|<input|<textarea/);
  assert.match(html, /Play example/);
});

test('product workflow renders every supplied stage without voice controls', async () => {
  const { ProductWorkflow } = await server.ssrLoadModule('/src/demo/ProductWorkflow.tsx');
  const html = renderToStaticMarkup(createElement(ProductWorkflow));
  for (const label of ['Teacher speaks', 'Live microphone audio', 'Silero VAD + Faster-Whisper', 'Detect speech and generate transcript', 'DeepSeek V4 Flash', 'Understand topic, intent, objects and actions', 'JSON validation + scene manager', 'Check correctness, resolve references, preserve state', 'Live animated visualization', 'React Flow / SVG / browser animations']) assert.ok(html.includes(label), label);
  for (const unwanted of ['Example voice', 'Transcript', 'Play example']) assert.ok(!html.includes(unwanted), unwanted);
});
test('architecture renders all source-diagram labels and the current rejection state', async () => {
  const { ArchitectureDiagram, ArchitecturePayload } = await server.ssrLoadModule('/src/demo/ArchitectureDiagram.tsx');
  const { architectureLessons, architectureNodes } = await server.ssrLoadModule('/src/demo/lessons.ts');
  const frame = architectureLessons[1].steps[4].architecture;
  const html = renderToStaticMarkup(createElement(ArchitectureDiagram, { frame, progress: .5, running: true, visited: ['teacher', 'stt', 'llm', 'validation'], onSelect() {} }));
  for (const node of architectureNodes) assert.ok(html.includes(node.title.replaceAll('&', '&amp;')), node.title);
  assert.match(html, /node-rejected/);
  const payload = renderToStaticMarkup(createElement(ArchitecturePayload, { frame }));
  assert.match(payload, /No scene mutation/);
  assert.match(payload, /Scene values: 10, 20, 30/);
});
test('the rainfall chart reveals only the data already explained', async () => {
  const { WaterCycle } = await server.ssrLoadModule('/src/demo/WaterCycle.tsx');
  const first = renderToStaticMarkup(createElement(WaterCycle, { stage: 7, running: false }));
  assert.match(first, /Illustrative rainfall: day 1: 10 millimeters/);
  assert.doesNotMatch(first, /Total: 60 mm/);
  const last = renderToStaticMarkup(createElement(WaterCycle, { stage: 9, running: true }));
  assert.match(last, /day 2: 30 millimeters, day 3: 20 millimeters/);
  assert.match(last, /Total: 60 mm/);
});
