export type Template = 'array' | 'bubble' | 'stack' | 'queue' | 'linked';
export type Item = { id: string; value: number };
export type Scene = { template: Template; items: Item[]; active: string[]; mode: 'idle' | 'compare' | 'swap' | 'highlight'; caption: string; nextId: number };
export type Action =
  | { type: 'create'; template: Template; values: number[] }
  | { type: 'compare' | 'swap'; indices: [number, number] }
  | { type: 'highlight'; indices: number[] }
  | { type: 'insert'; index: number; value: number }
  | { type: 'delete'; index: number }
  | { type: 'clear' };
export type Step = { text: string; actions: Action[]; note: string };
export type Example = { id: Template; title: string; label: string; description: string; concept: string; steps: Step[]; prompts: string[] };
export const emptyScene = (template: Template = 'bubble'): Scene => ({ template, items: [], active: [], mode: 'idle', caption: 'Ready when you are. Create a structure to begin.', nextId: 0 });

export function applyActions(previous: Scene, actions: Action[]): Scene {
  const scene = structuredClone(previous);
  const validIndex = (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= scene.items.length) throw new Error('That position does not exist in the current structure.');
  };
  for (const action of actions) {
    scene.active = [];
    scene.mode = 'idle';
    if (action.type === 'clear') { scene.items = []; scene.caption = 'Canvas cleared. Ready for a new explanation.'; }
    else if (action.type === 'create') {
      if (action.values.length > 8 || action.values.some(v => !Number.isFinite(v) || Math.abs(v) > 999)) throw new Error('Use up to 8 numbers between -999 and 999 for this showcase.');
      scene.template = action.template;
      scene.items = action.values.map(value => ({ id: `item-${scene.nextId++}`, value }));
      scene.caption = `Created ${action.values.length} elements. Each element keeps its identity as it moves.`;
    } else if (action.type === 'insert') {
      if (!Number.isInteger(action.index) || action.index < 0 || action.index > scene.items.length) throw new Error('Choose a position inside the structure or immediately after its last element.');
      if (scene.items.length >= 8) throw new Error('This showcase supports up to 8 elements. Remove one before adding another.');
      if (!Number.isFinite(action.value) || Math.abs(action.value) > 999) throw new Error('Use a number between -999 and 999.');
      const item = { id: `item-${scene.nextId++}`, value: action.value };
      scene.items.splice(action.index, 0, item);
      scene.active = [item.id]; scene.mode = 'highlight';
      scene.caption = `Inserted ${action.value} at position ${action.index + 1}.`;
    } else if (action.type === 'delete') {
      validIndex(action.index);
      const [removed] = scene.items.splice(action.index, 1);
      scene.caption = `Removed ${removed.value}. ${scene.items.length} elements remain.`;
    } else {
      action.indices.forEach(validIndex);
      scene.active = action.indices.map(index => scene.items[index].id);
      scene.mode = action.type;
      if (action.type === 'swap' || action.type === 'compare') {
        if (scene.template === 'stack' || scene.template === 'queue' || scene.template === 'linked') throw new Error('Compare and swap are available in the array examples.');
        const [a, b] = action.indices;
        const left = scene.items[a].value, right = scene.items[b].value;
        if (a === b) throw new Error('Choose two different positions.');
        if (action.type === 'swap') {
          [scene.items[a], scene.items[b]] = [scene.items[b], scene.items[a]];
          scene.caption = `${left} and ${right} exchange positions. Their values stay the same.`;
        } else scene.caption = `${left} ${left > right ? '>' : left < right ? '<' : '='} ${right}. ${left > right ? 'These elements can be swapped into ascending order.' : 'These elements are already in ascending order.'}`;
      } else scene.caption = `Highlighted ${action.indices.map(i => scene.items[i].value).join(' and ')} in the current structure.`;
    }
  }
  return scene;
}

const words: Record<string, string> = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', twenty: '20', thirty: '30', forty: '40', fifty: '50' };
const ordinals: Record<string, number> = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, sixth: 5, seventh: 6, eighth: 7 };
function numbers(text: string): number[] { return (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number); }
function position(text: string, scene: Scene): number | undefined {
  for (const [word, index] of Object.entries(ordinals)) if (new RegExp(`\\b${word}\\b`).test(text)) return index;
  if (/\b(last|top)\b/.test(text)) return scene.items.length - 1;
  const match = text.match(/(?:position|index)\s+(\d+)/);
  return match ? Number(match[1]) - (text.includes('index') ? 0 : 1) : undefined;
}

