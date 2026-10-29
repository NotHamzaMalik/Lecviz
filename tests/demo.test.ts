import { test } from 'node:test';
import assert from 'node:assert/strict';
import { architectureLessons, architectureNodes, architectureRoutes, lessons, pointOnRoute, rainfall, waterLesson } from '../src/demo/lessons.ts';

test('architecture retains every layer and the arrow directions in the supplied diagram', () => {
  assert.deepEqual(architectureNodes.map(node => node.id), ['teacher', 'stt', 'llm', 'validation', 'error', 'output', 'renderer', 'manager', 'controls']);
  const nodes = Object.fromEntries(architectureNodes.map(node => [node.id, node]));
  assert.ok(nodes.stt.y < nodes.llm.y && nodes.llm.y < nodes.validation.y && nodes.validation.y < nodes.error.y);
  assert.ok(nodes.output.y < nodes.renderer.y && nodes.renderer.y < nodes.manager.y && nodes.manager.y < nodes.controls.y);
  assert.ok(nodes.teacher.x < nodes.stt.x && nodes.validation.x < nodes.manager.x);
  for (const id of ['render', 'display', 'corrected'] as const) assert.ok(architectureRoutes[id].points[0][1] > architectureRoutes[id].points[1][1]);
  assert.equal(architectureRoutes.fix.dashed, true);
});
test('invalid events cannot change the illustrated scene before a checked correction', () => {
  const steps = architectureLessons[1].steps;
  const managerIndex = steps.findIndex(step => step.architecture?.node === 'manager');
  assert.ok(managerIndex > steps.findIndex(step => step.architecture?.verdict === 'corrected'));
  for (const step of steps.slice(0, managerIndex)) assert.deepEqual(step.architecture?.values, [10, 20, 30]);
  assert.deepEqual(steps[managerIndex].architecture?.values, [10, 20]);
  assert.deepEqual(steps.at(-1)!.architecture?.values, [10, 20]);
});
test('the valid path applies a swap and demonstrates undo without altering the source', () => {
  const steps = architectureLessons[0].steps;
  assert.deepEqual(steps[0].architecture?.values, [8, 3, 5]);
  assert.deepEqual(steps.find(step => step.architecture?.node === 'output')?.architecture?.values, [3, 8, 5]);
  assert.deepEqual(steps.at(-1)!.architecture?.values, [8, 3, 5]);
});
test('animated packets stay on their routes with clamped progress', () => {
  assert.deepEqual(pointOnRoute([[0, 0], [10, 0], [10, 10]], .75), [10, 5]);
  for (const route of Object.values(architectureRoutes)) {
    assert.deepEqual(pointOnRoute(route.points, -1), route.points[0]);
    assert.deepEqual(pointOnRoute(route.points, 2), route.points.at(-1));
  }
});
test('water-cycle steps lead into a correctly labeled illustrative rainfall graph', () => {
  assert.deepEqual(waterLesson.steps.map(step => step.waterStage), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(rainfall.reduce((sum, value) => sum + value), 60);
  assert.equal(rainfall[1], rainfall[0] * 3);
  assert.match(waterLesson.steps[6].text, /illustrative/);
  assert.match(waterLesson.steps[8].text, /made-up/);
});
test('lesson identifiers and spoken-step identifiers are unique', () => {
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(lesson.steps.length > 0);
    assert.ok(lesson.steps.every(step => step.text.trim() && step.note.trim()));
  }
});
