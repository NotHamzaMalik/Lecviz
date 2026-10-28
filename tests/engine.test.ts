import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyActions, emptyScene, exampleFrames, examples, interpretCommand } from '../src/scene/engine.ts';
const command = (text: string, scene = emptyScene()) => applyActions(scene, interpretCommand(text, scene));

test('all five guided examples produce their expected result', () => {
  const expected = { bubble: [3, 5, 8], array: [4, 6, 2, 9], stack: [2, 4, 8], queue: [8, 2], linked: [10, 20, 30] };
  for (const example of examples) {
    const frames = exampleFrames(example);
    assert.deepEqual(frames.at(-1)!.scene.items.map(item => item.value), expected[example.id]);
    assert.equal(frames.length, example.steps.length + 1);
    assert.deepEqual(frames[0].scene.items, []);
  }
});
test('spoken number words, swap and context-aware maximum', () => {
  let scene = command('Create an array with eight, three and five');
  const originalIds = scene.items.map(item => item.id);
  scene = command('Compare the first two and swap them', scene);
  assert.deepEqual(scene.items.map(item => item.value), [3, 8, 5]);
  assert.deepEqual(scene.items.map(item => item.id), [originalIds[1], originalIds[0], originalIds[2]]);
  scene = command('Highlight the largest number', scene);
  assert.deepEqual(scene.active, [originalIds[0]]);
});
test('a bad action rejects the complete transaction without changing input', () => {
  const scene = command('Create an array with 8, 3, 5');
  const before = structuredClone(scene);
  assert.throws(() => applyActions(scene, [{ type: 'swap', indices: [0, 1] }, { type: 'delete', index: 9 }]));
  assert.deepEqual(scene, before);
});
test('stack and queue have distinct removal behavior', () => {
  let stack = command('Create a stack with 2, 4');
  stack = command('Push 8', stack);
  stack = command('Pop', stack);
  assert.deepEqual(stack.items.map(item => item.value), [2, 4]);
  let queue = command('Create a queue with 3, 5, 8');
  queue = command('Enqueue 2', queue);
  queue = command('Dequeue', queue);
  assert.deepEqual(queue.items.map(item => item.value), [5, 8, 2]);
  assert.throws(() => command('Pop', queue));
});
test('linked-list insertion and deletion preserve surviving node identities', () => {
  let scene = command('Create a linked list with 10, 20, 30');
  const ids = scene.items.map(item => item.id);
  scene = command('Insert 15 after the first node', scene);
  assert.deepEqual(scene.items.map(item => item.value), [10, 15, 20, 30]);
  scene = command('Delete the second node', scene);
  assert.deepEqual(scene.items.map(item => item.id), ids);
});
test('empty removal, ambiguous values, unsupported speech and excessive arrays fail clearly', () => {
  assert.throws(() => command('Pop', emptyScene('stack')));
  assert.throws(() => command('Highlight 3', command('Create an array with 3, 3')));
  assert.throws(() => command('Please open your books'));
  assert.throws(() => command('Create an array with 1,2,3,4,5,6,7,8,9'));
});
test('each suggested command works in its example sequence', () => {
  for (const example of examples) {
    let scene = emptyScene(example.id);
    for (const prompt of example.prompts) scene = command(prompt, scene);
  }
});
test('scene snapshots support backward and forward stepping without mutation', () => {
  const frames = exampleFrames(examples[0]);
  assert.deepEqual(frames[1].scene.items.map(item => item.value), [8, 3, 5]);
  assert.deepEqual(frames[3].scene.items.map(item => item.value), [3, 8, 5]);
  assert.deepEqual(frames[1].scene.items.map(item => item.value), [8, 3, 5]);
});