export function interpretCommand(raw: string, scene: Scene): Action[] {
  const text = raw.toLowerCase().replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty)\b/g, word => words[word]).replace(/\bminus\s+/g, '-').trim();
  if (/^(please\s+)?(clear|reset)( the)?( canvas| board| diagram)?[.!]?$/.test(text)) return [{ type: 'clear' }];
  if (/\b(create|start with|we have|consider|make)\b/.test(text)) {
    const template: Template = /linked list/.test(text) ? 'linked' : /stack/.test(text) ? 'stack' : /queue/.test(text) ? 'queue' : scene.template === 'bubble' ? 'bubble' : 'array';
    const listText = text.includes(':') ? text.split(':').slice(1).join(':') : text.replace(/^.*?(?:with|values|numbers|elements)\s*/, '');
    const values = numbers(listText);
    if (!values.length && !/empty/.test(text)) throw new Error('Include some numbers, for example: “Create an array with 8, 3, 5”.');
    return [{ type: 'create', template, values }];
  }
  if (/\b(compare|swap)\b/.test(text)) {
    let indices: number[] = [];
    if (/first (?:2|two)/.test(text)) indices = [0, 1];
    else {
      for (const match of text.matchAll(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth)\b/g)) indices.push(ordinals[match[0]]);
      if (indices.length < 2) indices = numbers(text).map(n => n - 1);
    }
    if (indices.length !== 2) throw new Error('Name two positions, for example: “Swap the first two” or “Compare the second and third”.');
    const pair: [number, number] = [indices[0], indices[1]];
    return [...(/\bcompare\b/.test(text) ? [{ type: 'compare' as const, indices: pair }] : []), ...(/\bswap\b/.test(text) ? [{ type: 'swap' as const, indices: pair }] : [])];
  }
  if (/\b(highlight|visit|traverse)\b/.test(text)) {
    if (!scene.items.length) throw new Error('Create a structure first.');
    let index = position(text, scene);
    if (/largest|maximum|biggest/.test(text)) index = scene.items.reduce((best, item, i) => item.value > scene.items[best].value ? i : best, 0);
    else if (/smallest|minimum/.test(text)) index = scene.items.reduce((best, item, i) => item.value < scene.items[best].value ? i : best, 0);
    else if (index === undefined) {
      const value = numbers(text)[0];
      const matches = scene.items.map((item, i) => item.value === value ? i : -1).filter(i => i >= 0);
      if (matches.length > 1) throw new Error('That value appears more than once. Please name its position.');
      index = matches[0];
    }
    if (index === undefined) throw new Error('Name an element or say “Highlight the largest number”.');
    return [{ type: 'highlight', indices: [index] }];
  }
  if (/\b(push|enqueue|append|insert)\b/.test(text)) {
    if (/push/.test(text) && scene.template !== 'stack') throw new Error('Choose the stack example to use push.');
    if (/enqueue/.test(text) && scene.template !== 'queue') throw new Error('Choose the queue example to use enqueue.');
    const value = numbers(text)[0];
    if (value === undefined) throw new Error('Include a value, for example: “Push 8”.');
    let index = scene.items.length;
    if (/insert/.test(text)) {
      const named = position(text, scene);
      if (named !== undefined) index = named + (/after/.test(text) ? 1 : 0);
    }
    return [{ type: 'insert', index, value }];
  }
  if (/\b(pop|dequeue|delete|remove)\b/.test(text)) {
    if (/pop/.test(text) && scene.template !== 'stack') throw new Error('Choose the stack example to use pop.');
    if (/dequeue/.test(text) && scene.template !== 'queue') throw new Error('Choose the queue example to use dequeue.');
    const index = /pop/.test(text) ? scene.items.length - 1 : /dequeue/.test(text) ? 0 : position(text, scene);
    if (index === undefined) throw new Error('Name a position, for example: “Delete the second node”.');
    return [{ type: 'delete', index }];
  }
  throw new Error('This prototype recognizes the example commands below. Try one, or play a guided example.');
}

export const examples: Example[] = [
  { id: 'bubble', title: 'A little order. A lot of understanding.', label: 'Bubble sort', description: 'Watch comparisons become swaps, one explanation at a time.', concept: 'Compare neighbors. Swap if needed. Repeat.', prompts: ['Create an array with 8, 3, 5', 'Compare the first two', 'Swap the first two', 'Highlight the largest number'], steps: [
    { text: 'Let’s start with three numbers: 8, 3, and 5.', actions: [{ type: 'create', template: 'bubble', values: [8, 3, 5] }], note: 'Build the array' },
    { text: 'Compare the first two elements, 8 and 3.', actions: [{ type: 'compare', indices: [0, 1] }], note: 'Compare neighbors' },
    { text: '8 is greater than 3. Swap the first two.', actions: [{ type: 'swap', indices: [0, 1] }], note: 'Swap into order' },
    { text: 'Now compare the second and third elements.', actions: [{ type: 'compare', indices: [1, 2] }], note: 'Continue the pass' },
    { text: '8 is greater than 5. Swap those two elements.', actions: [{ type: 'swap', indices: [1, 2] }], note: 'Move the largest right' },
    { text: 'Compare 3 and 5. They are already in order.', actions: [{ type: 'compare', indices: [0, 1] }], note: 'Check the remaining pair' },
    { text: 'The array is sorted. Highlight all three elements.', actions: [{ type: 'highlight', indices: [0, 1, 2] }], note: 'Sorted: 3, 5, 8' },
  ] },
  { id: 'array', title: 'Every element has its place.', label: 'Arrays', description: 'Create, find, and update an ordered collection.', concept: 'A value lives at an index. Indices start at zero.', prompts: ['Create an array with 4, 7, 2, 9', 'Highlight the largest number', 'Insert 6 at position 2', 'Delete the third element'], steps: [
    { text: 'Create an array with 4, 7, 2, and 9.', actions: [{ type: 'create', template: 'array', values: [4, 7, 2, 9] }], note: 'Create four elements' },
    { text: 'Highlight the first element. Its index is zero.', actions: [{ type: 'highlight', indices: [0] }], note: 'Understand zero-based indices' },
    { text: 'Insert 6 at the second position.', actions: [{ type: 'insert', index: 1, value: 6 }], note: 'Make room for a value' },
    { text: 'Delete the third element, which is now 7.', actions: [{ type: 'delete', index: 2 }], note: 'Close the gap' },
    { text: 'Highlight the largest number, 9.', actions: [{ type: 'highlight', indices: [3] }], note: 'Find the maximum' },
  ] },
  { id: 'stack', title: 'Last in. First to leave.', label: 'Stacks', description: 'See push and pop make the LIFO rule tangible.', concept: 'Add and remove from the top of the stack.', prompts: ['Create a stack with 2, 4', 'Push 8', 'Pop', 'Highlight the top'], steps: [
    { text: 'Create a stack with 2 at the bottom and 4 on top.', actions: [{ type: 'create', template: 'stack', values: [2, 4] }], note: 'Build the stack' },
    { text: 'Push 8 onto the stack.', actions: [{ type: 'insert', index: 2, value: 8 }], note: 'Push 8' },
    { text: 'Push 5. It becomes the new top.', actions: [{ type: 'insert', index: 3, value: 5 }], note: 'Push 5' },
    { text: 'Pop the stack. 5 leaves first.', actions: [{ type: 'delete', index: 3 }], note: 'Pop 5' },
    { text: 'The top is now 8. Highlight it.', actions: [{ type: 'highlight', indices: [2] }], note: 'Last in, first out' },
  ] },
  { id: 'queue', title: 'A fair way to take turns.', label: 'Queues', description: 'Follow each element from the rear to the front.', concept: 'Join at the rear. Leave from the front.', prompts: ['Create a queue with 3, 5, 8', 'Enqueue 2', 'Dequeue', 'Highlight the first element'], steps: [
    { text: 'Create a queue with 3, 5, and 8.', actions: [{ type: 'create', template: 'queue', values: [3, 5, 8] }], note: 'Build the queue' },
    { text: 'Enqueue 2. It joins at the rear.', actions: [{ type: 'insert', index: 3, value: 2 }], note: 'Enqueue at the rear' },
    { text: 'Dequeue. 3 leaves from the front.', actions: [{ type: 'delete', index: 0 }], note: 'First in, first out' },
    { text: 'Dequeue again. This time 5 leaves.', actions: [{ type: 'delete', index: 0 }], note: 'Advance the queue' },
    { text: '8 is now at the front. Highlight it.', actions: [{ type: 'highlight', indices: [0] }], note: 'A new front element' },
  ] },
  { id: 'linked', title: 'Small connections. One clear path.', label: 'Linked lists', description: 'Follow nodes and watch their connections update.', concept: 'Each node stores a value and a link to the next node.', prompts: ['Create a linked list with 10, 20, 30', 'Insert 15 after the first node', 'Delete the second node', 'Visit the last node'], steps: [
    { text: 'Create a linked list with 10, 20, and 30.', actions: [{ type: 'create', template: 'linked', values: [10, 20, 30] }], note: 'Connect three nodes' },
    { text: 'Visit the head node, 10.', actions: [{ type: 'highlight', indices: [0] }], note: 'Begin at the head' },
    { text: 'Insert 15 after the first node.', actions: [{ type: 'insert', index: 1, value: 15 }], note: 'Reconnect through 15' },
    { text: 'Delete the second node. Connect 10 back to 20.', actions: [{ type: 'delete', index: 1 }], note: 'Reconnect the remaining nodes' },
    { text: 'Visit the last node, 30. Its next pointer is null.', actions: [{ type: 'highlight', indices: [2] }], note: 'Reach the end' },
  ] },
];

export type Frame = { scene: Scene; text: string; note: string; source: 'example' | 'typed' | 'voice'; time: string };
export function exampleFrames(example: Example): Frame[] {
  let scene = emptyScene(example.id);
  return [{ scene, text: '', note: 'Ready', source: 'example' as const, time: '00:00' }, ...example.steps.map((step, i) => {
    scene = applyActions(scene, step.actions);
    return { scene, text: step.text, note: step.note, source: 'example' as const, time: `00:${String(i * 5).padStart(2, '0')}` };
  })];
}
